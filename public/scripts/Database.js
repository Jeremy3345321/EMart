const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'e_mart',
    port: 3306
};

class Database {
    // User methods
    static async addUser(user) {
        try {
            const [result] = await this.pool.execute(
                'INSERT INTO users (user_name, user_password) VALUES (?, ?)',
                [user.getUserName(), user.getUserPassword()]
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
            const [rows] = await this.pool.execute(
                'SELECT * FROM users WHERE user_id = ?',
                [userId]
            );
            
            if (rows.length > 0) {
                return new User(rows[0].user_id, rows[0].user_name, rows[0].user_password);
            }
            return null;
        } catch (error) {
            console.error('Error getting user:', error.message);
            throw error;
        }
    }

    static async getUserByUsername(userName) {
        try {
            const [rows] = await this.pool.execute(
                'SELECT * FROM users WHERE user_name = ?',
                [userName]
            );
            
            if (rows.length > 0) {
                return new User(rows[0].user_id, rows[0].user_name, rows[0].user_password);
            }
            return null;
        } catch (error) {
            console.error('Error getting user by username:', error.message);
            throw error;
        }
    }

    static async updateUser(user) {
        try {
            await this.pool.execute(
                'UPDATE users SET user_name = ?, user_password = ? WHERE user_id = ?',
                [user.getUserName(), user.getUserPassword(), user.getUserId()]
            );
            console.log(`User updated: ${user.getUserName()}`);
        } catch (error) {
            console.error('Error updating user:', error.message);
            throw error;
        }
    }

    static async deleteUser(userId) {
        try {
            await this.pool.execute('DELETE FROM users WHERE user_id = ?', [userId]);
            console.log('User deleted');
        } catch (error) {
            console.error('Error deleting user:', error.message);
            throw error;
        }
    }

    // Item methods
    static async addItem(item) {
        try {
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
            const [rows] = await this.pool.execute(
                'SELECT * FROM items WHERE item_id = ?',
                [itemId]
            );
            
            if (rows.length > 0) {
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
            const [rows] = await this.pool.execute('SELECT * FROM items');
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
            const [rows] = await this.pool.execute(
                'SELECT * FROM items WHERE is_renting = TRUE AND is_rented = FALSE'
            );
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
            const [rows] = await this.pool.execute(
                'SELECT * FROM items WHERE owner_id = ?',
                [ownerId]
            );
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
            const [rows] = await this.pool.execute(
                'SELECT * FROM items WHERE renter_id = ?',
                [renterId]
            );
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
            await this.pool.execute('DELETE FROM items WHERE item_id = ?', [itemId]);
            console.log('Item deleted');
        } catch (error) {
            console.error('Error deleting item:', error.message);
            throw error;
        }
    }

    // Receipt methods
    static async addReceipt(receipt) {
        try {
            const [result] = await this.pool.execute(
                'INSERT INTO receipts (item_id, owner_id, renter_id, rental_start_date, rental_end_date, rental_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    receipt.itemId,
                    receipt.ownerId,
                    receipt.renterId,
                    receipt.rentalStartDate,
                    receipt.rentalEndDate,
                    receipt.rentalPrice,
                    receipt.status
                ]
            );
            receipt.receiptId = result.insertId;
            console.log(`Receipt created with ID: ${receipt.receiptId}`);
            return receipt;
        } catch (error) {
            console.error('Error adding receipt:', error.message);
            throw error;
        }
    }

    static async getReceiptById(receiptId) {
        try {
            const [rows] = await this.pool.execute(
                'SELECT * FROM receipts WHERE receipt_id = ?',
                [receiptId]
            );
            
            if (rows.length > 0) {
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
                return receipt;
            }
            return null;
        } catch (error) {
            console.error('Error getting receipt:', error.message);
            throw error;
        }
    }

    static async getReceiptsByItem(itemId) {
        try {
            const [rows] = await this.pool.execute(
                'SELECT * FROM receipts WHERE item_id = ? ORDER BY created_at DESC',
                [itemId]
            );
            
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
            console.error('Error getting receipts by item:', error.message);
            throw error;
        }
    }

    static async getReceiptsByOwner(ownerId) {
        try {
            const [rows] = await this.pool.execute(
                'SELECT * FROM receipts WHERE owner_id = ? ORDER BY created_at DESC',
                [ownerId]
            );
            
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
            throw error;
        }
    }

    static async getReceiptsByRenter(renterId) {
        try {
            const [rows] = await this.pool.execute(
                'SELECT * FROM receipts WHERE renter_id = ? ORDER BY created_at DESC',
                [renterId]
            );
            
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
            throw error;
        }
    }

    static async getActiveReceipts() {
        try {
            const [rows] = await this.pool.execute(
                'SELECT * FROM receipts WHERE status = ? ORDER BY created_at DESC',
                [Receipt.Status.ACTIVE]
            );
            
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
            console.error('Error getting active receipts:', error.message);
            throw error;
        }
    }

    static async getReceiptsByStatus(status) {
        try {
            const [rows] = await this.pool.execute(
                'SELECT * FROM receipts WHERE status = ? ORDER BY created_at DESC',
                [status]
            );
            
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
            console.error('Error getting receipts by status:', error.message);
            throw error;
        }
    }

    static async updateReceipt(receipt) {
        try {
            await this.pool.execute(
                'UPDATE receipts SET item_id = ?, owner_id = ?, renter_id = ?, rental_start_date = ?, rental_end_date = ?, rental_price = ?, status = ? WHERE receipt_id = ?',
                [
                    receipt.itemId,
                    receipt.ownerId,
                    receipt.renterId,
                    receipt.rentalStartDate,
                    receipt.rentalEndDate,
                    receipt.rentalPrice,
                    receipt.status,
                    receipt.receiptId
                ]
            );
            console.log(`Receipt ${receipt.receiptId} updated`);
        } catch (error) {
            console.error('Error updating receipt:', error.message);
            throw error;
        }
    }

    static async updateReceiptStatus(receiptId, status) {
        try {
            await this.pool.execute(
                'UPDATE receipts SET status = ? WHERE receipt_id = ?',
                [status, receiptId]
            );
            console.log(`Receipt ${receiptId} status updated to ${status}`);
        } catch (error) {
            console.error('Error updating receipt status:', error.message);
            throw error;
        }
    }

    static async deleteReceipt(receiptId) {
        try {
            await this.pool.execute('DELETE FROM receipts WHERE receipt_id = ?', [receiptId]);
            console.log('Receipt deleted');
        } catch (error) {
            console.error('Error deleting receipt:', error.message);
            throw error;
        }
    }

    static async getOverdueReceipts() {
        try {
            const [rows] = await this.pool.execute(
                'SELECT * FROM receipts WHERE status = ? AND rental_end_date < NOW() ORDER BY rental_end_date ASC',
                [Receipt.Status.ACTIVE]
            );
            
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
            console.error('Error getting overdue receipts:', error.message);
            throw error;
        }
    }

    static async getTotalEarningsByOwner(ownerId) {
        try {
            const [rows] = await this.pool.execute(
                'SELECT SUM(rental_price) as total_earnings FROM receipts WHERE owner_id = ? AND status = ?',
                [ownerId, Receipt.Status.COMPLETED]
            );
            
            return rows[0].total_earnings || 0;
        } catch (error) {
            console.error('Error getting total earnings:', error.message);
            throw error;
        }
    }

    static async getTotalSpendingByRenter(renterId) {
        try {
            const [rows] = await this.pool.execute(
                'SELECT SUM(rental_price) as total_spending FROM receipts WHERE renter_id = ? AND status = ?',
                [renterId, Receipt.Status.COMPLETED]
            );
            
            return rows[0].total_spending || 0;
        } catch (error) {
            console.error('Error getting total spending:', error.message);
            throw error;
        }
    }

    // MESSAGE METHODS
    static async addMessage(message) {
        try {
            const [result] = await this.pool.execute(
                'INSERT INTO messages (from_id, to_id, content, timestamp, is_read) VALUES (?, ?, ?, ?, ?)',
                [
                    message.getFromId(), 
                    message.getToId(), 
                    message.getContent(), 
                    message.getTimestamp(), 
                    message.getIsRead()
                ]
            );
            message.setMessageId(result.insertId);
            console.log(`Message sent from user ${message.getFromId()} to user ${message.getToId()}`);
            return message;
        } catch (error) {
            console.error('Error adding message:', error.message);
            throw error;
        }
    }

    static async getMessageById(messageId) {
        try {
            const [rows] = await this.pool.execute(
                'SELECT * FROM messages WHERE message_id = ?',
                [messageId]
            );
            
            if (rows.length > 0) {
                const message = new Message(
                    rows[0].message_id,
                    rows[0].from_id,
                    rows[0].to_id,
                    rows[0].content
                );
                message.setTimestamp(rows[0].timestamp);
                message.setIsRead(rows[0].is_read);
                return message;
            }
            return null;
        } catch (error) {
            console.error('Error getting message:', error.message);
            throw error;
        }
    }

    static async getConversation(userId1, userId2) {
        try {
            const [rows] = await this.pool.execute(
                `SELECT * FROM messages 
                WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)
                ORDER BY timestamp ASC`,
                [userId1, userId2, userId2, userId1]
            );
            
            return rows.map(row => {
                const message = new Message(
                    row.message_id,
                    row.from_id,
                    row.to_id,
                    row.content
                );
                message.setTimestamp(row.timestamp);
                message.setIsRead(row.is_read);
                return message;
            });
        } catch (error) {
            console.error('Error getting conversation:', error.message);
            throw error;
        }
    }

    static async getUserMessages(userId) {
        try {
            const [rows] = await this.pool.execute(
                'SELECT * FROM messages WHERE from_id = ? OR to_id = ? ORDER BY timestamp DESC',
                [userId, userId]
            );
            
            return rows.map(row => {
                const message = new Message(
                    row.message_id,
                    row.from_id,
                    row.to_id,
                    row.content
                );
                message.setTimestamp(row.timestamp);
                message.setIsRead(row.is_read);
                return message;
            });
        } catch (error) {
            console.error('Error getting user messages:', error.message);
            throw error;
        }
    }

    static async getUnreadMessages(userId) {
        try {
            const [rows] = await this.pool.execute(
                'SELECT * FROM messages WHERE to_id = ? AND is_read = FALSE ORDER BY timestamp DESC',
                [userId]
            );
            
            return rows.map(row => {
                const message = new Message(
                    row.message_id,
                    row.from_id,
                    row.to_id,
                    row.content
                );
                message.setTimestamp(row.timestamp);
                message.setIsRead(row.is_read);
                return message;
            });
        } catch (error) {
            console.error('Error getting unread messages:', error.message);
            throw error;
        }
    }

    static async markMessageAsRead(messageId) {
        try {
            await this.pool.execute(
                'UPDATE messages SET is_read = TRUE WHERE message_id = ?',
                [messageId]
            );
            console.log(`Message ${messageId} marked as read`);
        } catch (error) {
            console.error('Error marking message as read:', error.message);
            throw error;
        }
    }

    static async markConversationAsRead(userId, otherUserId) {
        try {
            await this.pool.execute(
                'UPDATE messages SET is_read = TRUE WHERE from_id = ? AND to_id = ?',
                [otherUserId, userId]
            );
            console.log(`Conversation marked as read`);
        } catch (error) {
            console.error('Error marking conversation as read:', error.message);
            throw error;
        }
    }

    static async deleteMessage(messageId) {
        try {
            await this.pool.execute('DELETE FROM messages WHERE message_id = ?', [messageId]);
            console.log('Message deleted');
        } catch (error) {
            console.error('Error deleting message:', error.message);
            throw error;
        }
    }

    static async getUserConversations(userId) {
        try {
            // Get unique users that the given user has chatted with
            const [rows] = await this.pool.execute(
                `SELECT DISTINCT 
                    CASE 
                        WHEN from_id = ? THEN to_id 
                        ELSE from_id 
                    END as other_user_id,
                    MAX(timestamp) as last_message_time
                FROM messages 
                WHERE from_id = ? OR to_id = ?
                GROUP BY other_user_id
                ORDER BY last_message_time DESC`,
                [userId, userId, userId]
            );
            
            return rows;
        } catch (error) {
            console.error('Error getting user conversations:', error.message);
            throw error;
        }
    }

    // Close all connections
    static async close() {
        if (this.pool) {
            await this.pool.end();
        }
    }
}