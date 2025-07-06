import { z } from "zod";
import { biggoClient } from "../utils/biggo_client.js";
import { cache, generateCacheKey } from "../utils/cache.js";

// Product search tool implementation
export function createProductSearchTool(server: any) {
  server.tool(
    "product_search",
    "Search products using BigGo's API",
    {
      query: z.string().describe("Search query for products"),
      region: z.string().optional().describe("Region for search (e.g., US, TW, IN)"),
      limit: z.number().min(1).max(50).optional().default(10).describe("Maximum number of results to return"),
    },
    async ({ query, region, limit }: {
      query: string;
      region?: string;
      limit: number;
    }) => {
      try {
        // Create cache key
        const cacheKey = generateCacheKey("product_search", query, region || "default", limit.toString());
        
        // Check cache first
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
          return {
            content: [
              {
                type: "text",
                text: `BigGo Product Search Results (cached):\n\n${cachedResult}`,
              },
            ],
          };
        }

        // Make API request
        const response = await biggoClient.searchProducts(query, region, limit);

        // Format results
        const results = response.products || response.items || [];
        
        if (results.length === 0) {
          const outputText = `No products found for "${query}" in region ${region || biggoClient.getRegion()}`;
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
        const resultsText = results.map((product: any, index: number) => 
          `${index + 1}. **${product.title || product.name}**\n` +
          `   Price: ${product.price || 'N/A'} ${product.currency || ''}\n` +
          `   URL: ${product.url || product.link || 'N/A'}\n` +
          `   Image: ${product.image || product.image_url || 'N/A'}\n` +
          `   Rating: ${product.rating || product.stars || 'N/A'}\n` +
          `   Store: ${product.store || product.seller || 'N/A'}\n`
        ).join('\n');

        const outputText = `BigGo Product Search Results for "${query}" in region ${region || biggoClient.getRegion()}:\n\n${resultsText}\n\nTotal results: ${results.length}`;

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
        let errorMessage = 'An error occurred while searching BigGo products';
        
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