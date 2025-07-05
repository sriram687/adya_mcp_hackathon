import { z } from "zod";
import axios from "axios";
import NodeCache from "node-cache";

// Cache for 1 hour
const cache = new NodeCache({ stdTTL: 3600 });

// Go Packages API response interfaces
interface GoPackage {
  path: string;
  synopsis: string;
  name: string;
  import_count: number;
  star_count: number;
  score: number;
  last_update: string;
  license: string;
  version: string;
  commit_time: string;
  home_page: string;
  repository: string;
  documentation: string;
}

interface GoPackagesResponse {
  results: GoPackage[];
  total: number;
}

// Go Packages search tool implementation
export function createGoPackagesSearchTool(server: any) {
  server.tool(
    "search_go_packages",
    "Search Go packages using the godoc.org API",
    {
      query: z.string().describe("Search query for Go packages"),
      limit: z.number().min(1).max(10).optional().default(5).describe("Maximum number of results to return (1-10)"),
    },
    async ({ query, limit }: {
      query: string;
      limit: number;
    }) => {
      try {
        // Create cache key
        const cacheKey = `go_packages:${query}:${limit}`;
        
        // Check cache first
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
          return {
            content: [
              {
                type: "text",
                text: `Go Packages Search Results (cached):\n\n${cachedResult}`,
              },
            ],
          };
        }

        // Prepare headers
        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'User-Agent': 'CODE-RESEARCH-MCP-Server'
        };

        // Make API request to godoc.org
        const response = await axios.get<GoPackagesResponse>(
          'https://api.godoc.org/search',
          {
            headers,
            params: {
              q: query,
              limit: limit
            },
            timeout: 10000
          }
        );

        // Format results
        const results = response.data.results.map(pkg => ({
          title: pkg.path,
          description: pkg.synopsis || 'No description available',
          url: `https://pkg.go.dev/${pkg.path}`,
          metadata: {
            name: pkg.name,
            import_count: pkg.import_count,
            star_count: pkg.star_count,
            score: pkg.score,
            last_update: pkg.last_update,
            license: pkg.license,
            version: pkg.version,
            commit_time: pkg.commit_time,
            home_page: pkg.home_page,
            repository: pkg.repository,
            documentation: pkg.documentation
          }
        }));

        // Format output text
        const resultsText = results.length > 0
          ? results.map((result, index) => 
              `${index + 1}. **${result.title}**\n` +
              `   Description: ${result.description}\n` +
              `   URL: ${result.url}\n` +
              `   Imports: ${result.metadata.import_count.toLocaleString()} | Stars: ${result.metadata.star_count.toLocaleString()}\n` +
              `   Score: ${result.metadata.score} | Version: ${result.metadata.version}\n` +
              `${result.metadata.license ? `   License: ${result.metadata.license}\n` : ''}` +
              `${result.metadata.home_page ? `   Homepage: ${result.metadata.home_page}\n` : ''}` +
              `${result.metadata.repository ? `   Repository: ${result.metadata.repository}\n` : ''}` +
              `${result.metadata.documentation ? `   Documentation: ${result.metadata.documentation}\n` : ''}` +
              `   Last Update: ${new Date(result.metadata.last_update).toLocaleDateString()}\n`
            ).join('\n')
          : 'No packages found';

        const outputText = `Go Packages Search Results for "${query}":\n\n${resultsText}\n\nTotal results: ${response.data.total}`;

        // Cache the result
        cache.set(cacheKey, outputText);

        return {
          content: [
            {
              type: "text",
              text: outputText,
            },
          ],
        };
      } catch (error) {
        let errorMessage = 'An error occurred while searching Go packages';
        
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 429) {
            errorMessage = 'Go packages API rate limit exceeded. Please try again later.';
          } else if (error.response?.status === 404) {
            errorMessage = 'Go packages API endpoint not found.';
          } else if (error.response?.status) {
            errorMessage = `Go packages API error: ${error.response.status} - ${error.response.statusText}`;
          } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'Go packages API request timed out. Please try again.';
          } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'Unable to reach godoc.org. Please check your internet connection.';
          } else {
            errorMessage = `Network error: ${error.message}`;
          }
        } else if (error instanceof Error) {
          errorMessage = `Error: ${error.message}`;
        }

        return {
          content: [
            {
              type: "text",
              text: errorMessage,
            },
          ],
        };
      }
    }
  );
} 