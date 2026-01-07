// server.js

require('dotenv').config(); // This MUST be at the top!

const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

// Import custom classes
const Database = require('./classes/Database');
const User = require('./classes/User');
const PaymentService = require('./services/PaymentService'); // Add this

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

// ==================== RENTAL PROCESS ROUTES ====================

// Update item to rented status
app.put('/api/items/:itemId/rent', async (req, res) => {
    console.log('🏠 Renting item:', req.params.itemId);
    try {
        const { itemId } = req.params;
        const { renterId, isRented } = req.body;

        // Validate input
        if (!renterId) {
            return res.status(400).json({
                success: false,
                message: 'Renter ID is required'
            });
        }

        // Get the item
        const item = await Database.getItemById(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        // Check if item is already rented
        if (item.isRented) {
            return res.status(400).json({
                success: false,
                message: 'Item is already rented'
            });
        }

        // Check if item is available for renting
        if (!item.isRenting) {
            return res.status(400).json({
                success: false,
                message: 'Item is not available for rent'
            });
        }

        // Check if owner is trying to rent their own item
        if (item.getOwnerId() === renterId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot rent your own item'
            });
        }

        // Update item
        item.setRenterId(renterId);
        item.isRented = true;
        await Database.updateItem(item);

        console.log(`✅ Item rented successfully: ${item.getItemName()}`);
        res.json({
            success: true,
            message: 'Item rented successfully',
            data: {
                itemId: item.getItemId(),
                itemName: item.getItemName(),
                renterId: item.getRenterId(),
                isRented: item.isRented
            }
        });

    } catch (error) {
        console.error('❌ Rent item error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Return item (end rental)
app.put('/api/items/:itemId/return', async (req, res) => {
    console.log('🔙 Returning item:', req.params.itemId);
    try {
        const { itemId } = req.params;
        const { receiptId } = req.body;

        // Get the item
        const item = await Database.getItemById(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        // Check if item is actually rented
        if (!item.isRented) {
            return res.status(400).json({
                success: false,
                message: 'Item is not currently rented'
            });
        }

        // Update item
        item.setRenterId(null);
        item.isRented = false;
        await Database.updateItem(item);

        // Update receipt status if provided
        if (receiptId) {
            await Database.updateReceiptStatus(receiptId, 'completed');
        }

        console.log(`✅ Item returned successfully: ${item.getItemName()}`);
        res.json({
            success: true,
            message: 'Item returned successfully',
            data: {
                itemId: item.getItemId(),
                itemName: item.getItemName(),
                isRented: item.isRented
            }
        });

    } catch (error) {
        console.error('❌ Return item error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// ==================== RATING ROUTES ====================

// Add/Update rating for an item
app.post('/api/items/:itemId/rate', async (req, res) => {
    console.log('⭐ Rating item:', req.params.itemId);
    try {
        const { itemId } = req.params;
        const { renterId, rating } = req.body;

        if (!renterId || rating === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Renter ID and rating are required'
            });
        }

        if (rating < 0 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 0 and 5'
            });
        }

        await Database.addItemRating(itemId, renterId, rating);

        console.log(`✅ Item rated successfully: ${itemId} - ${rating} stars`);
        res.json({
            success: true,
            message: 'Rating submitted successfully'
        });

    } catch (error) {
        console.error('❌ Rate item error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
});

// Get user's rating for an item
app.get('/api/items/:itemId/rating/:renterId', async (req, res) => {
    console.log('🔍 Getting user rating for item:', req.params.itemId);
    try {
        const { itemId, renterId } = req.params;

        const rating = await Database.getUserRatingForItem(itemId, renterId);

        res.json({
            success: true,
            data: rating
        });

    } catch (error) {
        console.error('❌ Get user rating error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Check if user can rate an item
app.get('/api/items/:itemId/can-rate/:renterId', async (req, res) => {
    console.log('✅ Checking rating permission for item:', req.params.itemId);
    try {
        const { itemId, renterId } = req.params;

        const canRate = await Database.canUserRateItem(itemId, renterId);

        res.json({
            success: true,
            data: { canRate }
        });

    } catch (error) {
        console.error('❌ Check rating permission error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Mark item as arrived (sets is_rented to true)
app.put('/api/items/:itemId/arrived', async (req, res) => {
    console.log('📦 Marking item as arrived:', req.params.itemId);
    try {
        const { itemId } = req.params;
        const { renterId, renterName } = req.body;

        // Get the item
        const item = await Database.getItemById(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        // Check if already marked as arrived (is_rented = true)
        if (item.isRented) {
            return res.status(400).json({
                success: false,
                message: 'Item already marked as arrived'
            });
        }

        // Mark as arrived
        await Database.markItemAsArrived(itemId);

        // Send notifications only if not already arrived
        const Notification = require('./classes/Notification');
        
        // Notification for renter
        const renterNotif = Notification.createItemArrivedNotificationForRenter(
            renterId,
            itemId,
            item.getItemName(),
            item.getOwnerId()
        );
        await Database.addNotification(renterNotif);
        
        // Notification for owner
        const ownerNotif = Notification.createItemArrivedNotificationForOwner(
            item.getOwnerId(),
            itemId,
            item.getItemName(),
            renterName,
            renterId
        );
        await Database.addNotification(ownerNotif);

        console.log(`✅ Item marked as arrived: ${item.getItemName()}`);
        res.json({
            success: true,
            message: 'Item marked as arrived',
            data: {
                itemId: item.getItemId(),
                itemName: item.getItemName(),
                isRented: true
            }
        });

    } catch (error) {
        console.error('❌ Mark item as arrived error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// ==================== RECEIPT ROUTES ====================

// Create a new receipt
app.post('/api/receipts', async (req, res) => {
    console.log('📄 Creating receipt');
    try {
        const {
            itemId,
            ownerId,
            renterId,
            rentalStartDate,
            rentalEndDate,
            rentalPrice,
            status
        } = req.body;

        // Validation
        if (!itemId || !ownerId || !renterId || !rentalStartDate || !rentalEndDate || !rentalPrice) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate that owner and renter exist
        const owner = await Database.getUserById(ownerId);
        const renter = await Database.getUserById(renterId);
        const item = await Database.getItemById(itemId);

        if (!owner || !renter || !item) {
            return res.status(404).json({
                success: false,
                message: 'Owner, renter, or item not found'
            });
        }

        // Create receipt
        const Receipt = require('./classes/Receipt');
        const receipt = new Receipt();
        receipt.itemId = itemId;
        receipt.ownerId = ownerId;
        receipt.renterId = renterId;
        receipt.rentalStartDate = new Date(rentalStartDate);
        receipt.rentalEndDate = new Date(rentalEndDate);
        receipt.rentalPrice = parseFloat(rentalPrice);
        receipt.status = status || 'active';

        // Add to database
        await Database.addReceipt(receipt);

        console.log(`✅ Receipt created: ${receipt.receiptId}`);
        res.status(201).json({
            success: true,
            message: 'Receipt created successfully',
            data: {
                receiptId: receipt.receiptId,
                itemId: receipt.itemId,
                status: receipt.status
            }
        });

    } catch (error) {
        console.error('❌ Create receipt error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Update receipt status
app.put('/api/receipts/:receiptId/status', async (req, res) => {
    console.log('📝 Updating receipt status:', req.params.receiptId);
    try {
        const { receiptId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        // Valid statuses
        const validStatuses = ['active', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        await Database.updateReceiptStatus(receiptId, status);

        console.log(`✅ Receipt status updated: ${receiptId} -> ${status}`);
        res.json({
            success: true,
            message: 'Receipt status updated',
            data: { receiptId, status }
        });

    } catch (error) {
        console.error('❌ Update receipt status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get receipt by ID
app.get('/api/receipts/:receiptId', async (req, res) => {
    console.log('📄 Fetching receipt:', req.params.receiptId);
    try {
        const { receiptId } = req.params;
        const receipt = await Database.getReceiptById(receiptId);

        if (!receipt) {
            return res.status(404).json({
                success: false,
                message: 'Receipt not found'
            });
        }

        console.log('✅ Receipt found');
        res.json({
            success: true,
            data: {
                receiptId: receipt.receiptId,
                itemId: receipt.itemId,
                ownerId: receipt.ownerId,
                renterId: receipt.renterId,
                rentalStartDate: receipt.rentalStartDate,
                rentalEndDate: receipt.rentalEndDate,
                rentalPrice: receipt.rentalPrice,
                status: receipt.status,
                createdAt: receipt.createdAt
            }
        });

    } catch (error) {
        console.error('❌ Get receipt error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
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

// ==================== NOTIFICATION API ROUTES ====================

// Get user's notifications
app.get('/api/notifications/:userId', async (req, res) => {
    console.log('📬 Fetching notifications for user:', req.params.userId);
    try {
        const userId = parseInt(req.params.userId);
        const limit = parseInt(req.query.limit) || 50;
        
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        
        const notifications = await Database.getNotificationsByUser(userId, limit);
        
        console.log(`✅ Found ${notifications.length} notifications`);
        res.json({
            success: true,
            data: notifications.map(n => n.toJSON())
        });
        
    } catch (error) {
        console.error('❌ Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get unread notification count
app.get('/api/notifications/:userId/unread-count', async (req, res) => {
    console.log('📬 Getting unread count for user:', req.params.userId);
    try {
        const userId = parseInt(req.params.userId);
        
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        
        const count = await Database.getUnreadNotificationCount(userId);
        
        res.json({
            success: true,
            data: { count }
        });
        
    } catch (error) {
        console.error('❌ Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Mark notification as read
app.put('/api/notifications/:notificationId/read', async (req, res) => {
    console.log('✅ Marking notification as read:', req.params.notificationId);
    try {
        const notificationId = parseInt(req.params.notificationId);
        
        if (isNaN(notificationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID'
            });
        }
        
        const success = await Database.markNotificationAsRead(notificationId);
        
        if (success) {
            res.json({
                success: true,
                message: 'Notification marked as read'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to mark notification as read'
            });
        }
        
    } catch (error) {
        console.error('❌ Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Mark all notifications as read
app.put('/api/notifications/:userId/read-all', async (req, res) => {
    console.log('✅ Marking all notifications as read for user:', req.params.userId);
    try {
        const userId = parseInt(req.params.userId);
        
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        
        const count = await Database.markAllNotificationsAsRead(userId);
        
        res.json({
            success: true,
            message: `Marked ${count} notifications as read`,
            data: { count }
        });
        
    } catch (error) {
        console.error('❌ Mark all as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Delete notification
app.delete('/api/notifications/:notificationId', async (req, res) => {
    console.log('🗑️ Deleting notification:', req.params.notificationId);
    try {
        const notificationId = parseInt(req.params.notificationId);
        
        if (isNaN(notificationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID'
            });
        }
        
        const success = await Database.deleteNotification(notificationId);
        
        if (success) {
            res.json({
                success: true,
                message: 'Notification deleted'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete notification'
            });
        }
        
    } catch (error) {
        console.error('❌ Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Create notification (for testing or manual creation)
app.post('/api/notifications', async (req, res) => {
    console.log('📬 Creating notification');
    try {
        const { userId, type, title, message, itemId, relatedUserId } = req.body;
        
        if (!userId || !type || !title || !message) {
            return res.status(400).json({
                success: false,
                message: 'User ID, type, title, and message are required'
            });
        }
        
        const Notification = require('./classes/Notification');
        const notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        if (itemId) notification.setItemId(itemId);
        if (relatedUserId) notification.setRelatedUserId(relatedUserId);
        
        await Database.addNotification(notification);
        
        res.status(201).json({
            success: true,
            message: 'Notification created',
            data: notification.toJSON()
        });
        
    } catch (error) {
        console.error('❌ Create notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// ==================== ITEM ARRIVAL NOTIFICATION SYSTEM ====================

// Track processed receipts to avoid duplicate notifications
const processedReceipts = new Set();

// Check for receipts that need arrival notifications
async function checkForArrivedItems() {
    try {
        const now = new Date();
        const thirtySecondsAgo = new Date(Date.now() - 30000);
        
        const [receipts] = await Database.pool.execute(
            `SELECT r.receipt_id, r.item_id, r.renter_id, r.owner_id, 
                    r.rental_start_date, r.rental_price, r.created_at,
                    i.item_name,
                    renter.user_name as renter_name,
                    owner.user_name as owner_name,
                    TIMESTAMPDIFF(SECOND, r.rental_start_date, NOW()) as seconds_since_start
             FROM receipts r
             JOIN items i ON r.item_id = i.item_id
             JOIN users renter ON r.renter_id = renter.user_id
             JOIN users owner ON r.owner_id = owner.user_id
             WHERE r.status = 'active'
             AND r.rental_start_date <= NOW()
             AND TIMESTAMPDIFF(SECOND, r.rental_start_date, NOW()) >= 30
             AND TIMESTAMPDIFF(SECOND, r.rental_start_date, NOW()) <= 300`,
            []
        );
        
        console.log(`📦 Found ${receipts.length} receipts to check`);
        
        // Log each receipt with timing details
        receipts.forEach(receipt => {
            const rentalStart = new Date(receipt.rental_start_date);
            const secondsSinceStart = receipt.seconds_since_start;
        });
        
        for (const receipt of receipts) {
            const receiptKey = `${receipt.receipt_id}_arrived`;
            
            // Skip if we've already processed this receipt
            if (processedReceipts.has(receiptKey)) {
                continue;
            }
            
            // Check if arrival notifications already exist for this receipt
            const [existingNotifs] = await Database.pool.execute(
                `SELECT notification_id FROM notifications 
                 WHERE type = 'item_arrived' 
                 AND item_id = ? 
                 AND user_id IN (?, ?)
                 AND created_at > DATE_SUB(NOW(), INTERVAL 2 MINUTE)`,
                [receipt.item_id, receipt.renter_id, receipt.owner_id]
            );
            
            if (existingNotifs.length >= 2) {
                // Both notifications already exist
                processedReceipts.add(receiptKey);
                continue;
            }
            
            console.log(`✅ Creating arrival notifications for receipt ${receipt.receipt_id}`);
            
            const Notification = require('./classes/Notification');
            
            // Create notification for renter
            const renterNotification = new Notification();
            renterNotification.setUserId(receipt.renter_id);
            renterNotification.setType('item_arrived');
            renterNotification.setTitle('Item Has Arrived! 🎉');
            renterNotification.setMessage(
                `Good news! "${receipt.item_name}" has arrived and is ready for you to use. Enjoy your rental!`
            );
            renterNotification.setItemId(receipt.item_id);
            renterNotification.setRelatedUserId(receipt.owner_id);
            
            await Database.addNotification(renterNotification);
            
            // Create notification for owner
            const ownerNotification = new Notification();
            ownerNotification.setUserId(receipt.owner_id);
            ownerNotification.setType('item_arrived');
            ownerNotification.setTitle('Item Delivered! 📦');
            ownerNotification.setMessage(
                `Your item "${receipt.item_name}" has been delivered to ${receipt.renter_name}. The rental is now active.`
            );
            ownerNotification.setItemId(receipt.item_id);
            ownerNotification.setRelatedUserId(receipt.renter_id);
            
            await Database.addNotification(ownerNotification);
            
            console.log(`📬 Arrival notifications sent for receipt ${receipt.receipt_id}`);
            
            // Mark as processed
            processedReceipts.add(receiptKey);
        }
        
    } catch (error) {
        console.error('❌ Error checking for arrived items:', error);
    }
}

// Start the arrival notification checker
function startArrivalNotificationSystem() {
    console.log('🚀 Starting item arrival notification system...');
    
    // Check every 10 seconds
    setInterval(checkForArrivedItems, 30000);
    
    // Run once immediately
    checkForArrivedItems();
    
    console.log('✅ Arrival notification system started (checking every 10 seconds)');
}

// Clean up old processed receipts from memory (run once per hour)
setInterval(() => {
    console.log('🧹 Cleaning up processed receipts cache...');
    processedReceipts.clear();
}, 3600000);

app.get('/api/notifications/debug/receipts', async (req, res) => {
    try {
        console.log('🔍 DEBUG: Checking all active receipts...');
        const now = new Date();
        const thirtySecondsAgo = new Date(Date.now() - 30000);
        
        // Get ALL active receipts (no time filter)
        const [allReceipts] = await Database.pool.execute(
            `SELECT r.receipt_id, r.item_id, r.renter_id, r.owner_id, 
                    r.rental_start_date, r.created_at, r.status,
                    i.item_name,
                    renter.user_name as renter_name,
                    owner.user_name as owner_name,
                    NOW() as current_db_time,
                    TIMESTAMPDIFF(SECOND, r.rental_start_date, NOW()) as seconds_since_start
             FROM receipts r
             JOIN items i ON r.item_id = i.item_id
             JOIN users renter ON r.renter_id = renter.user_id
             JOIN users owner ON r.owner_id = owner.user_id
             WHERE r.status = 'active'
             ORDER BY r.created_at DESC`
        );
        
        console.log(`Found ${allReceipts.length} active receipts total`);
        
        const receiptDetails = allReceipts.map(receipt => {
            const rentalStart = new Date(receipt.rental_start_date);
            const created = new Date(receipt.created_at);
            const dbTime = new Date(receipt.current_db_time);
            const secondsSinceStart = receipt.seconds_since_start;
            const shouldTrigger = secondsSinceStart >= 30 && secondsSinceStart <= 300;
            
            console.log(`Receipt #${receipt.receipt_id}:`);
            
            return {
                receiptId: receipt.receipt_id,
                itemName: receipt.item_name,
                renter: receipt.renter_name,
                owner: receipt.owner_name,
                rentalStartDate: receipt.rental_start_date,
                rentalStartISO: rentalStart.toISOString(),
                createdAt: receipt.created_at,
                createdISO: created.toISOString(),
                dbCurrentTime: receipt.current_db_time,
                currentTime: now.toISOString(),
                thirtySecondsAgo: thirtySecondsAgo.toISOString(),
                secondsSinceStart: secondsSinceStart,
                shouldTriggerArrival: shouldTrigger,
                eligible: shouldTrigger
            };
        });
        
        console.log('Receipt details:', receiptDetails);
        
        res.json({
            success: true,
            currentTime: now.toISOString(),
            thirtySecondsAgo: thirtySecondsAgo.toISOString(),
            totalActiveReceipts: allReceipts.length,
            eligibleForArrival: receiptDetails.filter(r => r.eligible).length,
            receipts: receiptDetails
        });
        
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        environment: process.env.NODE_ENV,
        stripeMode: PaymentService.isTestMode() ? 'TEST' : 'LIVE'
    });
});

// ==================== PAYMENT ROUTES ====================

// Create payment intent for checkout
app.post('/api/payments/create', async (req, res) => {
    console.log('💳 Creating payment intent...');
    try {
        const { receiptId, userId, amount, currency } = req.body;

        // Validation
        if (!receiptId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Receipt ID and amount are required'
            });
        }

        // Create payment intent
        const payment = await PaymentService.createRentalPayment(
            receiptId,
            userId,
            amount,
            currency || 'PHP'
        );

        console.log('✅ Payment intent created:', payment.paymentIntentId);
        res.json({
            success: true,
            data: payment
        });

    } catch (error) {
        console.error('❌ Payment creation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create payment'
        });
    }
});

// Confirm payment (can be called manually or by webhook)
app.post('/api/payments/confirm', async (req, res) => {
    console.log('✅ Confirming payment...');
    try {
        const { paymentIntentId } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({
                success: false,
                message: 'Payment intent ID is required'
            });
        }

        const receiptId = await PaymentService.confirmRentalPayment(paymentIntentId);

        res.json({
            success: true,
            data: { receiptId }
        });

    } catch (error) {
        console.error('❌ Payment confirmation error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Process refund
app.post('/api/payments/refund', async (req, res) => {
    console.log('💸 Processing refund...');
    try {
        const { receiptId, reason, amount } = req.body;

        if (!receiptId) {
            return res.status(400).json({
                success: false,
                message: 'Receipt ID is required'
            });
        }

        const refund = await PaymentService.processRefund(
            receiptId,
            reason || 'item_recall',
            amount || null
        );

        res.json({
            success: true,
            data: refund
        });

    } catch (error) {
        console.error('❌ Refund error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Stripe webhook endpoint
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        // In test mode, we can skip signature verification
        if (PaymentService.isTestMode()) {
            console.log('📨 Webhook (test mode):', req.body);
            // Process the event
            await PaymentService.handleWebhook(req.body);
        } else {
            // In production, verify the webhook signature
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
            const event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
            await PaymentService.handleWebhook(event);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});


// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💳 Stripe Mode: ${PaymentService.isTestMode() ? 'TEST' : 'LIVE'}`);
    console.log('='.repeat(50));
});

// ==================== INITIALIZE ARRIVAL SYSTEM ====================

// Start the arrival notification system
startArrivalNotificationSystem();

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