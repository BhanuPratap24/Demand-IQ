const Product = require("../models/productModel");

// =====================================
// ADD PRODUCT
// =====================================

const addProduct = async (req, res) => {
    try {

        const product = req.body;

        if (!product.product_id || !product.product_name) {
            return res.status(400).json({
                success: false,
                message: "product_id and product_name are required"
            });
        }

        const result = await Product.createProduct(product);

        res.status(201).json({
            success: true,
            message: "Product added successfully",
            product_id: product.product_id,
            database_id: result.insertId
        });

    } catch (error) {

        console.error("Add Product Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to add product",
            error: error.message
        });
    }
};


// =====================================
// GET ALL PRODUCTS
// =====================================

const getProducts = async (req, res) => {
    try {

        const products = await Product.getProducts();

        res.json({
            success: true,
            count: products.length,
            data: products
        });

    } catch (error) {

        console.error("Get Products Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch products",
            error: error.message
        });
    }
};


// =====================================
// GET SINGLE PRODUCT
// =====================================

const getProduct = async (req, res) => {
    try {

        const product = await Product.getProductById(
            req.params.productId
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            data: product
        });

    } catch (error) {

        console.error("Get Product Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch product",
            error: error.message
        });
    }
};


// =====================================
// EXPORT
// =====================================

module.exports = {
    addProduct,
    getProducts,
    getProduct
};