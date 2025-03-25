const express = require("express");
const axios = require("axios");
const m3u8Parser = require("m3u8-parser");
const cors = require("cors");
const url = require("url"); // For handling base URLs

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("public"));
app.use(express.json());

app.get("/parse", async (req, res) => {
    const m3u8Url = req.query.url;
    const referer = req.query.referer || "";

    if (!m3u8Url) return res.status(400).json({ error: "M3U8 URL is required" });

    try {
        const headers = referer ? { headers: { Referer: referer } } : {};
        const { data } = await axios.get(m3u8Url, headers);

        const parser = new m3u8Parser.Parser();
        parser.push(data);
        parser.end();
        const playlist = parser.manifest;

        const baseUrl = new URL(m3u8Url).origin; // Extract base domain

        const makeAbsolute = (link) => (link.startsWith("http") ? link : new URL(link, m3u8Url).href);

        const result = {
            videos: playlist.playlists?.map((p) => ({
                resolution: `${p.attributes.RESOLUTION.width}x${p.attributes.RESOLUTION.height}`,
                url: makeAbsolute(p.uri), // Convert to absolute URL
            })) || [],
            audio: playlist.media?.filter((m) => m.type === "AUDIO").map((a) => ({
                language: a.language,
                url: makeAbsolute(a.uri),
            })) || [],
            subtitles: playlist.media?.filter((m) => m.type === "SUBTITLES").map((s) => ({
                language: s.language,
                url: makeAbsolute(s.uri),
            })) || [],
        };

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Error parsing M3U8", details: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
