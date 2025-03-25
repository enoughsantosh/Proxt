const express = require("express");
const request = require("request");
const cors = require("cors");
const url = require("url");

const app = express();
app.use(cors());

// Universal Proxy for M3U8 & TS files
app.get("/proxy", (req, res) => {
    let targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send("Missing URL");
    }

    const options = {
        url: targetUrl,
        headers: {
            "Referer": "https://netfree.cc",  // Required to bypass referer restriction
            "User-Agent": "Mozilla/5.0"
        }
    };

    // Stream the response back to the client
    request(options)
        .on("error", (err) => res.status(500).send("Proxy error: " + err.message))
        .pipe(res);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
});
