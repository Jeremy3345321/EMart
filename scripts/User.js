class User {
    constructor(userId = null, userName = null, userPassword = null) {
        this.userId = userId;
        this.userName = userName;
        this.userPassword = userPassword;
    }

    // Behaviour methods
    postItem(item) {
        item.setOwnerId = this.getUserId();
        item.postItem();
    }

    rentItem(item) {
        item.setRenterId = this.getUserId();
        item.rentItem();
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
