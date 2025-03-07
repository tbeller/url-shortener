const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../config/db");

router.get("/urls", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query("SELECT short_code, original_url, created_at FROM short_urls ORDER BY created_at DESC");
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;