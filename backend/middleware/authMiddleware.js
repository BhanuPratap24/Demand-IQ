const jwt = require("jsonwebtoken");

const JWT_SECRET =
    process.env.JWT_SECRET || "demandiq_super_secret_2026";

const authMiddleware = (req, res, next) => {
    try {

        // =====================================
        // GET AUTHORIZATION HEADER
        // =====================================

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication token required"
            });
        }

        // =====================================
        // EXTRACT TOKEN
        // =====================================

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token missing"
            });
        }

        // =====================================
        // VERIFY JWT
        // =====================================

        const decoded = jwt.verify(
            token,
            JWT_SECRET
        );

        // =====================================
        // CHECK CUSTOMER ID
        // =====================================

        if (!decoded.customer_id) {
            return res.status(401).json({
                success: false,
                message: "Invalid token: customer ID missing"
            });
        }

        // =====================================
        // ATTACH USER TO REQUEST
        // =====================================

        req.user = decoded;

        console.log(
            "Authenticated Customer:",
            req.user.customer_id
        );

        next();

    } catch (error) {

        console.error(
            "Auth middleware error:",
            error.message
        );

        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token"
        });
    }
};

module.exports = authMiddleware;