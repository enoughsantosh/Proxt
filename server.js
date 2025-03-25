const express = require("express");
const axios = require("axios");
const m3u8Parser = require("m3u8-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("public"));
app.use(express.json());

app.get("/parse", async (req, res) => {
    const m3u8Url = req.query.url;
    const referer = req.query.referer || "https://netfree.cc"; // Default referer

    if (!m3u8Url) {
        return res.status(400).json({ error: "M3U8 URL is required" });
    }

    try {
        const headers = { headers: { Referer: referer } };
        const { data } = await axios.get(m3u8Url, headers);

        const parser = new m3u8Parser.Parser();
        parser.push(data);
        parser.end();
        const playlist = parser.manifest; // Full unfiltered response

        res.json({ originalResponse: playlist });
    } catch (error) {
        res.status(500).json({ error: "Error parsing M3U8", details: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
