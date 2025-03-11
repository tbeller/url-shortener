const express = require("express");
const router = express.Router();
const { getOriginalUrl } = require("../models/url");

router.get("/:shortCode", async (req, res) => {
    const { shortCode } = req.params;
    const originalUrl = await getOriginalUrl(shortCode);
    
    if (!originalUrl) {
        return res.status(404).json({ error: "URL not found" });
    }
    
    // If the request asks for JSON, respond with JSON instead of redirecting
    if (req.query.format === "json") {
        return res.json({ originalUrl });
    }

    res.redirect(originalUrl);
});

module.exports = router;