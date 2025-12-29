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

app.post('/api/items', async (req, res) => {
    console.log('📦 Posting new item');
    try {
        const { itemName, ownerId, renterId, description, price, condition, tags, isRenting, isRented, imageUrl } = req.body;

        // Validation
        if (!itemName || !ownerId || !description || !price || !condition || !tags || tags.length === 0) {
            console.log('❌ Post item failed: Missing fields');
            return res.status(400).json({ 
                success: false, 
                message: 'Item name, description, price, condition, and at least one tag are required' 
            });
        }

        // Validate owner exists
        const owner = await Database.getUserById(ownerId);
        if (!owner) {
            console.log('❌ Post item failed: Owner not found');
            return res.status(404).json({ 
                success: false, 
                message: 'Owner not found' 
            });
        }

        // Create new item using Item class
        const Item = require('./classes/Item');
        const newItem = new Item(null, itemName, ownerId, renterId || null, imageUrl || null);
        newItem.setDescription(description);
        newItem.setPrice(price);
        newItem.setCondition(condition);
        tags.forEach(tag => newItem.addTag(tag));
        newItem.isRenting = isRenting !== false; // Default true for posting
        newItem.isRented = isRented || false;

        // Add item to database
        await Database.addItem(newItem);

        console.log('✅ Item posted successfully:', itemName);
        res.status(201).json({
            success: true,
            message: 'Item posted successfully',
            data: {
                itemId: newItem.getItemId(),
                itemName: newItem.getItemName()
            }
        });

    } catch (error) {
        console.error('❌ Post item error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
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

// ==================== RECEIPT API ROUTES ====================

// Get receipts by owner
app.get('/api/receipts/owner/:ownerId', async (req, res) => {
    console.log('📄 Fetching receipts for owner:', req.params.ownerId);
    try {
        const ownerId = req.params.ownerId;
        const receipts = await Database.getReceiptsByOwner(ownerId);

        console.log(`✅ Found ${receipts.length} receipts for owner:`, ownerId);
        res.json({
            success: true,
            data: receipts.map(receipt => ({
                receiptId: receipt.receiptId,
                itemId: receipt.itemId,
                ownerId: receipt.ownerId,
                renterId: receipt.renterId,
                rentalStartDate: receipt.rentalStartDate,
                rentalEndDate: receipt.rentalEndDate,
                rentalPrice: receipt.rentalPrice,
                status: receipt.status,
                createdAt: receipt.createdAt
            }))
        });

    } catch (error) {
        console.error('❌ Get owner receipts error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get receipts by renter
app.get('/api/receipts/renter/:renterId', async (req, res) => {
    console.log('📄 Fetching receipts for renter:', req.params.renterId);
    try {
        const renterId = req.params.renterId;
        const receipts = await Database.getReceiptsByRenter(renterId);

        console.log(`✅ Found ${receipts.length} receipts for renter:`, renterId);
        res.json({
            success: true,
            data: receipts.map(receipt => ({
                receiptId: receipt.receiptId,
                itemId: receipt.itemId,
                ownerId: receipt.ownerId,
                renterId: receipt.renterId,
                rentalStartDate: receipt.rentalStartDate,
                rentalEndDate: receipt.rentalEndDate,
                rentalPrice: receipt.rentalPrice,
                status: receipt.status,
                createdAt: receipt.createdAt
            }))
        });

    } catch (error) {
        console.error('❌ Get renter receipts error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get item by ID (for receipt details)
app.get('/api/items/:itemId', async (req, res) => {
    console.log('📦 Fetching item:', req.params.itemId);
    try {
        const itemId = req.params.itemId;
        const item = await Database.getItemById(itemId);

        if (!item) {
            console.log('❌ Item not found:', itemId);
            return res.status(404).json({ 
                success: false, 
                message: 'Item not found' 
            });
        }

        console.log('✅ Item found:', item.getItemName());
        res.json({
            success: true,
            data: {
                itemId: item.getItemId(),
                itemName: item.getItemName(),
                ownerId: item.getOwnerId(),
                renterId: item.getRenterId(),
                imageUrl: item.getImageUrl(),
                description: item.getDescription(),
                price: item.getPrice(),
                condition: item.getCondition(),
                tags: item.getTags(),
                isRenting: item.isRenting,
                isRented: item.isRented
            }
        });

    } catch (error) {
        console.error('❌ Get item error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// ==================== CART API ROUTES ====================

/**
 * GET /api/cart/:userId
 * Get user's cart with full item details
 */
app.get('/api/cart/:userId', async (req, res) => {
    console.log('🛒 [GET CART] User:', req.params.userId);
    try {
        const userId = parseInt(req.params.userId);
        
        if (isNaN(userId)) {
            console.log('❌ [GET CART] Invalid user ID');
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        
        const cartItems = await Database.getCart(userId);
        
        console.log(`✅ [GET CART] Success: ${cartItems.length} items`);
        res.json({
            success: true,
            data: cartItems
        });
        
    } catch (error) {
        console.error('❌ [GET CART] Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * POST /api/cart
 * Add item to cart
 * Body: { userId, itemId, quantity }
 */
app.post('/api/cart', async (req, res) => {
    console.log('🛒 [ADD TO CART] Request:', req.body);
    try {
        const { userId, itemId, quantity = 1 } = req.body;
        
        // Validation
        if (!userId || !itemId) {
            console.log('❌ [ADD TO CART] Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'User ID and Item ID are required'
            });
        }
        
        if (quantity < 1) {
            console.log('❌ [ADD TO CART] Invalid quantity');
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1'
            });
        }
        
        // Add to cart
        const cartEntry = await Database.addToCart(
            parseInt(userId), 
            parseInt(itemId), 
            parseInt(quantity)
        );
        
        console.log(`✅ [ADD TO CART] Success:`, cartEntry);
        res.status(201).json({
            success: true,
            message: 'Item added to cart',
            data: cartEntry
        });
        
    } catch (error) {
        console.error('❌ [ADD TO CART] Error:', error.message);
        
        // Handle specific errors
        if (error.message === 'Item not found') {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }
        
        if (error.message === 'Item is not available for rent') {
            return res.status(400).json({
                success: false,
                message: 'Item is not available for rent'
            });
        }
        
        if (error.message === 'Cannot add your own item to cart') {
            return res.status(400).json({
                success: false,
                message: 'Cannot add your own item to cart'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * PUT /api/cart
 * Update cart item quantity
 * Body: { userId, itemId, quantity }
 */
app.put('/api/cart', async (req, res) => {
    console.log('🛒 [UPDATE CART] Request:', req.body);
    try {
        const { userId, itemId, quantity } = req.body;
        
        // Validation
        if (!userId || !itemId || !quantity) {
            console.log('❌ [UPDATE CART] Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'User ID, Item ID, and quantity are required'
            });
        }
        
        if (quantity < 1) {
            console.log('❌ [UPDATE CART] Invalid quantity');
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1'
            });
        }
        
        // Update quantity
        const result = await Database.updateCartQuantity(
            parseInt(userId), 
            parseInt(itemId), 
            parseInt(quantity)
        );
        
        console.log(`✅ [UPDATE CART] Success:`, result);
        res.json({
            success: true,
            message: 'Cart updated',
            data: result
        });
        
    } catch (error) {
        console.error('❌ [UPDATE CART] Error:', error.message);
        
        if (error.message === 'Cart item not found') {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * DELETE /api/cart/:userId/:itemId
 * Remove item from cart
 */
app.delete('/api/cart/:userId/:itemId', async (req, res) => {
    console.log('🛒 [REMOVE FROM CART] User:', req.params.userId, 'Item:', req.params.itemId);
    try {
        const userId = parseInt(req.params.userId);
        const itemId = parseInt(req.params.itemId);
        
        if (isNaN(userId) || isNaN(itemId)) {
            console.log('❌ [REMOVE FROM CART] Invalid parameters');
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID or item ID'
            });
        }
        
        const success = await Database.removeFromCart(userId, itemId);
        
        if (!success) {
            console.log('⚠️ [REMOVE FROM CART] Item not found in cart');
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }
        
        console.log(`✅ [REMOVE FROM CART] Success`);
        res.json({
            success: true,
            message: 'Item removed from cart'
        });
        
    } catch (error) {
        console.error('❌ [REMOVE FROM CART] Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * DELETE /api/cart/:userId
 * Clear user's entire cart
 */
app.delete('/api/cart/:userId', async (req, res) => {
    console.log('🛒 [CLEAR CART] User:', req.params.userId);
    try {
        const userId = parseInt(req.params.userId);
        
        if (isNaN(userId)) {
            console.log('❌ [CLEAR CART] Invalid user ID');
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        
        const removedCount = await Database.clearCart(userId);
        
        console.log(`✅ [CLEAR CART] Success: ${removedCount} items removed`);
        res.json({
            success: true,
            message: 'Cart cleared',
            data: { removedCount }
        });
        
    } catch (error) {
        console.error('❌ [CLEAR CART] Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * GET /api/cart/:userId/count
 * Get cart item count
 */
app.get('/api/cart/:userId/count', async (req, res) => {
    console.log('🛒 [CART COUNT] User:', req.params.userId);
    try {
        const userId = parseInt(req.params.userId);
        
        if (isNaN(userId)) {
            console.log('❌ [CART COUNT] Invalid user ID');
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        
        const count = await Database.getCartCount(userId);
        
        console.log(`✅ [CART COUNT] Success: ${count}`);
        res.json({
            success: true,
            data: { count }
        });
        
    } catch (error) {
        console.error('❌ [CART COUNT] Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * GET /api/cart/:userId/total
 * Get cart total price
 */
app.get('/api/cart/:userId/total', async (req, res) => {
    console.log('🛒 [CART TOTAL] User:', req.params.userId);
    try {
        const userId = parseInt(req.params.userId);
        
        if (isNaN(userId)) {
            console.log('❌ [CART TOTAL] Invalid user ID');
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        
        const total = await Database.getCartTotal(userId);
        
        console.log(`✅ [CART TOTAL] Success: ₱${total}`);
        res.json({
            success: true,
            data: { total }
        });
        
    } catch (error) {
        console.error('❌ [CART TOTAL] Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
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