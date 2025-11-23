// server.js

const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

// Import custom classes
const Database = require('./classes/Database');
const User = require('./classes/User');

const app = express();
const PORT = 3000;

// Middleware (ORDER MATTERS!)
app.use(express.json());
app.use(cors());
app.use(express.static('public')); // Serve static files (HTML, CSS, JS, images)

// ==================== DEBUG MIDDLEWARE ====================
// Log all incoming requests (AFTER body parser)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
    }
    if (Object.keys(req.query).length > 0) {
        console.log('Query Params:', req.query);
    }
    next();
});

// Initialize database connection on server start
Database.initialize()
    .then(() => {
        console.log('✅ Database initialized successfully');
    })
    .catch(err => {
        console.error('❌ Database initialization failed:', err);
        process.exit(1);
    });

// ==================== HTML ROUTES ====================

// Serve login page as default
app.get('/', (req, res) => {
    console.log('📄 Serving login page');
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve signup page
app.get('/signup', (req, res) => {
    console.log('📄 Serving signup page');
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Serve dashboard page
app.get('/dashboard', (req, res) => {
    console.log('📄 Serving dashboard page');
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// ==================== USER API ROUTES ====================

// Register new user
app.post('/api/users/register', async (req, res) => {
    console.log('🔐 Registration attempt');
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            console.log('❌ Registration failed: Missing fields');
            return res.status(400).json({ 
                success: false, 
                message: 'Username, email, and password are required' 
            });
        }

        if (username.length < 3) {
            console.log('❌ Registration failed: Username too short');
            return res.status(400).json({ 
                success: false, 
                message: 'Username must be at least 3 characters' 
            });
        }

        if (password.length < 6) {
            console.log('❌ Registration failed: Password too short');
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters' 
            });
        }

        // Check if email already exists
        const existingUser = await Database.getUserByEmail(email);
        
        if (existingUser) {
            console.log('❌ Registration failed: Email already exists');
            return res.status(409).json({ 
                success: false, 
                message: 'Email already exists' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user using User class
        const newUser = new User(null, username, hashedPassword, email);
        
        // Add user to database
        await Database.addUser(newUser);

        console.log('✅ User registered successfully:', username);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                userId: newUser.getUserId(),
                username: newUser.getUserName(),
                email: newUser.getUserEmail()
            }
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Login user
app.post('/api/users/login', async (req, res) => {
    console.log('🔐 Login attempt');
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            console.log('❌ Login failed: Missing credentials');
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Get user from database using Database class
        const user = await Database.getUserByEmail(email);

        if (!user) {
            console.log('❌ Login failed: User not found');
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.getUserPassword());

        if (!isPasswordValid) {
            console.log('❌ Login failed: Invalid password');
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Load user data (items and receipts)
        await user.loadUserData();

        console.log('✅ Login successful:', user.getUserName());
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                userId: user.getUserId(),
                username: user.getUserName(),
                email: user.getUserEmail(),
                postedItemsCount: user.getAllPostedItems().length,
                rentingItemsCount: user.getAllRentingItems().length
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
    console.log('👤 Fetching user:', req.params.id);
    try {
        const userId = req.params.id;

        const user = await Database.getUserById(userId);

        if (!user) {
            console.log('❌ User not found:', userId);
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        console.log('✅ User found:', user.getUserName());
        res.json({
            success: true,
            data: {
                userId: user.getUserId(),
                username: user.getUserName(),
                email: user.getUserEmail()
            }
        });

    } catch (error) {
        console.error('❌ Get user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Update user profile
app.put('/api/users/:id', async (req, res) => {
    console.log('✏️ Updating user:', req.params.id);
    try {
        const userId = req.params.id;
        const { username, email, password } = req.body;

        const user = await Database.getUserById(userId);

        if (!user) {
            console.log('❌ User not found:', userId);
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Update user fields
        if (username) user.setUserName(username);
        if (email) user.setUserEmail(email);
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.setUserPassword(hashedPassword);
        }

        await Database.updateUser(user);

        console.log('✅ User updated successfully:', user.getUserName());
        res.json({
            success: true,
            message: 'User updated successfully',
            data: {
                userId: user.getUserId(),
                username: user.getUserName(),
                email: user.getUserEmail()
            }
        });

    } catch (error) {
        console.error('❌ Update user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// ==================== ITEM ROUTES ====================

// Get all available items (with optional tag filter)
app.get('/api/items/available', async (req, res) => {
    console.log('📦 Fetching available items');
    try {
        const { tag } = req.query;
        
        let items;
        if (tag && tag !== 'All') {
            console.log('🏷️ Filtering by tag:', tag);
            items = await Database.getItemsByTag(tag);
        } else {
            console.log('📋 Fetching all available items');
            items = await Database.getAvailableItems();
        }
        
        console.log(`✅ Found ${items.length} items`);
        res.json({
            success: true,
            data: items.map(item => ({
                itemId: item.getItemId(),
                itemName: item.getItemName(),
                ownerId: item.getOwnerId(),
                imageUrl: item.getImageUrl(),
                description: item.getDescription(),
                price: item.getPrice(),
                condition: item.getCondition(),
                tags: item.getTags(),
                isRenting: item.isRenting,
                isRented: item.isRented
            }))
        });
    } catch (error) {
        console.error('❌ Get available items error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get items by category/tag
app.get('/api/items/category/:category', async (req, res) => {
    console.log('🏷️ Fetching items by category:', req.params.category);
    try {
        const category = req.params.category;
        
        // Validate category
        const Item = require('./classes/Item');
        if (!Object.values(Item.Tag).includes(category)) {
            console.log('❌ Invalid category:', category);
            return res.status(400).json({
                success: false,
                message: 'Invalid category'
            });
        }
        
        const items = await Database.getItemsByTag(category);
        
        console.log(`✅ Found ${items.length} items in category:`, category);
        res.json({
            success: true,
            data: items.map(item => ({
                itemId: item.getItemId(),
                itemName: item.getItemName(),
                ownerId: item.getOwnerId(),
                imageUrl: item.getImageUrl(),
                description: item.getDescription(),
                price: item.getPrice(),
                condition: item.getCondition(),
                tags: item.getTags(),
                isRenting: item.isRenting,
                isRented: item.isRented
            }))
        });
    } catch (error) {
        console.error('❌ Get items by category error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get items by owner
app.get('/api/items/owner/:ownerId', async (req, res) => {
    console.log('👤 Fetching items by owner:', req.params.ownerId);
    try {
        const ownerId = req.params.ownerId;
        const items = await Database.getItemsByOwner(ownerId);

        console.log(`✅ Found ${items.length} items for owner:`, ownerId);
        res.json({
            success: true,
            data: items.map(item => ({
                itemId: item.getItemId(),
                itemName: item.getItemName(),
                ownerId: item.getOwnerId(),
                renterId: item.getRenterId(),
                isRenting: item.isRenting,
                isRented: item.isRented
            }))
        });

    } catch (error) {
        console.error('❌ Get owner items error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get items by renter
app.get('/api/items/renter/:renterId', async (req, res) => {
    console.log('👤 Fetching items by renter:', req.params.renterId);
    try {
        const renterId = req.params.renterId;
        const items = await Database.getItemsByRenter(renterId);

        console.log(`✅ Found ${items.length} items for renter:`, renterId);
        res.json({
            success: true,
            data: items.map(item => ({
                itemId: item.getItemId(),
                itemName: item.getItemName(),
                ownerId: item.getOwnerId(),
                renterId: item.getRenterId(),
                isRenting: item.isRenting,
                isRented: item.isRented
            }))
        });

    } catch (error) {
        console.error('❌ Get renter items error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
    console.log('❌ 404 Not Found:', req.url);
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await Database.close();
    console.log('✅ Database connections closed');
    process.exit();
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await Database.close();
    console.log('✅ Database connections closed');
    process.exit();
});