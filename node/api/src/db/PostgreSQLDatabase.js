const { Pool } = require('pg');
const DatabaseInterface = require('./DatabaseInterface');

class PostgreSQLDatabase extends DatabaseInterface {
  constructor(connectionString) {
    super();
    this.pool = new Pool({
      connectionString: connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async initialize() {
    try {
      // Create table if it doesn't exist
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS urls (
          id SERIAL PRIMARY KEY,
          short_code VARCHAR(50) UNIQUE NOT NULL,
          original_url TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (err) {
      throw new Error(`PostgreSQL initialization failed: ${err.message}`);
    }
  }

  async createUrl(shortCode, originalUrl) {
    try {
      const result = await this.pool.query(
        'INSERT INTO urls (short_code, original_url) VALUES ($1, $2) RETURNING id',
        [shortCode, originalUrl]
      );
      
      return { shortCode, originalUrl, id: result.rows[0].id };
    } catch (err) {
      throw new Error(`Failed to create URL: ${err.message}`);
    }
  }

  async getUrl(shortCode) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM urls WHERE short_code = $1',
        [shortCode]
      );
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          shortCode: row.short_code,
          originalUrl: row.original_url,
          createdAt: row.created_at
        };
      }
      return null;
    } catch (err) {
      throw new Error(`Failed to get URL: ${err.message}`);
    }
  }

  async getAllUrls() {
    try {
      const result = await this.pool.query(
        'SELECT * FROM urls ORDER BY created_at DESC'
      );
      
      return result.rows.map(row => ({
        shortCode: row.short_code,
        originalUrl: row.original_url,
        createdAt: row.created_at
      }));
    } catch (err) {
      throw new Error(`Failed to get all URLs: ${err.message}`);
    }
  }

  async urlExists(shortCode) {
    const url = await this.getUrl(shortCode);
    return !!url;
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = PostgreSQLDatabase;
