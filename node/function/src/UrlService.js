const shortid = require('shortid');

class UrlService {
  constructor(database) {
    this.database = database;
  }

  // Generate a short code (4 characters alphanumeric)
  generateShortCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Validate URL format
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Create a shortened URL
  async createShortUrl(originalUrl) {
    if (!originalUrl || !this.isValidUrl(originalUrl)) {
      throw new Error('Invalid URL provided');
    }

    let shortCode = this.generateShortCode();
    let attempts = 0;
    const maxAttempts = 5;

    // Ensure the short code is unique
    while (await this.database.urlExists(shortCode) && attempts < maxAttempts) {
      shortCode = this.generateShortCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate unique short code');
    }

    try {
      const result = await this.database.createUrl(shortCode, originalUrl);
      return {
        success: true,
        shortCode: result.shortCode,
        originalUrl: result.originalUrl,
        id: result.id
      };
    } catch (error) {
      throw new Error(`Failed to create short URL: ${error.message}`);
    }
  }

  // Get original URL by short code
  async getOriginalUrl(shortCode) {
    if (!shortCode) {
      throw new Error('Short code is required');
    }

    try {
      const url = await this.database.getUrl(shortCode);
      if (!url) {
        return { success: false, error: 'Short URL not found' };
      }

      return {
        success: true,
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        createdAt: url.createdAt
      };
    } catch (error) {
      throw new Error(`Failed to get original URL: ${error.message}`);
    }
  }

  // Get all URLs
  async getAllUrls() {
    try {
      const urls = await this.database.getAllUrls();
      // Do not include an absolute shortUrl here; return the shortCode and
      // let the frontend compute the final URL using its current origin.
      return {
        success: true,
        urls: urls.map(url => ({
          shortCode: url.shortCode,
          originalUrl: url.originalUrl,
          createdAt: url.createdAt
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get all URLs: ${error.message}`);
    }
  }
}

module.exports = UrlService;
