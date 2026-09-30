import type { GithubGraphQLResponse } from "../types/githubGraphql.types";
import { logger } from "../lib/logger";

const graphqlQuery = `
query ($username: String!) {
  user(login: $username) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
      }

      pullRequestContributionsByRepository(maxRepositories: 4) {
        repository {
          name
          url
          owner {
            login
          }
        }
        contributions(first: 100) {
          totalCount
        }
      }
    }
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes {
        ... on Repository {
          name
          description
          url
          stargazerCount

          primaryLanguage {
            name
          }
        }
      }
    }

    repositories(
      first: 5
      orderBy: { field: UPDATED_AT, direction: DESC }
    ) {
      nodes {
        name
        description
        url
        stargazerCount
        updatedAt

        languages(first: 5, orderBy: { field: SIZE, direction: DESC }) {
          nodes {
            name
          }
        }
      }
    }
  }
}
`;

export function extractGithubUsername(githubUrl: string): string {
    if (!githubUrl || typeof githubUrl !== "string") return "";
    
    let trimmed = githubUrl.trim().replace(/\/+$/, "");
    if (!trimmed) return "";

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        if (trimmed.startsWith("github.com/")) {
            trimmed = "https://" + trimmed;
        } else if (!trimmed.includes("/")) {
            return trimmed.replace(/^@/, "");
        } else {
            trimmed = "https://github.com/" + trimmed;
        }
    }

    try {
        const parsed = new URL(trimmed);
        const parts = parsed.pathname.split("/").filter(Boolean);
        return parts[0] || "";
    } catch {
        return trimmed.replace(/^https?:\/\/(www\.)?github\.com\//, "").split("/")[0].replace(/^@/, "") || "";
    }
}

export async function getGithubData(username: string) {
    if (!username) return null;

    // 1. Try GraphQL API first if process.env.GITHUB_TOKEN is provided
    if (process.env.GITHUB_TOKEN) {
        try {
            const response = await fetch("https://api.github.com/graphql", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                    "Content-Type": "application/json",
                    "User-Agent": "Interviewlyy-App",
                },
                body: JSON.stringify({
                    query: graphqlQuery,
                    variables: { username },
                }),
            });

            if (response.ok) {
                const data = (await response.json()) as GithubGraphQLResponse;
                if (data?.data?.user) {
                    logger.info({ username }, "Successfully fetched GitHub GraphQL data");
                    return data.data.user;
                }
            } else {
                logger.warn({ username, status: response.status }, "GitHub GraphQL request failed (e.g. invalid GITHUB_TOKEN or rate limit), falling back to REST API");
            }
        } catch (err) {
            logger.warn({ username, err }, "GitHub GraphQL request threw error, falling back to REST API");
        }
    }

    // 2. Fallback to GitHub REST API (works for public data without requiring an API key)
    try {
        logger.info({ username }, "Fetching GitHub data via public REST API fallback");
        const headers: Record<string, string> = {
            "User-Agent": "Interviewlyy-App",
        };

        const [userRes, reposRes] = await Promise.all([
            fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers }),
            fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=6`, { headers }),
        ]);

        if (!userRes.ok) {
            logger.warn({ username, status: userRes.status }, "GitHub REST API user fetch failed");
            return null;
        }

        const user = await userRes.json();
        const repos = reposRes.ok ? await reposRes.json() : [];

        return {
            username: user.login,
            name: user.name,
            bio: user.bio,
            publicRepos: user.public_repos,
            followers: user.followers,
            repositories: {
                nodes: repos.map((r: any) => ({
                    name: r.name,
                    description: r.description,
                    url: r.html_url,
                    stargazerCount: r.stargazers_count,
                    updatedAt: r.updated_at,
                    primaryLanguage: r.language ? { name: r.language } : null,
                })),
            },
        };
    } catch (err) {
        logger.error({ username, err }, "Failed to fetch GitHub data via REST API fallback");
        return null;
    }
}
