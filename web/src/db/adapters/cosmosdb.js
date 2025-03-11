const { CosmosClient } = require("@azure/cosmos");

const connectionString = process.env.DB_CONNECTION_STRING;
const databaseId = process.env.COSMOSDB_DATABASE || "urlshortenerdb";
const containerId = process.env.COSMOSDB_CONTAINER || "short_urls";

console.log(`Connecting to Cosmos DB with connection string: ${connectionString}`);

if (!connectionString) {
    console.error("DB_CONNECTION_STRING must be provided.");
    process.exit(1);
}

// Extract endpoint and key from the connection string
const endpointMatch = connectionString.match(/AccountEndpoint=(.*?);/);
const keyMatch = connectionString.match(/AccountKey=(.*)/);

if (!endpointMatch || !keyMatch) {
    console.error("Invalid connection string format.");
    process.exit(1);
}

const endpoint = endpointMatch[1];
const key = keyMatch[1];

const client = new CosmosClient({ endpoint, key });
let container;

async function init() {
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    const { container: cont } = await database.containers.createIfNotExists({ id: containerId });
    container = cont;
}
init();

async function createShortUrl(shortCode, originalUrl) {
    const item = {
        id: shortCode,
        short_code: shortCode,
        original_url: originalUrl,
        created_at: new Date().toISOString()
    };
    await container.items.create(item);
}

async function getOriginalUrl(shortCode) {
    try {
        const { resource } = await container.item(shortCode, undefined).read();
        return resource ? resource.original_url : null;
    } catch (error) {
        return null;
    }
}

async function listUrls() {
    const querySpec = {
        query: "SELECT c.short_code, c.original_url, c.created_at FROM c ORDER BY c.created_at DESC"
    };
    const { resources: items } = await container.items.query(querySpec).fetchAll();
    return items;
}

module.exports = { createShortUrl, getOriginalUrl, listUrls };