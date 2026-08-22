
const express = require("express");
console.log("✅ INVENTORY ROUTES LOADED");

const {
    createInventory,
    getInventory,
    getInventoryByProduct,
    updateStock
} = require("../controllers/inventoryController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

console.log("✅ INVENTORY ROUTES LOADED");

router.get("/", authMiddleware, getInventory);

router.post("/", authMiddleware, createInventory);

router.get("/:productId", authMiddleware, getInventoryByProduct);

router.put("/:id", authMiddleware, updateStock);

module.exports = router;