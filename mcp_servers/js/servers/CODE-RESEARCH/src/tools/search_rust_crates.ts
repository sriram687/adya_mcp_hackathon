import { z } from "zod";
import axios from "axios";
import NodeCache from "node-cache";

// Cache for 1 hour
const cache = new NodeCache({ stdTTL: 3600 });

// Rust Crates API response interfaces
interface RustCrate {
  id: string;
  name: string;
  description: string | null;
  version: string;
  downloads: number;
  documentation: string | null;
  repository: string | null;
  homepage: string | null;
  license: string | null;
  keywords: string[];
  categories: string[];
  created_at: string;
  updated_at: string;
  max_version: string;
  links: {
    version_downloads: string;
    version_downloads_precise: string;
    owners: string;
    owner_team: string;
    owner_user: string;
    reverse_dependencies: string;
  };
}

interface RustCratesResponse {
  crates: RustCrate[];
  meta: {
    total: number;
  };
}

// Rust Crates search tool implementation
export function createRustCratesSearchTool(server: any) {
  server.tool(
    "search_rust_crates",
    "Search Rust crates using the crates.io API",
    {
      query: z.string().describe("Search query for Rust crates"),
      limit: z.number().min(1).max(10).optional().default(5).describe("Maximum number of results to return (1-10)"),
    },
    async ({ query, limit }: {
      query: string;
      limit: number;
    }) => {
      try {
        // Create cache key
        const cacheKey = `rust_crates:${query}:${limit}`;
        
        // Check cache first
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
          return {
            content: [
              {
                type: "text",
                text: `Rust Crates Search Results (cached):\n\n${cachedResult}`,
              },
            ],
          };
        }

        // Prepare headers
        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'User-Agent': 'CODE-RESEARCH-MCP-Server'
        };

        // Make API request to crates.io
        const response = await axios.get<RustCratesResponse>(
          'https://crates.io/api/v1/crates',
          {
            headers,
            params: {
              q: query,
              per_page: limit,
              page: 1
            },
            timeout: 10000
          }
        );

        // Format results
        const results = response.data.crates.map(crate => ({
          title: crate.name,
          description: crate.description || 'No description available',
          url: `https://crates.io/crates/${crate.name}`,
          metadata: {
            version: crate.max_version,
            downloads: crate.downloads,
            documentation_url: crate.documentation,
            repository: crate.repository,
            homepage: crate.homepage,
            license: crate.license,
            keywords: crate.keywords,
            categories: crate.categories,
            created_at: crate.created_at,
            updated_at: crate.updated_at
          }
        }));

        // Format output text
        const resultsText = results.length > 0
          ? results.map((result, index) => 
              `${index + 1}. **${result.title}** (v${result.metadata.version})\n` +
              `   Description: ${result.description}\n` +
              `   Downloads: ${result.metadata.downloads.toLocaleString()}\n` +
              `   URL: ${result.url}\n` +
              `${result.metadata.documentation_url ? `   Documentation: ${result.metadata.documentation_url}\n` : ''}` +
              `${result.metadata.repository ? `   Repository: ${result.metadata.repository}\n` : ''}` +
              `${result.metadata.homepage ? `   Homepage: ${result.metadata.homepage}\n` : ''}` +
              `${result.metadata.license ? `   License: ${result.metadata.license}\n` : ''}` +
              `${result.metadata.keywords.length > 0 ? `   Keywords: ${result.metadata.keywords.join(', ')}\n` : ''}` +
              `${result.metadata.categories.length > 0 ? `   Categories: ${result.metadata.categories.join(', ')}\n` : ''}` +
              `   Updated: ${new Date(result.metadata.updated_at).toLocaleDateString()}\n`
            ).join('\n')
          : 'No crates found';

        const outputText = `Rust Crates Search Results for "${query}":\n\n${resultsText}\n\nTotal results: ${response.data.meta.total}`;

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
        let errorMessage = 'An error occurred while searching Rust crates';
        
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 429) {
            errorMessage = 'Crates.io API rate limit exceeded. Please try again later.';
          } else if (error.response?.status === 404) {
            errorMessage = 'Crates.io API endpoint not found.';
          } else if (error.response?.status) {
            errorMessage = `Crates.io API error: ${error.response.status} - ${error.response.statusText}`;
          } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'Crates.io API request timed out. Please try again.';
          } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'Unable to reach crates.io. Please check your internet connection.';
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