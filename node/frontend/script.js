// URL Shortener Frontend JavaScript

class URLShortener {
    constructor() {
        this.baseURL = window.location.origin;
        this.apiURL = `${this.baseURL}/api`;
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadAllUrls();
    }

    initializeElements() {
        // Forms
        this.shortenForm = document.getElementById('shortenForm');
        this.expandForm = document.getElementById('expandForm');
        
        // Inputs
        this.urlInput = document.getElementById('urlInput');
        this.shortCodeInput = document.getElementById('shortCodeInput');
        
        // Buttons
        this.shortenBtn = document.getElementById('shortenBtn');
        this.expandBtn = document.getElementById('expandBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        
        // Display elements
        this.shortenResult = document.getElementById('shortenResult');
        this.expandResult = document.getElementById('expandResult');
        this.shortUrlDisplay = document.getElementById('shortUrlDisplay');
        this.originalUrlDisplay = document.getElementById('originalUrlDisplay');
        this.originalUrlLink = document.getElementById('originalUrlLink');
        this.shortCodeDisplay = document.getElementById('shortCodeDisplay');
        this.createdAtDisplay = document.getElementById('createdAtDisplay');
        this.urlsList = document.getElementById('urlsList');
        
        // UI elements
        this.errorMessage = document.getElementById('errorMessage');
        this.loadingIndicator = document.getElementById('loadingIndicator');
    }

    attachEventListeners() {
        this.shortenForm.addEventListener('submit', (e) => this.handleShortenUrl(e));
        this.expandForm.addEventListener('submit', (e) => this.handleExpandUrl(e));
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.refreshBtn.addEventListener('click', () => this.loadAllUrls());
    }

    // Show loading indicator
    showLoading() {
        this.loadingIndicator.classList.remove('hidden');
    }

    // Hide loading indicator
    hideLoading() {
        this.loadingIndicator.classList.add('hidden');
    }

    // Show error message
    showError(message) {
        const errorText = this.errorMessage.querySelector('.error-text');
        errorText.textContent = message;
        this.errorMessage.classList.remove('hidden');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            this.errorMessage.classList.add('hidden');
        }, 5000);
    }

    // Make API requests
    async makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            throw new Error(error.message || 'Network error occurred');
        }
    }

    // Handle URL shortening
    async handleShortenUrl(event) {
        event.preventDefault();
        
        const url = this.urlInput.value.trim();
        if (!url) {
            this.showError('Please enter a URL');
            return;
        }

        try {
            this.showLoading();
            this.shortenBtn.disabled = true;
            
            const result = await this.makeRequest(`${this.apiURL}/shorten`, {
                method: 'POST',
                body: JSON.stringify({ url })
            });

            this.displayShortenResult(result);
            this.urlInput.value = '';
            this.loadAllUrls(); // Refresh the list
            
        } catch (error) {
            this.showError(`Error shortening URL: ${error.message}`);
        } finally {
            this.hideLoading();
            this.shortenBtn.disabled = false;
        }
    }

    // Handle URL expansion
    async handleExpandUrl(event) {
        event.preventDefault();
        
        let shortCode = this.shortCodeInput.value.trim();
        if (!shortCode) {
            this.showError('Please enter a short code or URL');
            return;
        }

        // Extract short code from full URL if needed
        if (shortCode.includes('/')) {
            const parts = shortCode.split('/');
            shortCode = parts[parts.length - 1];
        }

        try {
            this.showLoading();
            this.expandBtn.disabled = true;
            
            const result = await this.makeRequest(`${this.apiURL}/expand/${shortCode}`);
            
            this.displayExpandResult(result);
            this.shortCodeInput.value = '';
            
        } catch (error) {
            this.showError(`Error expanding URL: ${error.message}`);
            this.expandResult.classList.add('hidden');
        } finally {
            this.hideLoading();
            this.expandBtn.disabled = false;
        }
    }

    // Display shorten result
    displayShortenResult(result) {
        this.shortUrlDisplay.value = result.shortUrl;
        this.originalUrlDisplay.textContent = result.originalUrl;
        this.shortenResult.classList.remove('hidden');
    }

    // Display expand result
    displayExpandResult(result) {
        this.originalUrlLink.href = result.originalUrl;
        this.originalUrlLink.textContent = result.originalUrl;
        this.shortCodeDisplay.textContent = result.shortCode;
        this.createdAtDisplay.textContent = this.formatDate(result.createdAt);
        this.expandResult.classList.remove('hidden');
    }

    // Copy to clipboard
    async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.shortUrlDisplay.value);
            
            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = 'Copied!';
            this.copyBtn.style.background = '#28a745';
            
            setTimeout(() => {
                this.copyBtn.textContent = originalText;
                this.copyBtn.style.background = '';
            }, 2000);
            
        } catch (error) {
            // Fallback for older browsers
            this.shortUrlDisplay.select();
            document.execCommand('copy');
            this.showError('Copied to clipboard (fallback method)');
        }
    }

    // Load all URLs
    async loadAllUrls() {
        try {
            const result = await this.makeRequest(`${this.apiURL}/urls`);
            this.displayUrlsList(result.urls || []);
        } catch (error) {
            this.showError(`Error loading URLs: ${error.message}`);
        }
    }

    // Display URLs list
    displayUrlsList(urls) {
        if (!urls.length) {
            this.urlsList.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #64748b;">
                    <div style="font-size: 3rem; margin-bottom: 16px;">No URLs</div>
                    <h3 style="color: #94a3b8; margin-bottom: 8px; font-weight: 600;">No shortened URLs yet</h3>
                    <p style="font-size: 0.9rem; margin-top: 12px;">Create your first short URL above to get started!</p>
                </div>
            `;
            return;
        }

        this.urlsList.innerHTML = urls.map(url => `
            <a href="${url.originalUrl}" target="_blank" rel="noopener noreferrer" class="url-item">
                <div class="url-details">
                    <div class="url-row">
                        <div class="short-url">${url.shortUrl}</div>
                        <div class="created">${this.formatDate(url.createdAt)}</div>
                    </div>
                    <div class="original">${this.truncateUrl(url.originalUrl, 80)}</div>
                </div>
            </a>
        `).join('');
    }

    // Utility functions
    truncateUrl(url, maxLength) {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength - 3) + '...';
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } catch (error) {
            return 'Invalid date';
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.urlShortener = new URLShortener();
});

// Handle browser back/forward buttons for SPA-like behavior
window.addEventListener('popstate', (event) => {
    // You can add routing logic here if needed
});

// Error handler for uncaught errors
window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
});

// Handle offline/online status
window.addEventListener('offline', () => {
    if (window.urlShortener) {
        window.urlShortener.showError('You are offline. Some features may not work.');
    }
});

window.addEventListener('online', () => {
    if (window.urlShortener) {
        // Optionally reload data when coming back online
        window.urlShortener.loadAllUrls();
    }
});
