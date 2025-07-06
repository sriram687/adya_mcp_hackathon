import { z } from "zod";
import { biggoClient } from "../utils/biggo_client.js";

// Get current region tool implementation
export function createGetCurrentRegionTool(server: any) {
  server.tool(
    "get_current_region",
    "Returns region currently active from .env",
    {},
    async () => {
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