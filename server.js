// ==========================================
// SERVER.JS — Express + MongoDB Backend
// ==========================================
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const beachRoutes = require('./routes/beaches');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// API ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/beaches', beachRoutes);

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================================
// CONNECT TO MONGODB & START SERVER
// ==========================================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/beach-finder';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB successfully!');
        app.listen(PORT, () => {
            if (!process.env.JWT_SECRET) {
                console.warn('⚠️ WARNING: JWT_SECRET is not defined in .env file!');
            }
            console.log(`🌊 Beach Vibe India server running at http://localhost:${PORT}`);
            console.log(`📡 API endpoints:`);
            console.log(`   POST /api/auth/register  — Register new user`);
            console.log(`   POST /api/auth/login     — Login user`);
            console.log(`   GET  /api/auth/profile   — Get user profile`);
            console.log(`   PUT  /api/auth/profile   — Update user profile`);
            console.log(`   POST /api/auth/favorites/:beachId — Toggle favorite`);
            console.log(`   GET  /api/beaches        — Get all beaches`);
            console.log(`   GET  /api/beaches/:id    — Get single beach`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.log('');
        console.log('💡 Make sure MongoDB is running!');
        console.log('   Option 1: Install MongoDB locally → https://www.mongodb.com/try/download/community');
        console.log('   Option 2: Use MongoDB Atlas (cloud) → https://www.mongodb.com/atlas');
        console.log('            Then update MONGODB_URI in .env file');
        process.exit(1);
    });
