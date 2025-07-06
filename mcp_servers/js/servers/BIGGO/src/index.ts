#!/usr/bin/env node
import dotenv from "dotenv";
dotenv.config();

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import axios, { AxiosInstance } from "axios";
import { z } from "zod";
import NodeCache from "node-cache";

// Print environment variables at startup
function printEnvVars() {
  const clientId = process.env.BIGGO_MCP_SERVER_CLIENT_ID;
  const clientSecret = process.env.BIGGO_MCP_SERVER_CLIENT_SECRET;
  const region = process.env.BIGGO_MCP_SERVER_REGION;

  console.log("================ BIGGO MCP SERVER ENVIRONMENT ================");
  console.log("BIGGO_MCP_SERVER_CLIENT_ID:", clientId ? clientId : "[NOT SET]");
  console.log("BIGGO_MCP_SERVER_CLIENT_SECRET:", clientSecret ? "[SET]" : "[NOT SET]");
  console.log("BIGGO_MCP_SERVER_REGION:", region ? region : "[NOT SET] (default: TW)");
  if (!clientId || !clientSecret) {
    console.warn("⚠️  Warning: BIGGO_MCP_SERVER_CLIENT_ID and/or BIGGO_MCP_SERVER_CLIENT_SECRET are not set. Please create a .env file with your BigGo API credentials.");
  }
  console.log("==============================================================\n");
}

printEnvVars();

// ============================================================================
// CACHE UTILITIES
// ============================================================================

// Cache for 1 hour (3600 seconds)
const cache = new NodeCache({ stdTTL: 3600 });

// Helper function to generate cache keys
function generateCacheKey(prefix: string, ...params: any[]): string {
  return `${prefix}:${params.join(':')}`;
}

