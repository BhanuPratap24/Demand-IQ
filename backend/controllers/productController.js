const Product = require("../models/productModel");

// =====================================
// ADD PRODUCT
// =====================================

const addProduct = async (req, res) => {
    try {

        const customer_id = req.user.customer_id;
        const product = req.body;

        // Basic validation
        if (!product.product_id || !product.product_name) {
            return res.status(400).json({
                success: false,
                message: "product_id and product_name are required"
            });
        }

        // =====================================
        // CHECK IF PRODUCT ALREADY EXISTS
        // =====================================

        const existingProduct =
            await Product.getCustomerProduct(customer_id, product.product_id);

        // =====================================
        // PRODUCT ALREADY EXISTS
        // =====================================

        if (existingProduct) {

            return res.status(409).json({
                success: false,
                existingProduct: true,
                message:
                    "Product already exists. Add quantity to increase its stock.",
                product_id: product.product_id
            });
        }

        // =====================================
        // CREATE NEW PRODUCT
        // =====================================

        const result =
            await Product.createProduct({
                ...product,
                customer_id
            });

        res.status(201).json({
            success: true,
            message: "Product added successfully",
            product_id: product.product_id,
            database_id: result.insertId
        });

    } catch (error) {

        console.error(
            "Add Product Error:",
            error.message
        );

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

        const customer_id = req.user.customer_id;

        const products =
            await Product.getProducts(customer_id);

        res.json({
            success: true,
            count: products.length,
            data: products
        });

    } catch (error) {

        console.error(
            "Get Products Error:",
            error.message
        );

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

        const product =
            await Product.getProductById(
                req.params.productId
            );

        // Product not found
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

        console.error(
            "Get Product Error:",
            error.message
        );

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