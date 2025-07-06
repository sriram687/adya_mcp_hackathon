import axios, { AxiosInstance } from "axios";

// BigGo API client class
export class BigGoClient {
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

// Export singleton instance
export const biggoClient = new BigGoClient(); 