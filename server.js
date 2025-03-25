const express = require("express");
const request = require("request");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/proxy", (req, res) => {
    const hlsUrl = req.query.url;

    if (!hlsUrl) {
        return res.status(400).send("Missing HLS URL");
    }

    const options = {
        url: hlsUrl,
        headers: {
            "Referer": "https://netfree.cc",
            "User-Agent": "Mozilla/5.0"
        }
    };

    request(options).pipe(res);
});

// Use Render's PORT environment variable
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
});
