const express = require("express");

const router = express.Router();

const {
    createInventory,
    getInventory,
    getInventoryByProduct,
    updateStock
} = require("../controllers/inventoryController");

router.post("/", createInventory);

router.get("/", getInventory);

router.get("/product/:productId", getInventoryByProduct);

router.put("/:id", updateStock);

module.exports = router;