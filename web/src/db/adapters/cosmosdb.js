const { CosmosClient } = require("@azure/cosmos");

const endpoint = process.env.COSMOSDB_ENDPOINT;
const key = process.env.COSMOSDB_KEY;
const databaseId = process.env.COSMOSDB_DATABASE || "urlShortenerDB";
const containerId = process.env.COSMOSDB_CONTAINER || "short_urls";

if (!endpoint || !key) {
    console.error("COSMOSDB_ENDPOINT and COSMOSDB_KEY must be provided.");
    process.exit(1);
}

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
        const { resource } = await container.item(shortCode, shortCode).read();
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