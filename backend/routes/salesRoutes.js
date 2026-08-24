const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
    createSale,
    getSales,
    getSalesByProduct,
    getSalesByStore
} = require("../controllers/salesController");

// All sales routes require authentication
router.use(authMiddleware);

// POST /api/sales
router.post("/", createSale);

// GET /api/sales
router.get("/", getSales);

// GET /api/sales/product/:productId
router.get("/product/:productId", getSalesByProduct);

// GET /api/sales/store/:storeId
router.get("/store/:storeId", getSalesByStore);

module.exports = router;