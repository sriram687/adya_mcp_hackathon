import { z } from "zod";
import { biggoClient } from "../utils/biggo_client.js";
import { cache, generateCacheKey } from "../utils/cache.js";

// Price history with URL tool implementation
export function createPriceHistoryWithUrlTool(server: any) {
  server.tool(
    "price_history_with_url",
    "Extract product history from URL",
    {
      url: z.string().url().describe("Product URL to extract price history from"),
    },
    async ({ url }: {
      url: string;
    }) => {
      try {
        // Create cache key
        const cacheKey = generateCacheKey("price_history_url", url);
        
        // Check cache first
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
          return {
            content: [
              {
                type: "text",
                text: `BigGo Price History from URL (cached):\n\n${cachedResult}`,
              },
            ],
          };
        }

        // Make API request
        const response = await biggoClient.getPriceHistoryFromUrl(url);

        // Format the response
        const outputText = `BigGo Price History extracted from URL:\n\n${JSON.stringify(response, null, 2)}`;

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
        let errorMessage = 'An error occurred while extracting price history from URL';
        
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