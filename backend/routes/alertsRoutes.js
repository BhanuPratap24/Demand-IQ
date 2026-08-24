const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
    getAlerts,
    getProductAlert
} = require("../controllers/alertsController");

// All alerts routes require authentication
router.use(authMiddleware);

// GET all active alerts for current customer
router.get("/", getAlerts);

// GET alert for specific product
router.get("/product/:productId", getProductAlert);

module.exports = router;