const jwt = require("jsonwebtoken");

const JWT_SECRET =
    process.env.JWT_SECRET || "demandiq_super_secret_2026";

const authMiddleware = (req, res, next) => {

    console.log("========== AUTH MIDDLEWARE HIT ==========");

    try {

        const authHeader = req.headers.authorization;

        console.log("AUTH HEADER EXISTS:", !!authHeader);

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log("❌ NO BEARER TOKEN");

            return res.status(401).json({
                success: false,
                message: "Authentication token required"
            });
        }

        const token = authHeader.substring(7).trim();

        const decoded = jwt.verify(token, JWT_SECRET);

        console.log("JWT DECODED:", decoded);

        req.user = {
            customer_id: Number(decoded.customer_id),
            email: decoded.email
        };

        console.log(
            "✅ AUTH OK - Customer ID:",
            req.user.customer_id
        );

        next();

    } catch (error) {

        console.error(
            "❌ AUTH ERROR:",
            error.message
        );

        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token"
        });
    }
};

module.exports = authMiddleware;