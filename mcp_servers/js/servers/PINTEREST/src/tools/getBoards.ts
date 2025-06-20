import { z } from "zod";
import axios from "axios";
import { PinterestBoard } from "../types.js";

export const getBoardsTool = {
  name: "get-boards",
  description: "Fetches all Pinterest boards for the authenticated user.",
  inputSchema: z.object({
    accessToken: z.string().describe("Pinterest OAuth access token"),
  }),
  execute: async ({ accessToken }: { accessToken: string }) => {
    try {
      const response = await axios.get("https://api.pinterest.com/v5/boards", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const boards: PinterestBoard[] = response.data.items || [];

      const boardsText = boards.length
        ? boards
            .map(
              (b) =>
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
  },
};
