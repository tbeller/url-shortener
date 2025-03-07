const sql = require("mssql");
const dotenv = require("dotenv");
dotenv.config();

// Read the connection string using the Azure-specific prefix
const connectionString = process.env.DB_CONNECTION_STRING;
if (!connectionString) {
    console.error("DB_CONNECTION_STRING is not defined.");
    process.exit(1);
}

const poolPromise = new sql.ConnectionPool(connectionString)
    .connect()
    .then(pool => {
        console.log("Connected to Azure SQL using connection string");

        // Create table if it doesn't exist
        const createTableQuery = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='short_urls' and xtype='U')
            BEGIN
                CREATE TABLE short_urls (
                    id INT PRIMARY KEY IDENTITY(1,1),
                    short_code VARCHAR(10) UNIQUE NOT NULL,
                    original_url VARCHAR(500) NOT NULL,
                    created_at DATETIME DEFAULT GETDATE()
                )
            END
        `;
        pool.request()
            .query(createTableQuery)
            .then(() => console.log("Ensured table 'short_urls' exists"))
            .catch(err => console.error("Error creating table 'short_urls':", err));
        return pool;
    })
    .catch(err => {
        console.error("Database connection failed!", err);
        process.exit(1);
    });

module.exports = { sql, poolPromise };