const express = require("express");
const axios = require("axios");
const m3u8Parser = require("m3u8-parser");
const cors = require("cors");
const { URL } = require("url");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/parse", async (req, res) => {
    const m3u8Url = req.query.url;
    const referer = req.query.referer || "https://netfree.cc";

    if (!m3u8Url) return res.status(400).json({ error: "M3U8 URL is required" });

    try {
        const headers = { headers: { Referer: referer } };
        const { data } = await axios.get(m3u8Url, headers);

        const parser = new m3u8Parser.Parser();
        parser.push(data);
        parser.end();
        const playlist = parser.manifest;

        const baseUrl = new URL(m3u8Url).origin;
        const videoStreams = playlist.playlists ? playlist.playlists.map(p => new URL(p.uri, baseUrl).href) : [];
        const audioStreams = playlist.mediaGroups?.AUDIO?.aac ? Object.values(playlist.mediaGroups.AUDIO.aac).map(a => new URL(a.uri, baseUrl).href) : [];

        res.json({ videoStreams, audioStreams });
    } catch (error) {
        res.status(500).json({ error: "Error parsing M3U8", details: error.message });
    }
});

// Proxy for serving segments with the correct referer
app.get("/segment", async (req, res) => {
    const segmentUrl = req.query.url;
    if (!segmentUrl) return res.status(400).json({ error: "Segment URL is required" });

    try {
        const headers = { headers: { Referer: "https://netfree.cc" } };
        const response = await axios.get(segmentUrl, { headers, responseType: "arraybuffer" });

        res.set("Content-Type", "video/MP2T");
        res.send(response.data);
    } catch (error) {
        res.status(500).json({ error: "Error fetching segment", details: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));