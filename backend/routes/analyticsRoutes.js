const express = require("express");

const router = express.Router();

const {
    getSummary,
    getTopProducts,
    getSalesTrend,
    getLowStock,
    getStorePerformance
} = require("../controllers/analyticsController");


// Dashboard summary
router.get("/summary", getSummary);

// Top 10 products
router.get("/top-products", getTopProducts);

// Sales trend
router.get("/sales-trend", getSalesTrend);

// Low stock products
router.get("/low-stock", getLowStock);

// Store performance
router.get("/store-performance", getStorePerformance);


module.exports = router;