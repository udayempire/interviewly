export interface GithubGraphQLResponse {
    data: {
        user: {
            contributionsCollection: {
                contributionCalendar: { totalContributions: number };
                pullRequestContributionsByRepository: {
                    repository: { name: string; url: string };
                    contributions: { totalCount: number };
                }[];
            };
            pinnedItems: {
                nodes: {
                    name: string;
                    description: string;
                    url: string;
                    stargazerCount: number;
                    primaryLanguage: { name: string } | null;
                }[];
            };
            repositories: {
                nodes: {
                    name: string;
                    description: string;
                    url: string;
                    stargazerCount: number;
                    updatedAt: string;
                    languages: { nodes: { name: string }[] };
                }[];
            };
        };
    };
}
