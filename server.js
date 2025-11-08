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

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public')); // Serve static files (HTML, CSS, JS, images)

// Initialize database connection on server start
Database.initialize()
    .then(() => {
        console.log('Database initialized successfully');
    })
    .catch(err => {
        console.error('Database initialization failed:', err);
        process.exit(1);
    });

// ==================== HTML ROUTES ====================

// Serve login page as default
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve signup page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Serve dashboard page
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// ==================== USER API ROUTES ====================

// Register new user
app.post('/api/users/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username, email, and password are required' 
            });
        }

        if (username.length < 3) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username must be at least 3 characters' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters' 
            });
        }

        // Check if email already exists
        const existingUser = await Database.getUserByEmail(email);
        
        if (existingUser) {
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
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Login user
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Get user from database using Database class
        const user = await Database.getUserByEmail(email);

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.getUserPassword());

        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Load user data (items and receipts)
        await user.loadUserData();

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
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await Database.getUserById(userId);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({
            success: true,
            data: {
                userId: user.getUserId(),
                username: user.getUserName(),
                email: user.getUserEmail()
            }
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Update user profile
app.put('/api/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { username, email, password } = req.body;

        const user = await Database.getUserById(userId);

        if (!user) {
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
        console.error('Update user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// ==================== ITEM ROUTES ====================

// Get all available items
app.get('/api/items/available', async (req, res) => {
    try {
        const items = await Database.getAvailableItems();

        res.json({
            success: true,
            data: items.map(item => ({
                itemId: item.getItemId(),
                itemName: item.getItemName(),
                ownerId: item.getOwnerId(),
                isRenting: item.isRenting,
                isRented: item.isRented
            }))
        });

    } catch (error) {
        console.error('Get items error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get items by owner
app.get('/api/items/owner/:ownerId', async (req, res) => {
    try {
        const ownerId = req.params.ownerId;
        const items = await Database.getItemsByOwner(ownerId);

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
        console.error('Get owner items error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get items by renter
app.get('/api/items/renter/:renterId', async (req, res) => {
    try {
        const renterId = req.params.renterId;
        const items = await Database.getItemsByRenter(renterId);

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
        console.error('Get renter items error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);

});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await Database.close();
    process.exit();
});

process.on('SIGTERM', async () => {
    console.log('\nShutting down gracefully...');
    await Database.close();
    process.exit();
});