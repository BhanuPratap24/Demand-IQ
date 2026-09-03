const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const productRoutes = require("./routes/productRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const salesRoutes = require("./routes/salesRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const alertsRoutes = require("./routes/alertsRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// ===============================
// MIDDLEWARE
// ===============================

const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(cors({
    origin: corsOrigin === "*" ? true : corsOrigin.split(",").map(s => s.trim()),
    credentials: true
}));
app.use(express.json());

// ===============================
// HEALTH & ROOT CHECK
// ===============================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "DemandIQ Backend is running!",
        environment: process.env.NODE_ENV || "development"
    });
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// ===============================
// API ROUTES
// ===============================

app.use("/api/products", productRoutes);

app.use("/api/inventory", inventoryRoutes);

app.use("/api/sales", salesRoutes);

app.use("/api/analytics", analyticsRoutes);

app.use("/api/recommendations", recommendationRoutes);

app.use("/api/alerts", alertsRoutes);
app.use("/api/auth", authRoutes);

// ===============================
// SERVER
// ===============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("===================================");
    console.log("       DEMANDIQ BACKEND");
    console.log("===================================");
    console.log(`Backend running on http://localhost:${PORT}`);
});