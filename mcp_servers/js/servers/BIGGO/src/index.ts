#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

console.log('BIGGO_MCP_SERVER_CLIENT_ID:', process.env.BIGGO_MCP_SERVER_CLIENT_ID);

// Import tools
import { createProductSearchTool } from "./tools/product_search.js";
import { createPriceHistoryGraphTool } from "./tools/price_history_graph.js";
import { createPriceHistoryWithHistoryIdTool } from "./tools/price_history_with_history_id.js";
import { createPriceHistoryWithUrlTool } from "./tools/price_history_with_url.js";
import { createSpecIndexesTool } from "./tools/spec_indexes.js";
import { createSpecMappingTool } from "./tools/spec_mapping.js";
import { createSpecSearchTool } from "./tools/spec_search.js";
import { createGetCurrentRegionTool } from "./tools/get_current_region.js";

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