const express = require("express");
const request = require("request");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());

// Serve the embed player when accessing the root URL
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "player.html"));
});

// Proxy for M3U8 & TS files
app.get("/proxy", (req, res) => {
    let targetUrl = req.query.url;
    
    if (!targetUrl) {
        return res.status(400).send("Missing URL");
    }

    const options = {
        url: targetUrl,
        headers: {
            "Referer": "https://netfree.cc",
            "User-Agent": "Mozilla/5.0"
        }
    };

    request(options, (error, response, body) => {
        if (error) {
            return res.status(500).send("Proxy error: " + error.message);
        }

        // Modify M3U8 files to fix relative URLs
        if (targetUrl.includes(".m3u8")) {
            let baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);
            let modifiedBody = body.replace(/(\r\n|\n)/g, "\n").replace(/^(?!#)([^\n\r]+)/gm, (match) => {
                return match.startsWith("http") ? match : baseUrl + match;
            });

            res.set("Content-Type", "application/vnd.apple.mpegurl");
            return res.send(modifiedBody);
        }

        // Stream other resources
        request(options).pipe(res);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
