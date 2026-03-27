const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

const User = require('../models/User');

/* ── In-memory OTP store: { email: { otp, expiresAt } } ── */
const otpStore = new Map();

/* ── Nodemailer transporter (Gmail) ── */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

/* ================================
   REGISTER
================================ */

router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, username, password } = req.body;

        const existingUser = await User.findOne({
            $or: [{ email }, { phone }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            phone,
            username,
            password: hashedPassword
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ================================
   LOGIN WITH PASSWORD
================================ */

router.post('/login', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const query = username ? { username } : { email };
        const user = await User.findOne(query);

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


/* ================================
   CHANGE PASSWORD
================================ */

router.post('/change-password', async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Current password incorrect' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: 'Password changed successfully' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


/* ================================
   SEND OTP (Forgot Password)
================================ */

router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Check if user exists with this email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'No account found with this email' });
        }

        // Generate 6-digit OTP (digits only)
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });

        // Store OTP with 5-minute expiry
        otpStore.set(email, {
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000
        });

        // Send email
        await transporter.sendMail({
            from: `"Arbuda Fashion" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: '🔐 Your Login Verification Code - Arbuda Fashion',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 30px; background: #f9fafb; border-radius: 12px;">
                    <h2 style="text-align: center; color: #111827; margin-bottom: 8px;">Arbuda Fashion</h2>
                    <p style="text-align: center; color: #6b7280; margin-bottom: 24px;">Login Verification Code</p>
                    <div style="background: #ffffff; border-radius: 10px; padding: 30px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <p style="color: #374151; font-size: 15px; margin-bottom: 20px;">
                            Hi <strong>${user.name}</strong>, use the code below to log in to your account:
                        </p>
                        <div style="background: #f3f4f6; border-radius: 8px; padding: 18px; margin: 20px 0;">
                            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111827;">${otp}</span>
                        </div>
                        <p style="color: #9ca3af; font-size: 13px; margin-top: 16px;">
                            This code expires in <strong>5 minutes</strong>. Do not share it with anyone.
                        </p>
                    </div>
                    <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
                        If you didn't request this, please ignore this email.
                    </p>
                </div>
            `
        });

        console.log(`📧 OTP sent to ${email}: ${otp}`);
        res.json({ message: 'Verification code sent to your email' });

    } catch (err) {
        console.error('Send OTP error:', err);
        res.status(500).json({ message: 'Failed to send verification code. Please try again.' });
    }
});


/* ================================
   VERIFY OTP (Login without password)
================================ */

router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        // Check OTP exists
        const stored = otpStore.get(email);
        if (!stored) {
            return res.status(400).json({ message: 'No verification code found. Please request a new one.' });
        }

        // Check expiry
        if (Date.now() > stored.expiresAt) {
            otpStore.delete(email);
            return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
        }

        // Check match
        if (stored.otp !== otp) {
            return res.status(400).json({ message: 'Invalid verification code. Please try again.' });
        }

        // OTP is correct — delete it and log user in
        otpStore.delete(email);

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user
        });

    } catch (err) {
        console.error('Verify OTP error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;