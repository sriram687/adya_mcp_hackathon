import { z } from "zod";
import { biggoClient } from "../utils/biggo_client.js";
import { cache, generateCacheKey } from "../utils/cache.js";

// Price history graph tool implementation
export function createPriceHistoryGraphTool(server: any) {
  server.tool(
    "price_history_graph",
    "Return BigGo chart URL or raw data for price history",
    {
      productId: z.string().describe("Product ID for price history"),
      region: z.string().optional().describe("Region for price history (e.g., US, TW, IN)"),
      format: z.enum(["url", "data"]).optional().default("url").describe("Return format: 'url' for chart URL or 'data' for raw data"),
    },
    async ({ productId, region, format }: {
      productId: string;
      region?: string;
      format: string;
    }) => {
      try {
        // Create cache key
        const cacheKey = generateCacheKey("price_history_graph", productId, region || "default", format);
        
        // Check cache first
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
          return {
            content: [
              {
                type: "text",
                text: `BigGo Price History Graph (cached):\n\n${cachedResult}`,
              },
            ],
          };
        }

        // Make API request
        const response = await biggoClient.getPriceHistoryGraph(productId, region);

        let outputText: string;

        if (format === "url") {
          // Return chart URL
          const chartUrl = response.chart_url || response.url || "Chart URL not available";
          outputText = `BigGo Price History Chart URL for product ${productId}:\n\n${chartUrl}`;
        } else {
          // Return raw data
          const priceData = response.price_data || response.data || response;
          outputText = `BigGo Price History Data for product ${productId}:\n\n${JSON.stringify(priceData, null, 2)}`;
        }

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
        let errorMessage = 'An error occurred while fetching price history graph';
        
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