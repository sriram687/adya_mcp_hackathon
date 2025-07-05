#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Import tools
import { createGitHubSearchTool } from "./tools/search_github.js";
import { createNpmSearchTool } from "./tools/search_npm.js";
import { createPyPISearchTool } from "./tools/search_pypi.js";
import { createStackOverflowSearchTool } from "./tools/search_stackoverflow.js";
import { createMDNSearchTool } from "./tools/search_mdn.js";

// Create server instance
const server = new McpServer({
  name: "code-research",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Register tools
createGitHubSearchTool(server);
createNpmSearchTool(server);
createPyPISearchTool(server);
createStackOverflowSearchTool(server);
createMDNSearchTool(server);

// Main function to start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error); 