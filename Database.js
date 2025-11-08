// Database.js (Backend version)

const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', // Update with your MySQL password
    database: 'e_mart',
    port: 3306
};

class Database {
    static pool = null;

    // Initialize the connection pool
    static async initialize() {
        if (!this.pool) {
            this.pool = mysql.createPool(dbConfig);
            console.log('Database connection pool created');
        }
        return this.pool;
    }

    // ==================== USER METHODS ====================
    
    static async addUser(user) {
        try {
            await this.initialize();
            const [result] = await this.pool.execute(
                'INSERT INTO users (user_name, user_email, user_password) VALUES (?, ?, ?)',
                [user.getUserName(), user.getUserEmail(), user.getUserPassword()]
            );
            user.setUserId(result.insertId);
            console.log(`User added: ${user.getUserName()}`);
            return user;
        } catch (error) {
            console.error('Error adding user:', error.message);
            throw error;
        }
    }

    static async getUserById(userId) {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                'SELECT * FROM users WHERE user_id = ?',
                [userId]
            );
            
            if (rows.length > 0) {
                const User = require('./User');  // FIXED: Changed from './public/scripts/User'
                return new User(
                    rows[0].user_id, 
                    rows[0].user_name, 
                    rows[0].user_password, 
                    rows[0].user_email
                );
            }
            return null;
        } catch (error) {
            console.error('Error getting user:', error.message);
            throw error;
        }
    }

    static async getUserByUsername(userName) {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                'SELECT * FROM users WHERE user_name = ?',
                [userName]
            );
            
            if (rows.length > 0) {
                const User = require('./User');  // FIXED: Changed from './public/scripts/User'
                return new User(
                    rows[0].user_id, 
                    rows[0].user_name, 
                    rows[0].user_password, 
                    rows[0].user_email
                );
            }
            return null;
        } catch (error) {
            console.error('Error getting user by username:', error.message);
            throw error;
        }
    }

    static async getUserByEmail(email) {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                'SELECT * FROM users WHERE user_email = ?',
                [email]
            );
            
            if (rows.length > 0) {
                const User = require('./User');  // FIXED: Changed from './public/scripts/User'
                return new User(
                    rows[0].user_id, 
                    rows[0].user_name, 
                    rows[0].user_password, 
                    rows[0].user_email
                );
            }
            return null;
        } catch (error) {
            console.error('Error getting user by email:', error.message);
            throw error;
        }
    }

    static async updateUser(user) {
        try {
            await this.initialize();
            await this.pool.execute(
                'UPDATE users SET user_name = ?, user_email = ?, user_password = ? WHERE user_id = ?',
                [user.getUserName(), user.getUserEmail(), user.getUserPassword(), user.getUserId()]
            );
            console.log(`User updated: ${user.getUserName()}`);
        } catch (error) {
            console.error('Error updating user:', error.message);
            throw error;
        }
    }

    static async deleteUser(userId) {
        try {
            await this.initialize();
            await this.pool.execute('DELETE FROM users WHERE user_id = ?', [userId]);
            console.log('User deleted');
        } catch (error) {
            console.error('Error deleting user:', error.message);
            throw error;
        }
    }

    // ==================== ITEM METHODS ====================
    
    static async addItem(item) {
        try {
            await this.initialize();
            const [result] = await this.pool.execute(
                'INSERT INTO items (item_name, owner_id, renter_id, is_renting, is_rented) VALUES (?, ?, ?, ?, ?)',
                [item.getItemName(), item.getOwnerId(), item.getRenterId(), item.isRenting, item.isRented]
            );
            item.setItemId(result.insertId);
            console.log(`Item added: ${item.getItemName()}`);
            return item;
        } catch (error) {
            console.error('Error adding item:', error.message);
            throw error;
        }
    }

    static async getItemById(itemId) {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                'SELECT * FROM items WHERE item_id = ?',
                [itemId]
            );
            
            if (rows.length > 0) {
                const Item = require('./Item');  // FIXED: Changed from './public/scripts/Item'
                const item = new Item(
                    rows[0].item_id,
                    rows[0].item_name,
                    rows[0].owner_id,
                    rows[0].renter_id
                );
                item.isRenting = rows[0].is_renting;
                item.isRented = rows[0].is_rented;
                return item;
            }
            return null;
        } catch (error) {
            console.error('Error getting item:', error.message);
            throw error;
        }
    }

    static async getAllItems() {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute('SELECT * FROM items');
            const Item = require('./Item');  // FIXED: Changed from './public/scripts/Item'
            return rows.map(row => {
                const item = new Item(row.item_id, row.item_name, row.owner_id, row.renter_id);
                item.isRenting = row.is_renting;
                item.isRented = row.is_rented;
                return item;
            });
        } catch (error) {
            console.error('Error getting all items:', error.message);
            throw error;
        }
    }

    static async getAvailableItems() {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                'SELECT * FROM items WHERE is_renting = TRUE AND is_rented = FALSE'
            );
            const Item = require('./Item');  // FIXED: Changed from './public/scripts/Item'
            return rows.map(row => {
                const item = new Item(row.item_id, row.item_name, row.owner_id, row.renter_id);
                item.isRenting = row.is_renting;
                item.isRented = row.is_rented;
                return item;
            });
        } catch (error) {
            console.error('Error getting available items:', error.message);
            throw error;
        }
    }

    static async getItemsByOwner(ownerId) {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                'SELECT * FROM items WHERE owner_id = ?',
                [ownerId]
            );
            const Item = require('./Item');  // FIXED: Changed from './public/scripts/Item'
            return rows.map(row => {
                const item = new Item(row.item_id, row.item_name, row.owner_id, row.renter_id);
                item.isRenting = row.is_renting;
                item.isRented = row.is_rented;
                return item;
            });
        } catch (error) {
            console.error('Error getting items by owner:', error.message);
            throw error;
        }
    }

    static async getItemsByRenter(renterId) {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                'SELECT * FROM items WHERE renter_id = ?',
                [renterId]
            );
            const Item = require('./Item');  // FIXED: Changed from './public/scripts/Item'
            return rows.map(row => {
                const item = new Item(row.item_id, row.item_name, row.owner_id, row.renter_id);
                item.isRenting = row.is_renting;
                item.isRented = row.is_rented;
                return item;
            });
        } catch (error) {
            console.error('Error getting items by renter:', error.message);
            throw error;
        }
    }

    static async updateItem(item) {
        try {
            await this.initialize();
            await this.pool.execute(
                'UPDATE items SET item_name = ?, owner_id = ?, renter_id = ?, is_renting = ?, is_rented = ? WHERE item_id = ?',
                [item.getItemName(), item.getOwnerId(), item.getRenterId(), item.isRenting, item.isRented, item.getItemId()]
            );
            console.log(`Item updated: ${item.getItemName()}`);
        } catch (error) {
            console.error('Error updating item:', error.message);
            throw error;
        }
    }

    static async deleteItem(itemId) {
        try {
            await this.initialize();
            await this.pool.execute('DELETE FROM items WHERE item_id = ?', [itemId]);
            console.log('Item deleted');
        } catch (error) {
            console.error('Error deleting item:', error.message);
            throw error;
        }
    }

    // ==================== RECEIPT METHODS ====================
    
    static async getReceiptsByOwner(ownerId) {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                'SELECT * FROM receipts WHERE owner_id = ? ORDER BY created_at DESC',
                [ownerId]
            );
            
            const Receipt = require('./Receipt');  // FIXED: Changed from './public/scripts/Receipt'
            return rows.map(row => {
                const receipt = new Receipt();
                receipt.receiptId = row.receipt_id;
                receipt.itemId = row.item_id;
                receipt.ownerId = row.owner_id;
                receipt.renterId = row.renter_id;
                receipt.rentalStartDate = row.rental_start_date;
                receipt.rentalEndDate = row.rental_end_date;
                receipt.rentalPrice = row.rental_price;
                receipt.status = row.status;
                receipt.createdAt = row.created_at;
                return receipt;
            });
        } catch (error) {
            console.error('Error getting receipts by owner:', error.message);
            return []; // Return empty array if Receipt class doesn't exist yet
        }
    }

    static async getReceiptsByRenter(renterId) {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                'SELECT * FROM receipts WHERE renter_id = ? ORDER BY created_at DESC',
                [renterId]
            );
            
            const Receipt = require('./Receipt');  // FIXED: Changed from './public/scripts/Receipt'
            return rows.map(row => {
                const receipt = new Receipt();
                receipt.receiptId = row.receipt_id;
                receipt.itemId = row.item_id;
                receipt.ownerId = row.owner_id;
                receipt.renterId = row.renter_id;
                receipt.rentalStartDate = row.rental_start_date;
                receipt.rentalEndDate = row.rental_end_date;
                receipt.rentalPrice = row.rental_price;
                receipt.status = row.status;
                receipt.createdAt = row.created_at;
                return receipt;
            });
        } catch (error) {
            console.error('Error getting receipts by renter:', error.message);
            return []; // Return empty array if Receipt class doesn't exist yet
        }
    }

    // Close all connections
    static async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('Database connection pool closed');
        }
    }
}

module.exports = Database;