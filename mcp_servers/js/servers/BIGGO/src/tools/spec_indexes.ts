import { z } from "zod";
import { biggoClient } from "../utils/biggo_client.js";
import { cache, generateCacheKey } from "../utils/cache.js";

// Spec indexes tool implementation
export function createSpecIndexesTool(server: any) {
  server.tool(
    "spec_indexes",
    "List all available Elasticsearch indexes",
    {},
    async () => {
      try {
        // Create cache key
        const cacheKey = generateCacheKey("spec_indexes");
        
        // Check cache first
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
          return {
            content: [
              {
                type: "text",
                text: `BigGo Spec Indexes (cached):\n\n${cachedResult}`,
              },
            ],
          };
        }

        // Make API request
        const response = await biggoClient.getSpecIndexes();

        // Format the response
        const indexes = response.indexes || response.indices || response || [];
        
        if (indexes.length === 0) {
          const outputText = "No spec indexes found";
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

        const indexesText = indexes.map((index: any, i: number) => 
          `${i + 1}. ${index.name || index.index || index}\n` +
          `   Description: ${index.description || 'N/A'}\n` +
          `   Document Count: ${index.doc_count || index.count || 'N/A'}`
        ).join('\n\n');

        const outputText = `Available BigGo Spec Indexes:\n\n${indexesText}`;

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
        let errorMessage = 'An error occurred while fetching spec indexes';
        
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