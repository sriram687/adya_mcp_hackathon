import { z } from "zod";
import { biggoClient } from "../utils/biggo_client.js";
import { cache, generateCacheKey } from "../utils/cache.js";

// Spec search tool implementation
export function createSpecSearchTool(server: any) {
  server.tool(
    "spec_search",
    "Query ES with structured specs (e.g., ram: 16GB, water_resistance: high)",
    {
      indexName: z.string().describe("Name of the Elasticsearch index to search"),
      query: z.string().describe("Structured query string (e.g., 'ram: 16GB, water_resistance: high')"),
      limit: z.number().min(1).max(100).optional().default(10).describe("Maximum number of results to return"),
    },
    async ({ indexName, query, limit }: {
      indexName: string;
      query: string;
      limit: number;
    }) => {
      try {
        // Create cache key
        const cacheKey = generateCacheKey("spec_search", indexName, query, limit.toString());
        
        // Check cache first
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
          return {
            content: [
              {
                type: "text",
                text: `BigGo Spec Search Results (cached):\n\n${cachedResult}`,
              },
            ],
          };
        }

        // Parse the query string into structured format
        const queryObj: any = {};
        const pairs = query.split(',').map(pair => pair.trim());
        
        for (const pair of pairs) {
          const [key, value] = pair.split(':').map(s => s.trim());
          if (key && value) {
            queryObj[key] = value;
          }
        }

        // Make API request
        const response = await biggoClient.searchSpecs(indexName, {
          query: queryObj,
          size: limit
        });

        // Format results
        const results = response.hits?.hits || response.results || response || [];
        
        if (results.length === 0) {
          const outputText = `No results found for query "${query}" in index "${indexName}"`;
          cache.set(cacheKey, outputText);
          return {
            content: [
              {
                type: "text",
                text: outputText,
              },
            ],
          };
        }

        // Format output text
        const resultsText = results.map((hit: any, index: number) => {
          const source = hit._source || hit.source || hit;
          const score = hit._score || hit.score || 'N/A';
          
          return `${index + 1}. **Score: ${score}**\n` +
                 `   ${JSON.stringify(source, null, 2)}`;
        }).join('\n\n');

        const outputText = `BigGo Spec Search Results for "${query}" in index "${indexName}":\n\n${resultsText}\n\nTotal results: ${results.length}`;

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
      } catch (error: any) {
        let errorMessage = 'An error occurred while searching specs';
        
        if (error.message) {
          errorMessage = error.message;
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