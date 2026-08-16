const express = require("express");

const {
    addProduct,
    getProducts,
    getProduct
} = require("../controllers/productController");

const router = express.Router();

// =====================================
// POST - Add Product
// =====================================

router.post("/", addProduct);


// =====================================
// GET - Get All Products
// =====================================

router.get("/", getProducts);


// =====================================
// GET - Get Product By ID
// =====================================

router.get("/:productId", getProduct);


module.exports = router;