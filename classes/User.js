// User.js

class User {
    constructor(userId = null, userName = null, userPassword = null, userEmail = null) {
        this.userId = userId;
        this.userName = userName;
        this.userPassword = userPassword;
        this.userEmail = userEmail;
        this.allPostedItems = []; // Array of Items where User is owner
        this.allRentingItems = []; // Array of Items where User is renting
        this.allReceipts = []; // Array of Receipts (both owner receipt and renter receipt)
    }

    // Getters
    getUserId() {
        return this.userId;
    }

    getUserName() {
        return this.userName;
    }

    getUserPassword() {
        return this.userPassword;
    }

    getUserEmail() {
        return this.userEmail;
    }

    getAllPostedItems() {
        return this.allPostedItems;
    }

    getAllRentingItems() {
        return this.allRentingItems;
    }

    getAllReceipts() {
        return this.allReceipts;
    }

    // Setters
    setUserId(userId) {
        this.userId = userId;
    }

    setUserName(userName) {
        this.userName = userName;
    }

    setUserPassword(userPassword) {
        this.userPassword = userPassword;
    }

    setUserEmail(userEmail) {
        this.userEmail = userEmail;
    }

    // Behaviour methods
    async postItem(item) {
        const Database = require('./Database');
        item.setOwnerId(this.getUserId());
        await item.postItem();
        this.allPostedItems.push(item);
    }

    async rentItem(item) {
        const Database = require('./Database');
        item.setRenterId(this.getUserId());
        await item.rentItem();
        this.allRentingItems.push(item);
    }

    // Load user's items and receipts
    async loadUserData() {
        const Database = require('./Database');
        
        // Load posted items
        this.allPostedItems = await Database.getItemsByOwner(this.userId);
        
        // Load renting items
        this.allRentingItems = await Database.getItemsByRenter(this.userId);
        
        // Load receipts (both as owner and renter)
        const ownerReceipts = await Database.getReceiptsByOwner(this.userId);
        const renterReceipts = await Database.getReceiptsByRenter(this.userId);
        this.allReceipts = [...ownerReceipts, ...renterReceipts];
    }
}

module.exports = User;