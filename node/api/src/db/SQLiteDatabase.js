const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DatabaseInterface = require('./DatabaseInterface');

class SQLiteDatabase extends DatabaseInterface {
  constructor(dbPath = './urls.db') {
    super();
    this.dbPath = dbPath;
    this.db = null;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Create table if it doesn't exist
        this.db.run(`
          CREATE TABLE IF NOT EXISTS urls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            short_code TEXT UNIQUE NOT NULL,
            original_url TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  async createUrl(shortCode, originalUrl) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO urls (short_code, original_url) VALUES (?, ?)',
        [shortCode, originalUrl],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ shortCode, originalUrl, id: this.lastID });
          }
        }
      );
    });
  }

  async getUrl(shortCode) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM urls WHERE short_code = ?',
        [shortCode],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? {
              shortCode: row.short_code,
              originalUrl: row.original_url,
              createdAt: row.created_at
            } : null);
          }
        }
      );
    });
  }

  async getAllUrls() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM urls ORDER BY created_at DESC',
        [],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const urls = rows.map(row => ({
              shortCode: row.short_code,
              originalUrl: row.original_url,
              createdAt: row.created_at
            }));
            resolve(urls);
          }
        }
      );
    });
  }

  async urlExists(shortCode) {
    const url = await this.getUrl(shortCode);
    return !!url;
  }

  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing SQLite database:', err);
          }
          resolve();
        });
      });
    }
  }
}

module.exports = SQLiteDatabase;
