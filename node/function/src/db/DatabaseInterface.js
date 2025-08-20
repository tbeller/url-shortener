// Base Database Interface
class DatabaseInterface {
  async initialize() {
    throw new Error('initialize method must be implemented');
  }

  async createUrl(shortCode, originalUrl) {
    throw new Error('createUrl method must be implemented');
  }

  async getUrl(shortCode) {
    throw new Error('getUrl method must be implemented');
  }

  async getAllUrls() {
    throw new Error('getAllUrls method must be implemented');
  }

  async urlExists(shortCode) {
    throw new Error('urlExists method must be implemented');
  }

  async close() {
    // Optional: Override if cleanup is needed
  }
}

module.exports = DatabaseInterface;
