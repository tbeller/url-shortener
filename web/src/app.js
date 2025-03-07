const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const shortenRoutes = require("./routes/shorten");
const redirectRoutes = require("./routes/redirect");
const listRoutes = require("./routes/list");

dotenv.config();
const app = express();
app.use(express.json());

// Serve static files from the web folder (index.html included)
app.use(express.static(path.join(__dirname, "../")));

// Mount API routes after static middleware
app.use("/api", shortenRoutes);
app.use("/api", listRoutes);

app.get("/list", (req, res) => {
    res.sendFile(path.join(__dirname, "../list.html"));
});

// Keep redirectRoutes for handling short URL redirection
app.use("/", redirectRoutes);

module.exports = app;
