#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";

// ================ SERVER INIT ================
const server = new McpServer({
  name: "PINTEREST",
  version: "1.0.0",
  capabilities: {
    tools: {},
    resources: {},
  },
});

// ================ TOOL: get-boards ================
server.tool(
  "get-boards",
  "Fetches all Pinterest boards for the authenticated user.",
  {
    accessToken: z.string().describe("Pinterest OAuth access token"),
  },
  async ({ accessToken }) => {
    try {
      const response = await axios.get("https://api.pinterest.com/v5/boards", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const boards = response.data.items || [];

      const boardsText = boards.length
        ? boards
            .map(
              (b: any) =>
                `📌 Name: ${b.name}\n🆔 ID: ${b.id}\n👤 Owner: ${b.owner?.username}\n📝 Description: ${
                  b.description || "N/A"
                }\n---------------------`
            )
            .join("\n")
        : "No boards found.";

      return {
        content: [
          {
            type: "text",
            text: boardsText,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error fetching boards: ${error.response?.data?.message || error.message}`,
          },
        ],
      };
    }
  }
);

// ================ MAIN FUNCTION ================
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.log("✅ Pinterest MCP Server connected:", server.isConnected());
  } catch (error: any) {
    console.error("❌ Fatal error in main():", error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});
