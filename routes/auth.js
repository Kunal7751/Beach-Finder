const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Middleware to verify JWT token
function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token.' });
    }
}

// ==========================================
// REGISTER
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, country, state, city } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });
        if (existingUser) {
            return res.status(400).json({
                error: existingUser.email === email
                    ? 'Email already registered'
                    : 'Username already taken'
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password,
            country: country || 'India',
            state: state || '',
            city: city || ''
        });

        await user.save();

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Registration successful!',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                country: user.country,
                state: user.state,
                city: user.city,
                favoriteBeaches: user.favoriteBeaches
            }
        });
    } catch (err) {
        console.error('Registration Error:', err);

        // Handle MongoDB Duplicate Key Error
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({
                error: field === 'email' ? 'Email already registered' : 'Username already taken'
            });
        }

        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: `Server error: ${err.message}` });
    }
});

// ==========================================
// LOGIN
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                country: user.country,
                state: user.state,
                city: user.city,
                favoriteBeaches: user.favoriteBeaches
            }
        });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: `Server error: ${err.message}` });
    }
});

// ==========================================
// GET PROFILE (Protected)
// ==========================================
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ==========================================
// UPDATE PROFILE (Protected)
// ==========================================
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { username, country, state, city } = req.body;
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (username) user.username = username;
        if (country) user.country = country;
        if (state !== undefined) user.state = state;
        if (city !== undefined) user.city = city;

        await user.save();

        res.json({
            message: 'Profile updated!',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                country: user.country,
                state: user.state,
                city: user.city,
                favoriteBeaches: user.favoriteBeaches
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ==========================================
// TOGGLE FAVORITE BEACH (Protected)
// ==========================================
router.post('/favorites/:beachId', authMiddleware, async (req, res) => {
    try {
        const beachId = parseInt(req.params.beachId);
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const index = user.favoriteBeaches.indexOf(beachId);
        if (index > -1) {
            user.favoriteBeaches.splice(index, 1);
        } else {
            user.favoriteBeaches.push(beachId);
        }

        await user.save();

        res.json({
            favoriteBeaches: user.favoriteBeaches,
            message: index > -1 ? 'Removed from favorites' : 'Added to favorites'
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
