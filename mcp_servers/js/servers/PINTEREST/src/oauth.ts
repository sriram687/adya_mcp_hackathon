import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

app.get("/oauth/callback", (req: Request, res: Response, next) => {
  (async () => {
    const code = req.query.code as string;

    if (!code) return res.status(400).send("Missing code");

    try {
      const tokenRes = await axios.post("https://api.pinterest.com/v5/oauth/token", {
        grant_type: "authorization_code",
        code,
        client_id: process.env.PINTEREST_CLIENT_ID,
        client_secret: process.env.PINTEREST_CLIENT_SECRET,
        redirect_uri: "http://localhost:3000/oauth/callback"
      });

      const accessToken = tokenRes.data.access_token;
      console.log("✅ Access Token:", accessToken);
      res.send("Success! Token: " + accessToken);
    } catch (error: any) {
      console.error("❌ OAuth error:", error.response?.data || error.message);
      res.status(500).send("Failed to fetch access token");
    }
  })().catch(next);
});

app.listen(PORT, () => console.log(`OAuth server at http://localhost:${PORT}`));