const { sql, poolPromise } = require("../../config/db");

async function createShortUrl(shortCode, originalUrl) {
    const pool = await poolPromise;
    await pool.request()
        .input("shortCode", sql.VarChar, shortCode)
        .input("originalUrl", sql.VarChar, originalUrl)
        .query("INSERT INTO short_urls (short_code, original_url, created_at) VALUES (@shortCode, @originalUrl, GETDATE())");
}

async function getOriginalUrl(shortCode) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("shortCode", sql.VarChar, shortCode)
        .query("SELECT original_url FROM short_urls WHERE short_code = @shortCode");
    return result.recordset.length > 0 ? result.recordset[0].original_url : null;
}

async function listUrls() {
    const pool = await poolPromise;
    const result = await pool.request()
        .query("SELECT short_code, original_url, created_at FROM short_urls ORDER BY created_at DESC");
    return result.recordset;
}

module.exports = { createShortUrl, getOriginalUrl, listUrls };