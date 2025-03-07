const express = require("express");
const router = express.Router();
const { createShortUrl } = require("../models/url");
const crypto = require("crypto");

router.post("/shorten", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });
    
    const shortCode = crypto.randomBytes(3).toString("hex");
    await createShortUrl(shortCode, url);
    
    res.json({ shortUrl: `${process.env.BASE_URL}/${shortCode}` });
});

module.exports = router;