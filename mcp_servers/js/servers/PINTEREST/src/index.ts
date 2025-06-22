#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// ================ SERVER INIT ================
const server = new McpServer({
  name: "PINTEREST",
  version: "1.0.0",
  capabilities: {
    tools: {},
    resources: {},
  },
});

// Pinterest OAuth URL generator
export function getPinterestAuthUrl() {
  const clientId = process.env.PINTEREST_CLIENT_ID;
  const redirectUri = encodeURIComponent(
    "http://localhost:3000/oauth/callback"
  );
  // Scopes needed for all 6 tools: boards:read, boards:write, pins:read, pins:write, user_accounts:read, user_accounts:read_followers
  const scopes = [
    "boards:read",
    "boards:write",
    "pins:read",
    "pins:write",
    "user_accounts:read",
    "user_accounts:read_followers",
  ].join(",");
  const state = "mcp_state";
  return `https://www.pinterest.com/oauth/?response_type=code&redirect_uri=${redirectUri}&client_id=${clientId}&scope=${scopes}&state=${state}`;
}

console.log("Pinterest OAuth URL:", getPinterestAuthUrl());

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
              `📌 Name: ${b.name}\n🆔 ID: ${b.id}\n👤 Owner: ${b.owner?.username
              }\n📝 Description: ${b.description || "N/A"
              }\n---------------------`
          )
          .join("\n")
        : "No boards found.";

      return toText(boardsText);
    } catch (error: any) {
      return toText(
        `❌ Error fetching boards: ${error.response?.data?.message || error.message
        }`
      );
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
    privacy: z
      .string()
      .default("PUBLIC")
      .describe(
        "Board privacy: PUBLIC, PROTECTED, SECRET (PRIVATE will be mapped to SECRET)"
      ),
  },
  async ({ accessToken, name, description, privacy }) => {
    // Map privacy values for robustness (accepts PRIVATE/SECRET, etc.)
    let pinterestPrivacy = privacy;
    if (privacy === "PRIVATE") pinterestPrivacy = "SECRET";
    if (!["PUBLIC", "PROTECTED", "SECRET"].includes(pinterestPrivacy))
      pinterestPrivacy = "PUBLIC";
    try {
      const response = await axios.post(
        "https://api.pinterest.com/v5/boards",
        {
          name,
          description,
          privacy: pinterestPrivacy,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const board = response.data;
      return toText(
        `✅ Board "${board.name}" created successfully (ID: ${board.id})`
      );
    } catch (error: any) {
      return toText(
        `❌ Error creating board: ${error.response?.data?.message || error.message
        }`
      );
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
      return toText(
        `❌ Error deleting board: ${error.response?.data?.message || error.message
        }`
      );
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

// ================ TOOL: Create Pins ================ not possible with trial access
server.tool(
  "create-pin",
  "Creates a new Pinterest pin on a specific board using base64 image.",
  {
    accessToken: z.string(),
    boardId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    alt_text: z.string().optional(),
    link: z.string().url().optional(),
    image_data: z.string(), // base64 with prefix
  },
  async ({ accessToken, boardId, title, description, alt_text, link, image_data }) => {
    try {
      const response = await axios.post(
        "https://api.pinterest.com/v5/pins",
        {
          board_id: boardId,
          title,
          description,
          alt_text,
          link,
          media_source: {
            source_type: "base64",
            content_type: "image/jpeg",
            data: image_data.split(",")[1], // remove prefix
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const pin = response.data;
      return toText(`📌 Pin "${pin.title}" created successfully on board ${boardId}!\n🆔 Pin ID: ${pin.id}`);
    } catch (error: any) {
      return toText(`❌ Error creating pin: ${error.response?.data?.message || error.message}`);
    }
  }
);
//================ TOOL: Create Pins -url ================ not possible with trial access
server.tool(
  "create-pin-url",
  "Creates a pin using a public image URL.",
  {
    accessToken: z.string(),
    boardId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    alt_text: z.string().optional(),
    link: z.string().url().optional(),
    media_url: z.string().url()
  },
  async ({ accessToken, boardId, title, description, alt_text, link, media_url }) => {
    try {
      const response = await axios.post(
        "https://api.pinterest.com/v5/pins",
        {
          board_id: boardId,
          title,
          description,
          alt_text,
          link,
          media_source: {
            source_type: "image_url",
            url: media_url,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const pin = response.data;
      return toText(`📌 Pin "${pin.title}" created successfully on board ${boardId}!\n🆔 Pin ID: ${pin.id}`);
    } catch (error: any) {
      return toText(`❌ Error creating pin: ${error.response?.data?.message || error.message}`);
    }
  }
);

//================== SANDBOX TOOLS ==================
// Note: These tools are for the Pinterest Sandbox environment, which is separate from the production API


// ================ TOOL: Create Sandbox Board ================
server.tool(
  "create-sandbox-board",
  "Creates a new Pinterest sandbox board.",
  {
    accessToken: z.string(),
    name: z.string().describe("Name of the new board"),
    description: z.string().optional().describe("Board description"),
    privacy: z
      .string()
      .default("PUBLIC")
      .describe(
        "Board privacy: PUBLIC, PROTECTED, SECRET (PRIVATE will be mapped to SECRET)"
      ),
  },
  async ({ accessToken, name, description, privacy }) => {
    // Map privacy values for robustness (accepts PRIVATE/SECRET, etc.)
    let pinterestPrivacy = privacy;
    if (privacy === "PRIVATE") pinterestPrivacy = "SECRET";
    if (!["PUBLIC", "PROTECTED", "SECRET"].includes(pinterestPrivacy))
      pinterestPrivacy = "PUBLIC";
    try {
      const response = await axios.post(
        "https://api-sandbox.pinterest.com/v5/boards",
        {
          name,
          description,
          privacy: pinterestPrivacy,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const board = response.data;
      return toText(
        `✅ Board "${board.name}" created successfully (ID: ${board.id})`
      );
    } catch (error: any) {
      return toText(
        `❌ Error creating board: ${error.response?.data?.message || error.message
        }`
      );
    }
  }
);
// ================= TOOL: Get Sandbox Boards =================
server.tool(
  "get-sandbox-boards",
  "Fetches boards from the Pinterest Sandbox environment.",
  {
    accessToken: z.string().describe("Pinterest Sandbox Access Token"),
  },
  async ({ accessToken }) => {
    try {
      const response = await axios.get("https://api-sandbox.pinterest.com/v5/boards", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const boards = response.data.items || [];

      if (boards.length === 0) {
        return toText("📂 No boards found in your sandbox environment.");
      }

      const boardList = boards
        .map((b: any) => `📌 ${b.name} (ID: ${b.id})`)
        .join("\n");

      return toText(`✅ Found ${boards.length} board(s) in sandbox:\n\n${boardList}`);
    } catch (error: any) {
      console.error("Sandbox Boards Error:", error?.response?.data || error.message);
      return toText("❌ Failed to fetch sandbox boards. Please check your access token and try again.");
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
