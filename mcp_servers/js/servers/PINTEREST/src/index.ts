#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";

// Create server
const server = new McpServer({
  name: "PINTEREST",
  version: "1.0.0",
});

// get-boards tool
server.tool(
  "get-boards",
  "Get my Pinterest boards",
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
                `ID: ${b.id}\nName: ${b.name}\nDescription: ${
                  b.description || "N/A"
                }\n---`
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
            text: `Error fetching boards: ${error.message}`,
          },
        ],
      };
    }
  }
);

//  Connect the server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log(`✅ Server connected: ${server.isConnected()}`);
  } catch (error: any) {
    console.error("❌ Fatal error in main()", error.message);
    process.exit(1);
  }
}


main();