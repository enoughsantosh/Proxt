const express = require("express");
const axios = require("axios");
const m3u8Parser = require("m3u8-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const PREFIX = process.env.PREFIX || ""; // Custom prefix for links

app.use(cors());
app.use(express.static("public")); // Serve frontend files
app.use(express.json()); // For handling JSON body

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

        const result = {
            videos: playlist.playlists?.map((p) => ({
                resolution: `${p.attributes.RESOLUTION.width}x${p.attributes.RESOLUTION.height}`,
                url: PREFIX + p.uri, // Add prefix
            })) || [],
            audio: playlist.media?.filter((m) => m.type === "AUDIO").map((a) => ({
                language: a.language,
                url: PREFIX + a.uri,
            })) || [],
            subtitles: playlist.media?.filter((m) => m.type === "SUBTITLES").map((s) => ({
                language: s.language,
                url: PREFIX + s.uri,
            })) || [],
        };

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Error parsing M3U8", details: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
