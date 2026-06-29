import type { GithubGraphQLResponse } from "../types/githubGraphql.types";

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
`

export function extractGithubUsername(githubUrl: string): string {
    const url = new URL(githubUrl).pathname;
    const username = url.replace("/", "");
    return username;
};

export async function getGithubData(username: string) {
    const response = await fetch("https://api.github.com/graphql",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                "Content-Type": "application/json",
            },
            // fetch expects body to be a string, Blob, FormData, etc. It doesn't automatically convert JavaScript objects to JSON.
            body: JSON.stringify({
                query:graphqlQuery,
                variables:{
                    username
                },
            }),
        }
    );
    if(!response.ok){
        throw new Error("Github request failed");
    }
    const data = (await response.json()) as GithubGraphQLResponse;
    return data.data.user;
}

