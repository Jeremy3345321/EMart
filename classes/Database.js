// Database.js (Backend version)

const mysql = require('mysql2/promise');

class Database {
    static pool = null;

    static async initialize() {
        if (this.pool) return;

        try {
            this.pool = mysql.createPool({
                host: process.env.DB_HOST || '127.0.0.1',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'e_mart',
                port: process.env.DB_PORT || 3306,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });

            // Test connection
            await this.pool.query('SELECT 1');
            console.log('✅ Database connected successfully');
            console.log(`   Host: ${process.env.DB_HOST || '127.0.0.1'}`);
            console.log(`   Database: ${process.env.DB_NAME || 'e_mart'}`);
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            throw error;
        }
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
            console.log(`✅ User added: ${user.getUserName()} (ID: ${result.insertId})`);
            return user;
        } catch (error) {
            console.error('❌ Error adding user:', error.message);
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
                const User = require('./User');  
                console.log(`✅ User found: ${rows[0].user_name}`);
                return new User(
                    rows[0].user_id, 
                    rows[0].user_name, 
                    rows[0].user_password, 
                    rows[0].user_email
                );
            }
            console.log(`⚠️ User not found with ID: ${userId}`);
            return null;
        } catch (error) {
            console.error('❌ Error getting user:', error.message);
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
                const User = require('./User');  
                console.log(`✅ User found: ${rows[0].user_name}`);
                return new User(
                    rows[0].user_id, 
                    rows[0].user_name, 
                    rows[0].user_password, 
                    rows[0].user_email
                );
            }
            console.log(`⚠️ User not found with username: ${userName}`);
            return null;
        } catch (error) {
            console.error('❌ Error getting user by username:', error.message);
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
                const User = require('./User');  
                console.log(`✅ User found: ${rows[0].user_name}`);
                return new User(
                    rows[0].user_id, 
                    rows[0].user_name, 
                    rows[0].user_password, 
                    rows[0].user_email
                );
            }
            console.log(`⚠️ User not found with email: ${email}`);
            return null;
        } catch (error) {
            console.error('❌ Error getting user by email:', error.message);
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
            console.log(`✅ User updated: ${user.getUserName()}`);
        } catch (error) {
            console.error('❌ Error updating user:', error.message);
            throw error;
        }
    }

    static async deleteUser(userId) {
        try {
            await this.initialize();
            await this.pool.execute('DELETE FROM users WHERE user_id = ?', [userId]);
            console.log(`✅ User deleted (ID: ${userId})`);
        } catch (error) {
            console.error('❌ Error deleting user:', error.message);
            throw error;
        }
    }

    // ==================== ITEM METHODS ====================
    
    static async addItem(item) {
        try {
            await this.initialize();
            const [result] = await this.pool.execute(
                `INSERT INTO items (
                    item_name, owner_id, renter_id, is_renting, is_rented, 
                    item_description, item_price, item_condition, item_tags, item_image_url,
                    item_rating, rating_count, total_rating_points
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    item.getItemName(),
                    item.getOwnerId(),
                    item.getRenterId(),
                    item.isRenting,
                    item.isRented,
                    item.getDescription(),
                    item.getPrice(),
                    item.getCondition(),
                    JSON.stringify(item.getTags()),
                    item.getImageUrl(),
                    item.itemRating,
                    item.ratingCount,
                    item.totalRatingPoints
                ]
            );
            item.setItemId(result.insertId);
            console.log(`✅ Item added: ${item.getItemName()} (ID: ${result.insertId})`);
            return item;
        } catch (error) {
            console.error('❌ Error adding item:', error.message);
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
                const Item = require('./Item');
                const item = new Item(
                    rows[0].item_id,
                    rows[0].item_name,
                    rows[0].owner_id,
                    rows[0].renter_id,
                    rows[0].item_image_url
                );
                item.isRenting = rows[0].is_renting;
                item.isRented = rows[0].is_rented;
                item.setDescription(rows[0].item_description || '');
                item.setPrice(rows[0].item_price || 0);
                item.setCondition(rows[0].item_condition || 'Like New');
                
                // Set rating fields
                item.itemRating = rows[0].item_rating;
                item.ratingCount = rows[0].rating_count || 0;
                item.totalRatingPoints = rows[0].total_rating_points || 0;
                
                if (rows[0].item_tags) {
                    const tags = JSON.parse(rows[0].item_tags);
                    tags.forEach(tag => item.addTag(tag));
                }
                
                console.log(`✅ Item found: ${item.getItemName()}`);
                return item;
            }
            console.log(`⚠️ Item not found with ID: ${itemId}`);
            return null;
        } catch (error) {
            console.error('❌ Error getting item:', error.message);
            throw error;
        }
    }


    // NEW: Get all available items (not rented)
    static async getAvailableItems() {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                'SELECT * FROM items WHERE is_renting = TRUE AND is_rented = FALSE'
            );
            
            console.log(`📦 Found ${rows.length} available items`);
            const Item = require('./Item');
            return rows.map(row => {
                const item = new Item(
                    row.item_id,
                    row.item_name,
                    row.owner_id,
                    row.renter_id,
                    row.item_image_url
                );
                item.isRenting = row.is_renting;
                item.isRented = row.is_rented;
                item.setDescription(row.item_description || '');
                item.setPrice(row.item_price || 0);
                item.setCondition(row.item_condition || 'Like New');
                
                if (row.item_tags) {
                    const tags = JSON.parse(row.item_tags);
                    tags.forEach(tag => item.addTag(tag));
                }
                
                return item;
            });
        } catch (error) {
            console.error('❌ Error getting available items:', error.message);
            throw error;
        }
    }

    // Get items by owner
    static async getItemsByOwner(ownerId) {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                'SELECT * FROM items WHERE owner_id = ?',
                [ownerId]
            );
            
            console.log(`📦 Found ${rows.length} items for owner ID: ${ownerId}`);
            const Item = require('./Item');
            return rows.map(row => {
                const item = new Item(
                    row.item_id,
                    row.item_name,
                    row.owner_id,
                    row.renter_id,
                    row.item_image_url
                );
                item.isRenting = row.is_renting;
                item.isRented = row.is_rented;
                item.setDescription(row.item_description || '');
                item.setPrice(row.item_price || 0);
                item.setCondition(row.item_condition || 'Like New');
                
                if (row.item_tags) {
                    const tags = JSON.parse(row.item_tags);
                    tags.forEach(tag => item.addTag(tag));
                }
                
                return item;
            });
        } catch (error) {
            console.error('❌ Error getting items by owner:', error.message);
            throw error;
        }
    }

    // Get items by renter
    static async getItemsByRenter(renterId) {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                'SELECT * FROM items WHERE renter_id = ? AND is_rented = TRUE',
                [renterId]
            );
            
            console.log(`📦 Found ${rows.length} items for renter ID: ${renterId}`);
            const Item = require('./Item');
            return rows.map(row => {
                const item = new Item(
                    row.item_id,
                    row.item_name,
                    row.owner_id,
                    row.renter_id,
                    row.item_image_url
                );
                item.isRenting = row.is_renting;
                item.isRented = row.is_rented;
                item.setDescription(row.item_description || '');
                item.setPrice(row.item_price || 0);
                item.setCondition(row.item_condition || 'Like New');
                
                if (row.item_tags) {
                    const tags = JSON.parse(row.item_tags);
                    tags.forEach(tag => item.addTag(tag));
                }
                
                return item;
            });
        } catch (error) {
            console.error('❌ Error getting items by renter:', error.message);
            throw error;
        }
    }

    // Get items by single tag/category
    static async getItemsByTag(tag) {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                'SELECT * FROM items WHERE JSON_CONTAINS(item_tags, ?) AND is_renting = TRUE AND is_rented = FALSE',
                [JSON.stringify(tag)]
            );
            
            console.log(`🏷️ Found ${rows.length} items with tag: ${tag}`);
            const Item = require('./Item');
            return rows.map(row => {
                const item = new Item(
                    row.item_id,
                    row.item_name,
                    row.owner_id,
                    row.renter_id,
                    row.item_image_url
                );
                item.isRenting = row.is_renting;
                item.isRented = row.is_rented;
                item.setDescription(row.item_description || '');
                item.setPrice(row.item_price || 0);
                item.setCondition(row.item_condition || 'Like New');
                
                if (row.item_tags) {
                    const tags = JSON.parse(row.item_tags);
                    tags.forEach(tag => item.addTag(tag));
                }
                
                return item;
            });
        } catch (error) {
            console.error('❌ Error getting items by tag:', error.message);
            throw error;
        }
    }

    // Get items by multiple tags
    static async getItemsByTags(tags) {
        try {
            await this.initialize();
            
            const conditions = tags.map(() => 'JSON_CONTAINS(item_tags, ?)').join(' OR ');
            const query = `SELECT * FROM items WHERE (${conditions}) AND is_renting = TRUE AND is_rented = FALSE`;
            const params = tags.map(tag => JSON.stringify(tag));
            
            const [rows] = await this.pool.execute(query, params);
            
            console.log(`🏷️ Found ${rows.length} items with tags: ${tags.join(', ')}`);
            const Item = require('./Item');
            return rows.map(row => {
                const item = new Item(
                    row.item_id,
                    row.item_name,
                    row.owner_id,
                    row.renter_id,
                    row.item_image_url
                );
                item.isRenting = row.is_renting;
                item.isRented = row.is_rented;
                item.setDescription(row.item_description || '');
                item.setPrice(row.item_price || 0);
                item.setCondition(row.item_condition || 'Like New');
                
                if (row.item_tags) {
                    const tags = JSON.parse(row.item_tags);
                    tags.forEach(tag => item.addTag(tag));
                }
                
                return item;
            });
        } catch (error) {
            console.error('❌ Error getting items by tags:', error.message);
            throw error;
        }
    }

    static async updateItem(item) {
        try {
            await this.initialize();
            await this.pool.execute(
                `UPDATE items SET 
                    item_name = ?, 
                    owner_id = ?, 
                    renter_id = ?, 
                    is_renting = ?, 
                    is_rented = ?,
                    item_image_url = ?,
                    item_description = ?,
                    item_price = ?,
                    item_condition = ?,
                    item_tags = ?,
                    item_rating = ?,
                    rating_count = ?,
                    total_rating_points = ?
                WHERE item_id = ?`,
                [
                    item.getItemName(),
                    item.getOwnerId(),
                    item.getRenterId(),
                    item.isRenting,
                    item.isRented,
                    item.getImageUrl(),
                    item.getDescription(),
                    item.getPrice(),
                    item.getCondition(),
                    JSON.stringify(item.getTags()),
                    item.itemRating,
                    item.ratingCount,
                    item.totalRatingPoints,
                    item.getItemId()
                ]
            );
            console.log(`✅ Item updated: ${item.getItemName()}`);
        } catch (error) {
            console.error('❌ Error updating item:', error.message);
            throw error;
        }
    }

    // ==================== RATING METHODS ====================

    // Add rating to an item
    static async addItemRating(itemId, renterId, rating) {
        try {
            await this.initialize();
            
            // Validate rating
            if (rating < 0 || rating > 5) {
                throw new Error('Rating must be between 0 and 5');
            }
            
            // Check if item exists
            const item = await this.getItemById(itemId);
            if (!item) {
                throw new Error('Item not found');
            }
            
            // Check if user has rented this item (completed rental)
            const [receipts] = await this.pool.execute(
                `SELECT r.* FROM receipts r 
                JOIN items i ON r.item_id = i.item_id 
                WHERE r.item_id = ? 
                AND r.renter_id = ? 
                AND r.status = 'completed'
                AND i.is_rented = TRUE`,
                [itemId, renterId]
            );
            
            if (receipts.length === 0) {
                throw new Error('You can only rate items you have rented and received');
            }
            
            // Check if user already rated this item
            const [existingRatings] = await this.pool.execute(
                'SELECT * FROM item_ratings WHERE item_id = ? AND renter_id = ?',
                [itemId, renterId]
            );
            
            if (existingRatings.length > 0) {
                // Update existing rating
                const oldRating = existingRatings[0].rating;
                await this.pool.execute(
                    'UPDATE item_ratings SET rating = ?, rated_at = CURRENT_TIMESTAMP WHERE item_id = ? AND renter_id = ?',
                    [rating, itemId, renterId]
                );
                
                // Update item's rating statistics
                const newTotalPoints = item.totalRatingPoints - oldRating + rating;
                const newAvgRating = (newTotalPoints / item.ratingCount).toFixed(1);
                
                await this.pool.execute(
                    'UPDATE items SET item_rating = ?, total_rating_points = ? WHERE item_id = ?',
                    [newAvgRating, newTotalPoints, itemId]
                );
                
                console.log(`✅ Rating updated for item ${itemId}: ${oldRating} -> ${rating}`);
            } else {
                // Add new rating
                await this.pool.execute(
                    'INSERT INTO item_ratings (item_id, renter_id, rating) VALUES (?, ?, ?)',
                    [itemId, renterId, rating]
                );
                
                // Update item's rating statistics
                const newTotalPoints = item.totalRatingPoints + rating;
                const newCount = item.ratingCount + 1;
                const newAvgRating = (newTotalPoints / newCount).toFixed(1);
                
                await this.pool.execute(
                    'UPDATE items SET item_rating = ?, rating_count = ?, total_rating_points = ? WHERE item_id = ?',
                    [newAvgRating, newCount, newTotalPoints, itemId]
                );
                
                console.log(`✅ New rating added for item ${itemId}: ${rating} (Avg: ${newAvgRating})`);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error adding rating:', error.message);
            throw error;
        }
    }

    // Get user's rating for an item
    static async getUserRatingForItem(itemId, renterId) {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                'SELECT * FROM item_ratings WHERE item_id = ? AND renter_id = ?',
                [itemId, renterId]
            );
            
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('❌ Error getting user rating:', error.message);
            return null;
        }
    }

    // Check if user can rate an item (has rented and received it)
    static async canUserRateItem(itemId, renterId) {
        try {
            await this.initialize();
            const [receipts] = await this.pool.execute(
                `SELECT r.* FROM receipts r 
                JOIN items i ON r.item_id = i.item_id 
                WHERE r.item_id = ? 
                AND r.renter_id = ? 
                AND r.status = 'completed'
                AND i.is_rented = TRUE`,
                [itemId, renterId]
            );
            
            return receipts.length > 0;
        } catch (error) {
            console.error('❌ Error checking rating permission:', error.message);
            return false;
        }
    }

    // Update item to mark as arrived (sets is_rented to true)
    static async markItemAsArrived(itemId) {
        try {
            await this.initialize();
            await this.pool.execute(
                'UPDATE items SET is_rented = TRUE WHERE item_id = ?',
                [itemId]
            );
            console.log(`✅ Item ${itemId} marked as arrived (is_rented = TRUE)`);
            return true;
        } catch (error) {
            console.error('❌ Error marking item as arrived:', error.message);
            throw error;
        }
    }

    // ==================== RECEIPT METHODS ====================

    static async addReceipt(receipt) {
        try {
            await this.initialize();
            
            const insertTime = new Date();
            console.log('   💾 Inserting receipt into database...');
            console.log(`      Insert time: ${insertTime.toISOString()}`);
            
            const [result] = await this.pool.execute(
                `INSERT INTO receipts (
                    item_id, owner_id, renter_id, rental_start_date, 
                    rental_end_date, rental_price, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    receipt.itemId,
                    receipt.ownerId,
                    receipt.renterId,
                    receipt.rentalStartDate,
                    receipt.rentalEndDate,
                    receipt.rentalPrice,
                    receipt.status || 'active'
                ]
            );
            
            receipt.receiptId = result.insertId;
            
            const completedTime = new Date();
            const dbTime = (completedTime - insertTime) / 1000;
            
            console.log(`   ✅ Receipt inserted into database`);
            console.log(`      Receipt ID: ${result.insertId}`);
            console.log(`      DB insert time: ${dbTime.toFixed(3)} seconds`);
            console.log(`      Completed at: ${completedTime.toISOString()}`);
            
            return receipt;
        } catch (error) {
            console.error('   ❌ Error adding receipt:', error.message);
            throw error;
        }
    }
    static async getReceiptById(receiptId) {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                'SELECT * FROM receipts WHERE receipt_id = ?',
                [receiptId]
            );
            
            if (rows.length > 0) {
                const Receipt = require('./Receipt');
                const receipt = new Receipt();
                receipt.receiptId = rows[0].receipt_id;
                receipt.itemId = rows[0].item_id;
                receipt.ownerId = rows[0].owner_id;
                receipt.renterId = rows[0].renter_id;
                receipt.rentalStartDate = rows[0].rental_start_date;
                receipt.rentalEndDate = rows[0].rental_end_date;
                receipt.rentalPrice = rows[0].rental_price;
                receipt.status = rows[0].status;
                receipt.createdAt = rows[0].created_at;
                
                console.log(`✅ Receipt found: ${receipt.receiptId}`);
                return receipt;
            }
            console.log(`⚠️ Receipt not found with ID: ${receiptId}`);
            return null;
        } catch (error) {
            console.error('❌ Error getting receipt:', error.message);
            throw error;
        }
    }

    static async getReceiptsByOwner(ownerId) {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                'SELECT * FROM receipts WHERE owner_id = ? ORDER BY created_at DESC',
                [ownerId]
            );
            
            console.log(`📄 Found ${rows.length} receipts for owner ID: ${ownerId}`);
            const Receipt = require('./Receipt');
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
            console.error('❌ Error getting receipts by owner:', error.message);
            return [];
        }
    }

    static async getReceiptsByRenter(renterId) {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                'SELECT * FROM receipts WHERE renter_id = ? ORDER BY created_at DESC',
                [renterId]
            );
            
            console.log(`📄 Found ${rows.length} receipts for renter ID: ${renterId}`);
            const Receipt = require('./Receipt');
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
            console.error('❌ Error getting receipts by renter:', error.message);
            return [];
        }
    }

    static async getReceiptsByItem(itemId) {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                'SELECT * FROM receipts WHERE item_id = ? ORDER BY created_at DESC',
                [itemId]
            );
            
            console.log(`📄 Found ${rows.length} receipts for item ID: ${itemId}`);
            const Receipt = require('./Receipt');
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
            console.error('❌ Error getting receipts by item:', error.message);
            return [];
        }
    }

    static async updateReceiptStatus(receiptId, status) {
        try {
            await this.initialize();
            await this.pool.execute(
                'UPDATE receipts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE receipt_id = ?',
                [status, receiptId]
            );
            console.log(`✅ Receipt status updated: ${receiptId} -> ${status}`);
        } catch (error) {
            console.error('❌ Error updating receipt status:', error.message);
            throw error;
        }
    }

    static async deleteReceipt(receiptId) {
        try {
            await this.initialize();
            await this.pool.execute('DELETE FROM receipts WHERE receipt_id = ?', [receiptId]);
            console.log(`✅ Receipt deleted (ID: ${receiptId})`);
        } catch (error) {
            console.error('❌ Error deleting receipt:', error.message);
            throw error;
        }
    }

    // Get all active rentals (receipts with status 'active')
    static async getActiveRentals() {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                "SELECT * FROM receipts WHERE status = 'active' ORDER BY created_at DESC"
            );
            
            console.log(`📄 Found ${rows.length} active rentals`);
            const Receipt = require('./Receipt');
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
            console.error('❌ Error getting active rentals:', error.message);
            return [];
        }
    }

    // Get overdue rentals (active rentals past end date)
    static async getOverdueRentals() {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                "SELECT * FROM receipts WHERE status = 'active' AND rental_end_date < NOW() ORDER BY rental_end_date ASC"
            );
            
            console.log(`⚠️ Found ${rows.length} overdue rentals`);
            const Receipt = require('./Receipt');
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
            console.error('❌ Error getting overdue rentals:', error.message);
            return [];
        }
    }

    static async getReceiptsByOwner(ownerId) {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                'SELECT * FROM receipts WHERE owner_id = ? ORDER BY created_at DESC',
                [ownerId]
            );
            
            console.log(`📄 Found ${rows.length} receipts for owner ID: ${ownerId}`);
            const Receipt = require('./Receipt'); 
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
            console.error('❌ Error getting receipts by owner:', error.message);
            return [];
        }
    }

    static async getReceiptsByRenter(renterId) {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                'SELECT * FROM receipts WHERE renter_id = ? ORDER BY created_at DESC',
                [renterId]
            );
            
            console.log(`📄 Found ${rows.length} receipts for renter ID: ${renterId}`);
            const Receipt = require('./Receipt');  
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
            console.error('❌ Error getting receipts by renter:', error.message);
            return [];
        }
    }

    // Close all connections
    static async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('🔌 Database connection pool closed');
        }
    }


    // ==================== CART METHODS ====================

    /**
     * Add item to user's cart
     * @param {number} userId - User ID
     * @param {number} itemId - Item ID
     * @param {number} quantity - Quantity (default: 1)
     * @returns {object} Cart entry
     */
    static async addToCart(userId, itemId, quantity = 1) {
        try {
            await this.initialize();
            
            // Check if item exists and is available
            const [itemRows] = await this.pool.execute(
                'SELECT * FROM items WHERE item_id = ?',
                [itemId]
            );
            
            if (itemRows.length === 0) {
                throw new Error('Item not found');
            }
            
            const item = itemRows[0];
            if (!item.is_renting || item.is_rented) {
                throw new Error('Item is not available for rent');
            }
            
            // Check if user is trying to add their own item
            if (item.owner_id === userId) {
                throw new Error('Cannot add your own item to cart');
            }
            
            // Check if item already in cart
            const [existingCart] = await this.pool.execute(
                'SELECT * FROM cart WHERE user_id = ? AND item_id = ?',
                [userId, itemId]
            );
            
            if (existingCart.length > 0) {
                // Update quantity
                const newQuantity = existingCart[0].quantity + quantity;
                await this.pool.execute(
                    'UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE cart_id = ?',
                    [newQuantity, existingCart[0].cart_id]
                );
                
                console.log(`✅ Updated cart quantity for user ${userId}, item ${itemId}: ${newQuantity}`);
                
                return {
                    cartId: existingCart[0].cart_id,
                    userId,
                    itemId,
                    quantity: newQuantity
                };
            } else {
                // Insert new cart entry
                const [result] = await this.pool.execute(
                    'INSERT INTO cart (user_id, item_id, quantity) VALUES (?, ?, ?)',
                    [userId, itemId, quantity]
                );
                
                console.log(`✅ Added to cart: User ${userId}, Item ${itemId}, Qty ${quantity}`);
                
                return {
                    cartId: result.insertId,
                    userId,
                    itemId,
                    quantity
                };
            }
        } catch (error) {
            console.error('❌ Error adding to cart:', error.message);
            throw error;
        }
    }

    /**
     * Get user's cart with full item details
     * @param {number} userId - User ID
     * @returns {array} Cart items with details
     */
    static async getCart(userId) {
        try {
            await this.initialize();
            
            const [rows] = await this.pool.execute(
                `SELECT 
                    c.cart_id,
                    c.user_id,
                    c.item_id,
                    c.quantity,
                    c.added_at,
                    c.updated_at,
                    i.item_name,
                    i.owner_id,
                    i.item_price,
                    i.item_condition,
                    i.item_description,
                    i.item_tags,
                    i.is_renting,
                    i.is_rented,
                    u.user_name as owner_name
                FROM cart c
                INNER JOIN items i ON c.item_id = i.item_id
                INNER JOIN users u ON i.owner_id = u.user_id
                WHERE c.user_id = ?
                ORDER BY c.added_at DESC`,
                [userId]
            );
            
            console.log(`🛒 Found ${rows.length} items in cart for user ${userId}`);
            
            return rows.map(row => ({
                cartId: row.cart_id,
                userId: row.user_id,
                itemId: row.item_id,
                quantity: row.quantity,
                addedAt: row.added_at,
                updatedAt: row.updated_at,
                item: {
                    itemName: row.item_name,
                    ownerId: row.owner_id,
                    ownerName: row.owner_name,
                    price: parseFloat(row.item_price),
                    condition: row.item_condition,
                    description: row.item_description,
                    imageUrl: null, // Set to null since column doesn't exist yet
                    tags: row.item_tags ? JSON.parse(row.item_tags) : [],
                    isRenting: row.is_renting,
                    isRented: row.is_rented
                }
            }));
        } catch (error) {
            console.error('❌ Error getting cart:', error.message);
            throw error;
        }
    }

    /**
     * Update cart item quantity
     * @param {number} userId - User ID
     * @param {number} itemId - Item ID
     * @param {number} quantity - New quantity
     * @returns {object} Updated cart entry
     */
    static async updateCartQuantity(userId, itemId, quantity) {
        try {
            await this.initialize();
            
            if (quantity < 1) {
                throw new Error('Quantity must be at least 1');
            }
            
            const [result] = await this.pool.execute(
                'UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND item_id = ?',
                [quantity, userId, itemId]
            );
            
            if (result.affectedRows === 0) {
                throw new Error('Cart item not found');
            }
            
            console.log(`✅ Updated cart quantity: User ${userId}, Item ${itemId}, Qty ${quantity}`);
            
            return { userId, itemId, quantity };
        } catch (error) {
            console.error('❌ Error updating cart quantity:', error.message);
            throw error;
        }
    }

    /**
     * Remove item from cart
     * @param {number} userId - User ID
     * @param {number} itemId - Item ID
     * @returns {boolean} Success status
     */
    static async removeFromCart(userId, itemId) {
        try {
            await this.initialize();
            
            const [result] = await this.pool.execute(
                'DELETE FROM cart WHERE user_id = ? AND item_id = ?',
                [userId, itemId]
            );
            
            if (result.affectedRows === 0) {
                console.log(`⚠️ Cart item not found: User ${userId}, Item ${itemId}`);
                return false;
            }
            
            console.log(`✅ Removed from cart: User ${userId}, Item ${itemId}`);
            return true;
        } catch (error) {
            console.error('❌ Error removing from cart:', error.message);
            throw error;
        }
    }

    /**
     * Clear user's entire cart
     * @param {number} userId - User ID
     * @returns {number} Number of items removed
     */
    static async clearCart(userId) {
        try {
            await this.initialize();
            
            const [result] = await this.pool.execute(
                'DELETE FROM cart WHERE user_id = ?',
                [userId]
            );
            
            console.log(`✅ Cleared cart for user ${userId}: ${result.affectedRows} items removed`);
            return result.affectedRows;
        } catch (error) {
            console.error('❌ Error clearing cart:', error.message);
            throw error;
        }
    }

    /**
     * Get cart item count for user
     * @param {number} userId - User ID
     * @returns {number} Total item count
     */
    static async getCartCount(userId) {
        try {
            await this.initialize();
            
            const [rows] = await this.pool.execute(
                'SELECT SUM(quantity) as total FROM cart WHERE user_id = ?',
                [userId]
            );
            
            const count = rows[0].total || 0;
            console.log(`🛒 Cart count for user ${userId}: ${count}`);
            return count;
        } catch (error) {
            console.error('❌ Error getting cart count:', error.message);
            throw error;
        }
    }

    /**
     * Get cart total price
     * @param {number} userId - User ID
     * @returns {number} Total price
     */
    static async getCartTotal(userId) {
        try {
            await this.initialize();
            
            const [rows] = await this.pool.execute(
                `SELECT SUM(c.quantity * i.item_price) as total
                FROM cart c
                INNER JOIN items i ON c.item_id = i.item_id
                WHERE c.user_id = ?`,
                [userId]
            );
            
            const total = parseFloat(rows[0].total) || 0;
            console.log(`💰 Cart total for user ${userId}: ₱${total}`);
            return total;
        } catch (error) {
            console.error('❌ Error getting cart total:', error.message);
            throw error;
        }
    }

    /**
     * Check if item is in user's cart
     * @param {number} userId - User ID
     * @param {number} itemId - Item ID
     * @returns {boolean} True if item is in cart
     */
    static async isInCart(userId, itemId) {
        try {
            await this.initialize();
            
            const [rows] = await this.pool.execute(
                'SELECT cart_id FROM cart WHERE user_id = ? AND item_id = ?',
                [userId, itemId]
            );
            
            return rows.length > 0;
        } catch (error) {
            console.error('❌ Error checking if item in cart:', error.message);
            throw error;
        }
    }

    // ==================== NOTIFICATION METHODS ====================

    static async addNotification(notification) {
        try {
            await this.initialize();
            const [result] = await this.pool.execute(
                `INSERT INTO notifications (
                    user_id, type, title, message, item_id, related_user_id, is_read
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    notification.getUserId(),
                    notification.getType(),
                    notification.getTitle(),
                    notification.getMessage(),
                    notification.getItemId(),
                    notification.getRelatedUserId(),
                    notification.isReadStatus()
                ]
            );
            notification.setNotificationId(result.insertId);
            console.log(`✅ Notification created: ${notification.getTitle()} (ID: ${result.insertId})`);
            return notification;
        } catch (error) {
            console.error('❌ Error adding notification:', error.message);
            throw error;
        }
    }

    static async getNotificationsByUser(userId, limit = 50) {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                `SELECT * FROM notifications 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?`,
                [userId, limit]
            );
            
            console.log(`📬 Found ${rows.length} notifications for user ${userId}`);
            const Notification = require('./Notification');
            return rows.map(row => {
                const notification = new Notification();
                notification.notificationId = row.notification_id;
                notification.userId = row.user_id;
                notification.type = row.type;
                notification.title = row.title;
                notification.message = row.message;
                notification.itemId = row.item_id;
                notification.relatedUserId = row.related_user_id;
                notification.isRead = row.is_read;
                notification.createdAt = row.created_at;
                return notification;
            });
        } catch (error) {
            console.error('❌ Error getting notifications:', error.message);
            return [];
        }
    }

    static async getUnreadNotificationCount(userId) {
        try {
            await this.initialize();
            const [rows] = await this.pool.execute(
                'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
                [userId]
            );
            
            const count = rows[0].count;
            console.log(`📬 User ${userId} has ${count} unread notifications`);
            return count;
        } catch (error) {
            console.error('❌ Error getting unread count:', error.message);
            return 0;
        }
    }

    static async markNotificationAsRead(notificationId) {
        try {
            await this.initialize();
            await this.pool.execute(
                'UPDATE notifications SET is_read = TRUE WHERE notification_id = ?',
                [notificationId]
            );
            console.log(`✅ Notification ${notificationId} marked as read`);
            return true;
        } catch (error) {
            console.error('❌ Error marking notification as read:', error.message);
            return false;
        }
    }

    static async markAllNotificationsAsRead(userId) {
        try {
            await this.initialize();
            const [result] = await this.pool.execute(
                'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
                [userId]
            );
            console.log(`✅ Marked ${result.affectedRows} notifications as read for user ${userId}`);
            return result.affectedRows;
        } catch (error) {
            console.error('❌ Error marking all notifications as read:', error.message);
            return 0;
        }
    }

    static async deleteNotification(notificationId) {
        try {
            await this.initialize();
            await this.pool.execute(
                'DELETE FROM notifications WHERE notification_id = ?',
                [notificationId]
            );
            console.log(`✅ Notification ${notificationId} deleted`);
            return true;
        } catch (error) {
            console.error('❌ Error deleting notification:', error.message);
            return false;
        }
    }

    static async deleteOldNotifications(daysOld = 30) {
        try {
            await this.initialize();
            const [result] = await this.pool.execute(
                'DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
                [daysOld]
            );
            console.log(`✅ Deleted ${result.affectedRows} old notifications`);
            return result.affectedRows;
        } catch (error) {
            console.error('❌ Error deleting old notifications:', error.message);
            return 0;
        }
    }
}

module.exports = Database;