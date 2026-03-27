const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single user
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update user profile
router.patch('/:id', async (req, res) => {
    try {
        const { name, profileImage, phone, address, username, email } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check for duplicates if email or username or phone are changing
        const duplicateCheck = await User.findOne({
            _id: { $ne: user._id },
            $or: [
                ...(email ? [{ email }] : []),
                ...(username ? [{ username }] : []),
                ...(phone ? [{ phone }] : [])
            ]
        });

        if (duplicateCheck) {
            if (duplicateCheck.email === email) return res.status(400).json({ message: 'Email is already in use' });
            if (duplicateCheck.username === username) return res.status(400).json({ message: 'Username is already taken' });
            if (duplicateCheck.phone === phone) return res.status(400).json({ message: 'Phone number is already in use' });
            return res.status(400).json({ message: 'A field is already in use by another account' });
        }

        if (name) user.name = name;
        if (profileImage !== undefined) user.profileImage = profileImage;
        if (phone !== undefined) user.phone = phone;
        if (address !== undefined) user.address = address;
        if (username) user.username = username;
        if (email) user.email = email;

        await user.save();
        res.json({
            message: 'Profile updated',
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage,
                phone: user.phone,
                address: user.address
            }
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Toggle user active status (admin action)
router.patch('/:id/status', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'admin') return res.status(403).json({ message: 'Cannot modify admin status' });

        user.isActive = req.body.isActive;
        await user.save();
        res.json({ message: 'User status updated', user });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot delete admin user' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
