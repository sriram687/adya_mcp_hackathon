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

// ================ TOOL: Get Boards ================
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

      return toText(boardsText);
    } catch (error: any) {
      return toText(`❌ Error fetching boards: ${error.response?.data?.message || error.message}`);
    }
  }
);

// ================ TOOL: Create Board ================
server.tool(
  "create-board",
  "Creates a new Pinterest board.",
  {
    accessToken: z.string(),
    name: z.string().describe("Name of the new board"),
    description: z.string().optional().describe("Board description"),
    privacy: z.enum(["PUBLIC", "PROTECTED", "SECRET"]).default("PUBLIC"),
  },
  async ({ accessToken, name, description, privacy }) => {
    try {
      const response = await axios.post(
        "https://api.pinterest.com/v5/boards",
        {
          name,
          description,
          privacy,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const board = response.data;
      return toText(`✅ Board "${board.name}" created successfully (ID: ${board.id})`);
    } catch (error: any) {
      return toText(`❌ Error creating board: ${error.response?.data?.message || error.message}`);
    }
  }
);

// ================ TOOL: Delete Board ================
server.tool(
  "delete-board",
  "Delete a board.",
  {
    accessToken: z.string(),
    boardId: z.string(),
  },
  async ({ accessToken, boardId }) => {
    try {
      await axios.delete(`https://api.pinterest.com/v5/boards/${boardId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return toText(`🗑️ Deleted board ${boardId}`);
    } catch (error: any) {
      return toText(`❌ Error deleting board: ${error.response?.data?.message || error.message}`);
    }
  }
);

// ================ TOOL: Delete Pin ================
server.tool(
  "delete-pin",
  "Delete a pin.",
  {
    accessToken: z.string(),
    pinId: z.string(),
  },
  async ({ accessToken, pinId }) => {
    try {
      await axios.delete(`https://api.pinterest.com/v5/pins/${pinId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return toText(`✅ Pin deleted.`);
    } catch (error: any) {
      return toText(`❌ Error deleting pin: ${error.message}`);
    }
  }
);

// ================ TOOL: Get User Profile ================
server.tool(
  "get-user-profile",
  "Fetch user's profile.",
  {
    accessToken: z.string(),
  },
  async ({ accessToken }) => {
    try {
      const res = await axios.get("https://api.pinterest.com/v5/user_account", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const user = res.data;
      return toText(`👤 ${user.username}\nName: ${user.profile?.display_name || "N/A"}`);
    } catch (err: any) {
      return toText(`❌ Error fetching profile: ${err.message}`);
    }
  }
);

// ================ TOOL: Get User Followers ================
server.tool(
  "get-user-followers",
  "Fetch user's followers.",
  {
    accessToken: z.string(),
  },
  async ({ accessToken }) => {
    try {
      const res = await axios.get("https://api.pinterest.com/v5/user_account/followers", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const followers = res.data.items;
      if (!followers || followers.length === 0) return toText("No followers found.");

      const followersText = followers.map((f: any) => `👤 ${f.username}`).join("\n");
      return toText(followersText);
    } catch (err: any) {
      return toText(`❌ Error fetching followers: ${err.message}`);
    }
  }
);

// ================ Helper ================
function toText(text: string) {
  return {
    content: [
      {
        type: "text" as const,
        text,
        // _meta is optional and can be omitted or included as needed
      },
    ],
  };
}

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
