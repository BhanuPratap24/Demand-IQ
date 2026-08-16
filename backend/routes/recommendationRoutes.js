const express = require("express");

const router = express.Router();

const {
    getRecommendations,
    getRecommendationByProduct
} = require("../controllers/recommendationController");


// GET all recommendations
router.get("/", getRecommendations);


// GET recommendation for one product
router.get(
    "/product/:productId",
    getRecommendationByProduct
);


module.exports = router;