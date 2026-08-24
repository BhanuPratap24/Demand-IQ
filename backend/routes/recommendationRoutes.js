const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
    getRecommendations,
    getRecommendationByProduct
} = require("../controllers/recommendationController");

// All recommendation routes require authentication
router.use(authMiddleware);

// GET all recommendations for the authenticated user
router.get("/", getRecommendations);

// GET recommendation for one product
router.get(
    "/product/:productId",
    getRecommendationByProduct
);

module.exports = router;