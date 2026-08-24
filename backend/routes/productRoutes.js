const express = require("express");

const {
    addProduct,
    getProducts,
    getProduct
} = require("../controllers/productController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================
// POST - Add Product (Auth Required)
// =====================================

router.post("/", authMiddleware, addProduct);


// =====================================
// GET - Get All Products (Auth Required)
// =====================================

router.get("/", authMiddleware, getProducts);


// =====================================
// GET - Get Product By ID (Auth Required)
// =====================================

router.get("/:productId", authMiddleware, getProduct);


module.exports = router;