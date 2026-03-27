const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');

/* ================= GET ALL ORDERS ================= */

router.get('/', async (req, res) => {
    try {
        let filter = {};
        if (req.query.email) {
            filter.customerEmail = req.query.email;
        }

        const orders = await Order.find(filter).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ================= GET SINGLE ORDER ================= */

router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ================= PLACE ORDER ================= */

router.post('/', async (req, res) => {
    try {
        const order = new Order({
            orderId: 'ORD-' + Date.now(),

            product: req.body.product,
            productId: req.body.productId,
            productImage: req.body.productImage,
            productPrice: req.body.productPrice,
            quantity: req.body.quantity,
            size: req.body.size,

            customerName: req.body.customerName,
            customerEmail: req.body.customerEmail,
            customerPhone: req.body.customerPhone,
            customerAddress: req.body.customerAddress,

            totalAmount: req.body.totalAmount,
            status: 'Pending'
        });

        const newOrder = await order.save();

        if (req.body.productId) {
            await Product.findByIdAndUpdate(req.body.productId, {
                $inc: { orderCount: 1, stock: -req.body.quantity }
            });
        }

        res.status(201).json(newOrder);

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/* ================= UPDATE STATUS ================= */

router.patch('/:id/status', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );

        if (!order) return res.status(404).json({ message: 'Order not found' });

        res.json(order);

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/* ================= CANCEL ORDER ================= */

router.patch('/:id/cancel', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.status !== 'Pending') {
            return res.status(400).json({
                message: 'Only pending orders can be cancelled'
            });
        }

        order.status = 'Cancelled';
        await order.save();

        if (order.productId) {
            await Product.findByIdAndUpdate(order.productId, {
                $inc: { stock: order.quantity, orderCount: -1 }
            });
        }

        res.json({ message: 'Order cancelled', order });

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/* ================= DELETE ORDER ================= */

router.delete('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);

        if (!order) return res.status(404).json({ message: 'Order not found' });

        res.json({ message: 'Order deleted successfully' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;