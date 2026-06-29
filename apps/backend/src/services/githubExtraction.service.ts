export function extractGithubUsername(githubUrl: string): string {
    const url = new URL(githubUrl).pathname;
    const username = url.replace("/", "");
    return username;
};

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

