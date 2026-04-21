
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const adsRoutes = require("./ads/ads.routes");

const app = express();

app.use(cors());
app.use(express.json());
process.env.PUPPETEER_CACHE_DIR = "/opt/render/.cache/puppeteer";
require("dotenv").config();

// DB connection
connectDB();

// routes
app.use("/api/v1", adsRoutes);

app.get("/", (req, res) => {
  res.send("API Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});