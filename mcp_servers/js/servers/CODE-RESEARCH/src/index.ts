#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Import existing tools
import { createGitHubSearchTool } from "./tools/search_github.js";
import { createNpmSearchTool } from "./tools/search_npm.js";
import { createPyPISearchTool } from "./tools/search_pypi.js";
import { createStackOverflowSearchTool } from "./tools/search_stackoverflow.js";
import { createMDNSearchTool } from "./tools/search_mdn.js";
import { createSearchAllTool } from "./tools/search_all.js";

// Import new tools
import { createRustCratesSearchTool } from "./tools/search_rust_crates.js";
import { createGoPackagesSearchTool } from "./tools/search_go_packages.js";
import { createDevDocsSearchTool } from "./tools/search_devdocs.js";
import { createAwesomeListsSearchTool } from "./tools/search_awesome_lists.js";
import { createRedditProgrammingSearchTool } from "./tools/search_reddit_programming.js";
import { createYoutubeTutorialsSearchTool } from "./tools/search_youtube_tutorials.js";
import { createTechBlogsSearchTool } from "./tools/search_tech_blogs.js";

// Create server instance
const server = new McpServer({
  name: "code-research",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Register existing tools
createGitHubSearchTool(server);
createNpmSearchTool(server);
createPyPISearchTool(server);
createStackOverflowSearchTool(server);
createMDNSearchTool(server);
createSearchAllTool(server);

// Register new tools
createRustCratesSearchTool(server);
createGoPackagesSearchTool(server);
createDevDocsSearchTool(server);
createAwesomeListsSearchTool(server);
createRedditProgrammingSearchTool(server);
createYoutubeTutorialsSearchTool(server);
createTechBlogsSearchTool(server);

// Main function to start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error); 