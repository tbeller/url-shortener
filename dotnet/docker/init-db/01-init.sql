-- Initialize URL Shortener database for PostgreSQL
CREATE TABLE IF NOT EXISTS urls (
    id SERIAL PRIMARY KEY,
    short_code VARCHAR(10) UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    click_count INTEGER DEFAULT 0
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
CREATE INDEX IF NOT EXISTS idx_urls_created_at ON urls(created_at);

-- Insert sample data for development
INSERT INTO urls (short_code, original_url, created_at, click_count) 
VALUES 
    ('demo123', 'https://github.com', CURRENT_TIMESTAMP, 5),
    ('test456', 'https://stackoverflow.com', CURRENT_TIMESTAMP, 12),
    ('sample', 'https://docs.microsoft.com', CURRENT_TIMESTAMP, 3)
ON CONFLICT (short_code) DO NOTHING;
