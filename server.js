const express = require("express");
const request = require("request");
const cors = require("cors");
const url = require("url");

const app = express();
app.use(express.static(__dirname));
app.use(cors());

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

        // Check if the response is an M3U8 playlist
        if (targetUrl.includes(".m3u8")) {
            let baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);
            let modifiedBody = body.replace(/(\r\n|\n)/g, "\n") // Normalize newlines
                .replace(/^(?!#)([^\n\r]+)/gm, (match) => {
                    if (match.startsWith("http") || match.startsWith("/")) {
                        return match; // Keep absolute URLs as they are
                    } else {
                        return baseUrl + match; // Convert relative URLs to absolute
                    }
                });

            res.set("Content-Type", "application/vnd.apple.mpegurl");
            return res.send(modifiedBody);
        }

        // Stream other files (TS segments, JPGs, etc.)
        request(options).pipe(res);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
});
