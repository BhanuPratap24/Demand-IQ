
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const JWT_SECRET =
    process.env.JWT_SECRET || "demandiq_super_secret_2026";


// =============================
// SIGN UP
// =============================

const signup = async (req, res) => {
    try {
        const {
            full_name,
            email,
            phone,
            password,
            city,
            address
        } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Full name, email and password are required"
            });
        }

        const [existing] = await db.query(
            "SELECT customer_id FROM customers WHERE email = ?",
            [email]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO customers
            (full_name, email, phone, password_hash, city, address)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                full_name,
                email,
                phone || null,
                password_hash,
                city || null,
                address || null
            ]
        );

        const token = jwt.sign(
            {
                customer_id: result.insertId,
                email: email
            },
            JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            token: token,
            customer: {
                customer_id: result.insertId,
                full_name: full_name,
                email: email,
                phone: phone || null,
                city: city || null,
                address: address || null
            }
        });

    } catch (error) {
        console.error("Signup error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during signup",
            error: error.message
        });
    }
};


// =============================
// LOGIN
// =============================
const login = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const [rows] = await db.query(
            "SELECT * FROM customers WHERE email = ?",
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const customer = rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            customer.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                customer_id: customer.customer_id,
                email: customer.email
            },
            JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return res.json({
            success: true,
            message: "Login successful",
            token: token,
            customer: {
                customer_id: customer.customer_id,
                full_name: customer.full_name,
                email: customer.email,
                phone: customer.phone,
                city: customer.city,
                address: customer.address
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during login",
            error: error.message
        });
    }
};
// =============================
// GET CUSTOMER PROFILE
// =============================
const getProfile = async (req, res) => {
    try {
        const customerId = req.user.customer_id;

        const [rows] = await db.query(
            `SELECT
                customer_id,
                full_name,
                email,
                phone,
                city,
                address
             FROM customers
             WHERE customer_id = ?`,
            [customerId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        return res.json({
            success: true,
            customer: rows[0]
        });

    } catch (error) {
        console.error("Get profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching profile"
        });
    }
};


// =============================
// UPDATE CUSTOMER PROFILE
// =============================
const updateProfile = async (req, res) => {
    try {
        const customerId = req.user.customer_id;

        const {
            full_name,
            phone,
            city,
            address
        } = req.body;

        if (!full_name) {
            return res.status(400).json({
                success: false,
                message: "Full name is required"
            });
        }

        await db.query(
            `UPDATE customers
             SET full_name = ?,
                 phone = ?,
                 city = ?,
                 address = ?
             WHERE customer_id = ?`,
            [
                full_name,
                phone || null,
                city || null,
                address || null,
                customerId
            ]
        );

        const [rows] = await db.query(
            `SELECT
                customer_id,
                full_name,
                email,
                phone,
                city,
                address
             FROM customers
             WHERE customer_id = ?`,
            [customerId]
        );

        return res.json({
            success: true,
            message: "Profile updated successfully",
            customer: rows[0]
        });

    } catch (error) {
        console.error("Update profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating profile"
        });
    }
};



module.exports = {
    signup,
    login,
    getProfile,
    updateProfile
};

