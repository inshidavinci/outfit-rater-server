// server.js
const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
require("dotenv").config();

const app = express();
const PORT = 5000;

// ✅ Allow ALL origins for simplicity (temporary)
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) console.error("❌ Missing GEMINI_API_KEY in .env file!");

// ✅ Outfit analyzer endpoint
app.post("/analyze", async (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ ok: false, error: "No image provided" });

  try {
    const base64Image = image.split(",")[1];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: "Describe this outfit and rate it out of 10 for style." },
                { inline_data: { mime_type: "image/jpeg", data: base64Image } },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    res.json({ ok: true, result: data });
  } catch (err) {
    console.error("❌ Error in /analyze:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
