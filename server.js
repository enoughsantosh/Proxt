const express = require("express");
const request = require("request");
const cors = require("cors");

const app = express();
app.use(cors());

// Proxy for M3U8, TS, and Audio files
app.get("/proxy", (req, res) => {
    let targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send("Missing URL");
    }

    const options = {
        url: targetUrl,
        headers: {
            "Referer": "https://netfree.cc", // Required referer
            "User-Agent": "Mozilla/5.0"
        }
    };

    request(options, (error, response, body) => {
        if (error) {
            return res.status(500).send("Proxy error: " + error.message);
        }

        // If it's an M3U8 file (Master or Media)
        if (targetUrl.includes(".m3u8")) {
            let baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);

            let modifiedBody = body.replace(/(\r\n|\n)/g, "\n") // Normalize newlines
                .replace(/^(?!#)([^\n\r]+)/gm, (match) => {
                    if (match.startsWith("http") || match.startsWith("/")) {
                        return `/proxy?url=${encodeURIComponent(match)}`; // Proxy absolute URLs
                    } else {
                        return `/proxy?url=${encodeURIComponent(baseUrl + match)}`; // Proxy relative URLs
                    }
                })
                // Ensure AUDIO links in #EXT-X-MEDIA are also proxied
                .replace(/URI="([^"]+)"/g, (match, p1) => {
                    return `URI="/proxy?url=${encodeURIComponent(p1)}"`;
                });

            res.set("Content-Type", "application/vnd.apple.mpegurl");
            return res.send(modifiedBody);
        }

        // Proxy TS, AAC, MP3, or other media files
        request(options).pipe(res);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
});
