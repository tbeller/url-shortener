const express = require("express");
const router = express.Router();
const { listUrls } = require("../db");

router.get("/urls", async (req, res) => {
    try {
        const urls = await listUrls();
        res.json(urls);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;