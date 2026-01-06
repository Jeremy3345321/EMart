// Notification.js - Notification class for managing user notifications

class Notification {
    constructor() {
        this.notificationId = null;
        this.userId = null;
        this.type = null; // rental_started, item_rented_out, rental_ended, item_returned, item_arrived
        this.title = '';
        this.message = '';
        this.itemId = null;
        this.relatedUserId = null;
        this.isRead = false;
        this.createdAt = null;
    }

    // Static method to create notification for rental started (for renter)
    static createRentalStartedNotification(renterId, itemId, itemName, ownerId) {
        const notification = new Notification();
        notification.userId = renterId;
        notification.type = 'rental_started';
        notification.title = 'Rental Confirmed!';
        notification.message = `You are now renting "${itemName}". Enjoy your rental!`;
        notification.itemId = itemId;
        notification.relatedUserId = ownerId;
        return notification;
    }

    // Static method to create notification for item rented out (for owner)
    static createItemRentedOutNotification(ownerId, itemId, itemName, renterId) {
        const notification = new Notification();
        notification.userId = ownerId;
        notification.type = 'item_rented_out';
        notification.title = 'Item Rented Out!';
        notification.message = `Your item "${itemName}" is now being rented.`;
        notification.itemId = itemId;
        notification.relatedUserId = renterId;
        return notification;
    }

    // Static method to create notification for rental ended (for renter)
    static createRentalEndedNotification(renterId, itemId, itemName, ownerId) {
        const notification = new Notification();
        notification.userId = renterId;
        notification.type = 'rental_ended';
        notification.title = 'Rental Period Ended';
        notification.message = `Your rental of "${itemName}" has ended. Thank you!`;
        notification.itemId = itemId;
        notification.relatedUserId = ownerId;
        return notification;
    }

    // Static method to create notification for item returned (for owner)
    static createItemReturnedNotification(ownerId, itemId, itemName, renterId) {
        const notification = new Notification();
        notification.userId = ownerId;
        notification.type = 'item_returned';
        notification.title = 'Item Returned';
        notification.message = `Your item "${itemName}" has been returned.`;
        notification.itemId = itemId;
        notification.relatedUserId = renterId;
        return notification;
    }

    // Static method to create notification for item arrived (for renter)
    static createItemArrivedNotificationForRenter(renterId, itemId, itemName, ownerId) {
        const notification = new Notification();
        notification.userId = renterId;
        notification.type = 'item_arrived';
        notification.title = 'Item Has Arrived! 🎉';
        notification.message = `Good news! "${itemName}" has arrived and is ready for you to use. Enjoy your rental!`;
        notification.itemId = itemId;
        notification.relatedUserId = ownerId;
        return notification;
    }

    // Static method to create notification for item arrived (for owner)
    static createItemArrivedNotificationForOwner(ownerId, itemId, itemName, renterName, renterId) {
        const notification = new Notification();
        notification.userId = ownerId;
        notification.type = 'item_arrived';
        notification.title = 'Item Delivered! 📦';
        notification.message = `Your item "${itemName}" has been delivered to ${renterName}. The rental is now active.`;
        notification.itemId = itemId;
        notification.relatedUserId = renterId;
        return notification;
    }

    // Getters
    getNotificationId() {
        return this.notificationId;
    }

    getUserId() {
        return this.userId;
    }

    getType() {
        return this.type;
    }

    getTitle() {
        return this.title;
    }

    getMessage() {
        return this.message;
    }

    getItemId() {
        return this.itemId;
    }

    getRelatedUserId() {
        return this.relatedUserId;
    }

    isReadStatus() {
        return this.isRead;
    }

    getCreatedAt() {
        return this.createdAt;
    }

    // Setters
    setNotificationId(id) {
        this.notificationId = id;
    }

    setUserId(id) {
        this.userId = id;
    }

    setType(type) {
        const validTypes = ['rental_started', 'item_rented_out', 'rental_ended', 'item_returned', 'item_arrived'];
        if (validTypes.includes(type)) {
            this.type = type;
        } else {
            throw new Error(`Invalid notification type: ${type}`);
        }
    }

    setTitle(title) {
        this.title = title;
    }

    setMessage(message) {
        this.message = message;
    }

    setItemId(id) {
        this.itemId = id;
    }

    setRelatedUserId(id) {
        this.relatedUserId = id;
    }

    markAsRead() {
        this.isRead = true;
    }

    markAsUnread() {
        this.isRead = false;
    }

    // Utility methods
    getTimeAgo() {
        if (!this.createdAt) return 'just now';
        
        const now = new Date();
        const created = new Date(this.createdAt);
        const diffMs = now - created;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return created.toLocaleDateString();
    }

    toJSON() {
        return {
            notificationId: this.notificationId,
            userId: this.userId,
            type: this.type,
            title: this.title,
            message: this.message,
            itemId: this.itemId,
            relatedUserId: this.relatedUserId,
            isRead: this.isRead,
            createdAt: this.createdAt,
            timeAgo: this.getTimeAgo()
        };
    }
}

module.exports = Notification;