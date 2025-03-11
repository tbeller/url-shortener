const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(__dirname, "../../../shortener.db");
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("SQLite connection error:", err);
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS short_urls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        short_code TEXT UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

function createShortUrl(shortCode, originalUrl) {
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO short_urls (short_code, original_url) VALUES (?, ?)", [shortCode, originalUrl], function(err) {
            if (err) return reject(err);
            resolve();
        });
    });
}

function getOriginalUrl(shortCode) {
    return new Promise((resolve, reject) => {
        db.get("SELECT original_url FROM short_urls WHERE short_code = ?", [shortCode], (err, row) => {
            if (err) return reject(err);
            resolve(row ? row.original_url : null);
        });
    });
}

function listUrls() {
    return new Promise((resolve, reject) => {
        db.all("SELECT short_code, original_url, created_at FROM short_urls ORDER BY created_at DESC", (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

module.exports = { createShortUrl, getOriginalUrl, listUrls };