import { z } from "zod";
import { biggoClient } from "../utils/biggo_client.js";
import { cache, generateCacheKey } from "../utils/cache.js";

// Spec mapping tool implementation
export function createSpecMappingTool(server: any) {
  server.tool(
    "spec_mapping",
    "Return index mappings with field types",
    {
      indexName: z.string().describe("Name of the Elasticsearch index"),
    },
    async ({ indexName }: {
      indexName: string;
    }) => {
      try {
        // Create cache key
        const cacheKey = generateCacheKey("spec_mapping", indexName);
        
        // Check cache first
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
          return {
            content: [
              {
                type: "text",
                text: `BigGo Spec Mapping (cached):\n\n${cachedResult}`,
              },
            ],
          };
        }

        // Make API request
        const response = await biggoClient.getSpecMapping(indexName);

        // Format the response
        const mapping = response.mapping || response.mappings || response;
        
        if (!mapping || Object.keys(mapping).length === 0) {
          const outputText = `No mapping found for index: ${indexName}`;
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

        const outputText = `BigGo Spec Mapping for index "${indexName}":\n\n${JSON.stringify(mapping, null, 2)}`;

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
        let errorMessage = 'An error occurred while fetching spec mapping';
        
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