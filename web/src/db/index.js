require("dotenv").config(); // Ensure environment variables are loaded early

const dbType = process.env.DB_PROVIDER || "sqlserver"; // default to SQL Server
console.log(`Using database type: ${process.env.DB_TYPE}`);

let adapter;
switch (dbType.toLowerCase()) {
  case "sqlite":
    adapter = require("./adapters/sqlite");
    break;
  case "cosmosdb":
    adapter = require("./adapters/cosmosdb");
    break;
  case "mongodb":
    adapter = require("./adapters/mongodb");
    break;
  case "sqlserver":
  default:
    adapter = require("./adapters/sqlserver");
    break;
}

module.exports = adapter;