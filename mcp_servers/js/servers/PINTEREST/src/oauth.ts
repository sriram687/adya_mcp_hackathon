import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.get("/oauth/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string;

  if (!code) return res.status(400).send("Missing authorization code");

  const clientId = process.env.PINTEREST_CLIENT_ID!;
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET!;
  const redirectUri = "http://localhost:3000/oauth/callback";

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    const tokenResponse = await axios.post(
      "https://api.pinterest.com/v5/oauth/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
      }
    );

    const data = tokenResponse.data;
    console.log("✅ Access Token:", data.access_token);
    res.json({ message: "OAuth Success", accessToken: data.access_token });
  } catch (error: any) {
    console.error("❌ OAuth error:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 OAuth server running at http://localhost:${PORT}`);
});
