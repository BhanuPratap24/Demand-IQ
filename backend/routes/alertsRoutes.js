const express = require("express");

const router = express.Router();

const {
    getAlerts,
    getProductAlert
} = require("../controllers/alertsController");


// GET all active alerts
router.get("/", getAlerts);


// GET alert for specific product
router.get("/product/:productId", getProductAlert);


module.exports = router;