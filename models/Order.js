const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    orderId: { type: String, required: true, unique: true },

    product: { type: String, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productImage: { type: String },
    productPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    size: { type: String },

    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String },
    customerAddress: { type: String },

    totalAmount: { type: Number, required: true },

    status: { type: String, default: 'Pending' }

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);