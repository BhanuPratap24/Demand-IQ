
const express = require("express");

const router = express.Router();

const {
    signup,
    login,
    getProfile,
    updateProfile
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");


// Create customer account
router.post("/signup", signup);

// Customer login
router.post("/login", login);

// Get customer profile
router.get("/profile", authMiddleware, getProfile);

// Update customer profile
router.put("/profile", authMiddleware, updateProfile);

module.exports = router;

