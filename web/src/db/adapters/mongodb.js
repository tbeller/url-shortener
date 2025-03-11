const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DATABASE || "urlShortenerDB";
const collectionName = process.env.MONGODB_COLLECTION || "short_urls";

if (!uri) {
    console.error("MONGODB_URI must be provided.");
    process.exit(1);
}

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let collection;

async function init() {
    await client.connect();
    const db = client.db(dbName);
    collection = db.collection(collectionName);
    await collection.createIndex({ short_code: 1 }, { unique: true });
}
init();

async function createShortUrl(shortCode, originalUrl) {
    const document = {
        short_code: shortCode,
        original_url: originalUrl,
        created_at: new Date()
    };
    await collection.insertOne(document);
}

async function getOriginalUrl(shortCode) {
    const document = await collection.findOne({ short_code: shortCode });
    return document ? document.original_url : null;
}

async function listUrls() {
    return await collection.find({}).sort({ created_at: -1 }).toArray();
}

module.exports = { createShortUrl, getOriginalUrl, listUrls };