// Helper function to get cached data or set new data
async function getCachedOrFetch<T>(
  cacheKey: string,
  fetchFunction: () => Promise<T>
): Promise<T> {
  const cachedResult = cache.get<T>(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  const result = await fetchFunction();
  cache.set(cacheKey, result);
  return result;
}

// ============================================================================
// BIGGO CLIENT
// ============================================================================

// BigGo API client class
class BigGoClient {
  private client: AxiosInstance;
  private clientId: string;
  private clientSecret: string;
  private region: string;

  constructor() {
    this.clientId = process.env.BIGGO_MCP_SERVER_CLIENT_ID || "";
    this.clientSecret = process.env.BIGGO_MCP_SERVER_CLIENT_SECRET || "";
    this.region = process.env.BIGGO_MCP_SERVER_REGION || "TW";

    // Don't throw error in constructor - let individual methods handle missing credentials

    this.client = axios.create({
      baseURL: "https://api.biggo.com",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "BigGo-MCP-Server/1.0.0"
      }
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use((config) => {
      // Add authentication headers if needed
      if (config.url?.includes("/auth")) {
        config.auth = {
          username: this.clientId,
          password: this.clientSecret
        };
      }
      return config;
    });
  }

  // Update credentials from args (for client-side credential passing)
  updateCredentials(credentials: any) {
    if (credentials?.client_id) {
      this.clientId = credentials.client_id;
    }
    if (credentials?.client_secret) {
      this.clientSecret = credentials.client_secret;
    }
    if (credentials?.region) {
      this.region = credentials.region;
    }
  }

  // Get current region
  getRegion(): string {
    return this.region;
  }

  // Make authenticated request
  async request<T>(config: any): Promise<T> {
    // Check credentials first
    if (!this.clientId || !this.clientSecret) {
      throw new Error("BIGGO_MCP_SERVER_CLIENT_ID and BIGGO_MCP_SERVER_CLIENT_SECRET are required. Please set these environment variables in your .env file.");
    }

    try {
      const response = await this.client.request<T>(config);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("BigGo API authentication failed. Please check your credentials.");
        } else if (error.response?.status === 429) {
          throw new Error("BigGo API rate limit exceeded. Please try again later.");
        } else if (error.response?.status) {
          throw new Error(`BigGo API error: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.code === 'ECONNABORTED') {
          throw new Error("BigGo API request timed out. Please try again.");
        } else {
          throw new Error(`Network error: ${error.message}`);
        }
      } else {
        throw new Error(`Error: ${error.message}`);
      }
    }
  }

  // Product search
  async searchProducts(query: string, region?: string, limit?: number): Promise<any> {
    return this.request({
      method: "GET",
      url: "/v1/products/search",
      params: {
        q: query,
        region: region || this.region,
        limit: limit || 10
      }
    });
  }

  // Get price history graph
  async getPriceHistoryGraph(productId: string, region?: string): Promise<any> {
    return this.request({
      method: "GET",
      url: `/v1/products/${productId}/price-history/graph`,
      params: {
        region: region || this.region
      }
    });
  }

  // Get price history with history ID
  async getPriceHistoryWithHistoryId(historyId: string): Promise<any> {
    return this.request({
      method: "GET",
      url: `/v1/price-history/${historyId}`
    });
  }

  // Get price history from URL
  async getPriceHistoryFromUrl(url: string): Promise<any> {
    return this.request({
      method: "GET",
      url: "/v1/price-history/from-url",
      params: { url }
    });
  }

  // Get spec indexes
  async getSpecIndexes(): Promise<any> {
    return this.request({
      method: "GET",
      url: "/v1/specs/indexes"
    });
  }

  // Get spec mapping
  async getSpecMapping(indexName: string): Promise<any> {
    return this.request({
      method: "GET",
      url: `/v1/specs/mapping/${indexName}`
    });
  }

  // Search specs
  async searchSpecs(indexName: string, query: any): Promise<any> {
    return this.request({
      method: "POST",
      url: `/v1/specs/search/${indexName}`,
      data: query
    });
  }
}

// Create singleton instance
const biggoClient = new BigGoClient();

// ============================================================================
// TOOL IMPLEMENTATIONS
// ============================================================================

// Product search tool implementation
function createProductSearchTool(server: any) {
  server.tool(
    "product_search",
    "Search products using BigGo's API",
    {
      query: z.string().describe("Search query for products"),
      region: z.string().optional().describe("Region for search (e.g., US, TW, IN)"),
      limit: z.number().min(1).max(50).optional().default(10).describe("Maximum number of results to return"),
    },
    async ({ query, region, limit, __credentials__ }: {
      query: string;
      region?: string;
      limit: number;
      __credentials__?: any;
    }) => {
      // Update credentials if provided via args
      if (__credentials__) {
        biggoClient.updateCredentials(__credentials__);
      }
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

// Price history graph tool implementation
function createPriceHistoryGraphTool(server: any) {
  server.tool(
    "price_history_graph",
    "Get price history graph for a product",
    {
      productId: z.string().describe("Product ID to get price history for"),
      region: z.string().optional().describe("Region for the product (e.g., US, TW, IN)"),
    },
    async ({ productId, region, __credentials__ }: {
      productId: string;
      region?: string;
      __credentials__?: any;
    }) => {
      // Update credentials if provided via args
      if (__credentials__) {
        biggoClient.updateCredentials(__credentials__);
      }
      try {
        const cacheKey = generateCacheKey("price_history_graph", productId, region || "default");
        
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

        const response = await biggoClient.getPriceHistoryGraph(productId, region);
        
        if (!response || !response.data) {
          const outputText = `No price history data found for product ID: ${productId}`;
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

        const outputText = `BigGo Price History Graph for Product ID: ${productId}\n\n${JSON.stringify(response, null, 2)}`;
        
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
        let errorMessage = 'An error occurred while getting price history graph';
        
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

// Price history with history ID tool implementation
function createPriceHistoryWithHistoryIdTool(server: any) {
  server.tool(
    "price_history_with_history_id",
    "Get price history using a specific history ID",
    {
      historyId: z.string().describe("History ID to get price history for"),
    },
    async ({ historyId, __credentials__ }: {
      historyId: string;
      __credentials__?: any;
    }) => {
      // Update credentials if provided via args
      if (__credentials__) {
        biggoClient.updateCredentials(__credentials__);
      }
      try {
        const cacheKey = generateCacheKey("price_history_with_history_id", historyId);
        
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
          return {
            content: [
              {
                type: "text",
                text: `BigGo Price History (cached):\n\n${cachedResult}`,
              },
            ],
          };
        }

        const response = await biggoClient.getPriceHistoryWithHistoryId(historyId);
        
        if (!response || !response.data) {
          const outputText = `No price history data found for history ID: ${historyId}`;
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

        const outputText = `BigGo Price History for History ID: ${historyId}\n\n${JSON.stringify(response, null, 2)}`;
        
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
        let errorMessage = 'An error occurred while getting price history';
        
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

// Price history from URL tool implementation
function createPriceHistoryWithUrlTool(server: any) {
  server.tool(
    "price_history_with_url",
    "Get price history from a product URL",
    {
      url: z.string().url().describe("Product URL to get price history for"),
    },
    async ({ url, __credentials__ }: {
      url: string;
      __credentials__?: any;
    }) => {
      // Update credentials if provided via args
      if (__credentials__) {
        biggoClient.updateCredentials(__credentials__);
      }
      try {
        const cacheKey = generateCacheKey("price_history_with_url", url);
        
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

        const response = await biggoClient.getPriceHistoryFromUrl(url);
        
        if (!response || !response.data) {
          const outputText = `No price history data found for URL: ${url}`;
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

        const outputText = `BigGo Price History from URL: ${url}\n\n${JSON.stringify(response, null, 2)}`;
        
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
        let errorMessage = 'An error occurred while getting price history from URL';
        
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

// Spec indexes tool implementation
function createSpecIndexesTool(server: any) {
  server.tool(
    "spec_indexes",
    "Get available spec indexes from BigGo",
    {
      __credentials__: z.object({}).optional().describe("BigGo API credentials"),
    },
    async ({ __credentials__ }: {
      __credentials__?: any;
    } = {}) => {
      // Update credentials if provided via args
      if (__credentials__) {
        biggoClient.updateCredentials(__credentials__);
      }
      try {
        const cacheKey = generateCacheKey("spec_indexes");
        
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

        const response = await biggoClient.getSpecIndexes();
        
        if (!response || !response.indexes) {
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

        const outputText = `BigGo Available Spec Indexes:\n\n${JSON.stringify(response, null, 2)}`;
        
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
        let errorMessage = 'An error occurred while getting spec indexes';
        
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

// Spec mapping tool implementation
function createSpecMappingTool(server: any) {
  server.tool(
    "spec_mapping",
    "Get spec mapping for a specific index",
    {
      indexName: z.string().describe("Name of the spec index to get mapping for"),
    },
    async ({ indexName, __credentials__ }: {
      indexName: string;
      __credentials__?: any;
    }) => {
      // Update credentials if provided via args
      if (__credentials__) {
        biggoClient.updateCredentials(__credentials__);
      }
      try {
        const cacheKey = generateCacheKey("spec_mapping", indexName);
        
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

        const response = await biggoClient.getSpecMapping(indexName);
        
        if (!response || !response.mapping) {
          const outputText = `No spec mapping found for index: ${indexName}`;
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

        const outputText = `BigGo Spec Mapping for Index: ${indexName}\n\n${JSON.stringify(response, null, 2)}`;
        
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
        let errorMessage = 'An error occurred while getting spec mapping';
        
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

// Spec search tool implementation
function createSpecSearchTool(server: any) {
  server.tool(
    "spec_search",
    "Search specs using BigGo's spec search API",
    {
      indexName: z.string().describe("Name of the spec index to search in"),
      query: z.object({}).passthrough().describe("Search query object for specs"),
    },
    async ({ indexName, query, __credentials__ }: {
      indexName: string;
      query: any;
      __credentials__?: any;
    }) => {
      // Update credentials if provided via args
      if (__credentials__) {
        biggoClient.updateCredentials(__credentials__);
      }
      try {
        const cacheKey = generateCacheKey("spec_search", indexName, JSON.stringify(query));
        
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

        const response = await biggoClient.searchSpecs(indexName, query);
        
        if (!response || !response.results) {
          const outputText = `No spec search results found for index: ${indexName}`;
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

        const outputText = `BigGo Spec Search Results for Index: ${indexName}\n\n${JSON.stringify(response, null, 2)}`;
        
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

// Get current region tool implementation
function createGetCurrentRegionTool(server: any) {
  server.tool(
    "get_current_region",
    "Returns region currently active from .env",
    {
      __credentials__: z.object({}).optional().describe("BigGo API credentials"),
    },
    async ({ __credentials__ }: {
      __credentials__?: any;
    } = {}) => {
      // Update credentials if provided via args
      if (__credentials__) {
        biggoClient.updateCredentials(__credentials__);
      }
      try {
        const region = biggoClient.getRegion();
        
        // Check if credentials are set
        const clientId = process.env.BIGGO_MCP_SERVER_CLIENT_ID;
        const clientSecret = process.env.BIGGO_MCP_SERVER_CLIENT_SECRET;
        
        if (!clientId || !clientSecret) {
          return {
            content: [
              {
                type: "text",
                text: `Current BigGo region: ${region}\n\n⚠️  Warning: BIGGO_MCP_SERVER_CLIENT_ID and BIGGO_MCP_SERVER_CLIENT_SECRET are not set. Please create a .env file with your BigGo API credentials to use other tools.`,
              },
            ],
          };
        }
        
        const outputText = `Current BigGo region: ${region}`;

        return {
          content: [
            {
              type: "text",
              text: outputText,
            },
          ],
        };
      } catch (error: any) {
        let errorMessage = 'An error occurred while getting current region';
        
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

// ============================================================================
// SERVER SETUP
// ============================================================================

// Create server instance
const server = new McpServer({
  name: "biggo",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Register tools
createProductSearchTool(server);
createPriceHistoryGraphTool(server);
createPriceHistoryWithHistoryIdTool(server);
createPriceHistoryWithUrlTool(server);
createSpecIndexesTool(server);
createSpecMappingTool(server);
createSpecSearchTool(server);
createGetCurrentRegionTool(server);

// Main function to start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error); 