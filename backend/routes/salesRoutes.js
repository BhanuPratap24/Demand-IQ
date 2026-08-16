const express = require("express");

const router = express.Router();

const {
    createSale,
    getSales,
    getSalesByProduct,
    getSalesByStore
} = require("../controllers/salesController");


// POST /api/sales
router.post("/", createSale);


// GET /api/sales
router.get("/", getSales);


// GET /api/sales/product/P036
router.get("/product/:productId", getSalesByProduct);


// GET /api/sales/store/S014
router.get("/store/:storeId", getSalesByStore);


module.exports = router;