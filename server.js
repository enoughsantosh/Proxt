const express = require("express");
const axios = require("axios");
const m3u8Parser = require("m3u8-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("public")); // Serve frontend files

app.get("/parse", async (req, res) => {
    const m3u8Url = req.query.url;
    if (!m3u8Url) return res.status(400).json({ error: "M3U8 URL is required" });

    try {
        const { data } = await axios.get(m3u8Url);
        const parser = new m3u8Parser.Parser();
        parser.push(data);
        parser.end();
        const playlist = parser.manifest;

        const result = {
            videos: playlist.playlists?.map((p) => ({
                resolution: `${p.attributes.RESOLUTION.width}x${p.attributes.RESOLUTION.height}`,
                url: p.uri,
            })) || [],
            audio: playlist.media?.filter((m) => m.type === "AUDIO").map((a) => ({
                language: a.language,
                url: a.uri,
            })) || [],
            subtitles: playlist.media?.filter((m) => m.type === "SUBTITLES").map((s) => ({
                language: s.language,
                url: s.uri,
            })) || []
        };

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Error parsing M3U8", details: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
