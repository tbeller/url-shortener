const sql = require('mssql');
const DatabaseInterface = require('./DatabaseInterface');

class SQLServerDatabase extends DatabaseInterface {
  constructor(connectionString) {
    super();
    this.connectionString = connectionString;
    this.pool = null;
  }

  async initialize() {
    try {
      this.pool = await sql.connect(this.connectionString);
      
      // Create table if it doesn't exist
      await this.pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='urls' AND xtype='U')
        CREATE TABLE urls (
          id INT IDENTITY(1,1) PRIMARY KEY,
          short_code NVARCHAR(50) UNIQUE NOT NULL,
          original_url NVARCHAR(MAX) NOT NULL,
          created_at DATETIME2 DEFAULT GETUTCDATE()
        )
      `);
    } catch (err) {
      throw new Error(`SQL Server connection failed: ${err.message}`);
    }
  }

  async createUrl(shortCode, originalUrl) {
    try {
      const result = await this.pool.request()
        .input('shortCode', sql.NVarChar(50), shortCode)
        .input('originalUrl', sql.NVarChar(sql.MAX), originalUrl)
        .query('INSERT INTO urls (short_code, original_url) OUTPUT INSERTED.id VALUES (@shortCode, @originalUrl)');
      
      return { shortCode, originalUrl, id: result.recordset[0].id };
    } catch (err) {
      throw new Error(`Failed to create URL: ${err.message}`);
    }
  }

  async getUrl(shortCode) {
    try {
      const result = await this.pool.request()
        .input('shortCode', sql.NVarChar(50), shortCode)
        .query('SELECT * FROM urls WHERE short_code = @shortCode');
      
      if (result.recordset.length > 0) {
        const row = result.recordset[0];
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
      const result = await this.pool.request()
        .query('SELECT * FROM urls ORDER BY created_at DESC');
      
      return result.recordset.map(row => ({
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
    if (this.pool) {
      await this.pool.close();
    }
  }
}

module.exports = SQLServerDatabase;
