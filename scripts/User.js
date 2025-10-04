class User {
    constructor(userId = null, userName = null, userPassword = null) {
        this.userId = userId;
        this.userName = userName;
        this.userPassword = userPassword;
        this.allPostedItems = []; // Array of Items where User is owner
        this.allRentingItems = []; // Array of Items wher User is renting
        this.allReceipts = []; // Array of Receipts (both owner receipt and renter receipt)
    }

    // Behaviour methods
    postItem(item) {
        item.setOwnerId = this.getUserId();
        item.postItem();

        this.allPostedItems.push(item);
    }

    rentItem(item) {
        item.setRenterId = this.getUserId();
        item.rentItem();

        this.allRentingItems.push(item);

    }

    // Setters and getters
    getUserId() {
        return this.userId;
    }

    setUserId(value) {
        this.userId = value;
    }

    getUserName() {
        return this.userName;
    }

    setUserName(value) {
        this.userName = value;
    }

    getUserPassword() {
        return this.userPassword;
    }

    setUserPassword(value) {
        this.userPassword = value;
    }
}
