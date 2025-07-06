import { z } from "zod";
import { biggoClient } from "../utils/biggo_client.js";
import { cache, generateCacheKey } from "../utils/cache.js";

// Price history with history ID tool implementation
export function createPriceHistoryWithHistoryIdTool(server: any) {
  server.tool(
    "price_history_with_history_id",
    "Use BigGo internal history_id to get price history",
    {
      historyId: z.string().describe("BigGo internal history ID"),
    },
    async ({ historyId }: {
      historyId: string;
    }) => {
      try {
        // Create cache key
        const cacheKey = generateCacheKey("price_history_history_id", historyId);
        
        // Check cache first
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
          return {
            content: [
              {
                type: "text",
                text: `BigGo Price History with History ID (cached):\n\n${cachedResult}`,
              },
            ],
          };
        }

        // Make API request
        const response = await biggoClient.getPriceHistoryWithHistoryId(historyId);

        // Format the response
        const outputText = `BigGo Price History for History ID ${historyId}:\n\n${JSON.stringify(response, null, 2)}`;

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
        let errorMessage = 'An error occurred while fetching price history with history ID';
        
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