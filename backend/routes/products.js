const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a new product
router.post('/', async (req, res) => {
    console.log('Received POST request to add product:', req.body);
    const product = new Product({
        name: req.body.name,
        price: req.body.price,
        image: req.body.image,
        category: req.body.category,
        stock: req.body.stock,
        description: req.body.description
    });

    try {
        const newProduct = await product.save();
        console.log('Product saved successfully:', newProduct._id);
        res.status(201).json(newProduct);
    } catch (err) {
        console.error('Error saving product:', err.message);
        res.status(400).json({ message: err.message });
    }
});

// Update product
router.patch('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update stock (specific action)
router.patch('/:id/stock', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        product.stock -= req.body.quantity; // positive quantity deducts stock
        if (req.body.quantity < 0) {
            // adding stock
            product.orderCount = product.orderCount || 0;
        } else {
            product.orderCount += 1;
        }

        await product.save();
        res.json(product);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete all products
router.delete('/', async (req, res) => {
    try {
        await Product.deleteMany({});
        res.json({ message: 'All products deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete single product
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
