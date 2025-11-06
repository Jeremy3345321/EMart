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

/*
// ===== USER USAGE EXAMPLE =====

// CREATE AND REGISTER NEW USERS
// Create a new user
const user1 = new User(null, "alice_wonder", "securePass123");
await Database.addUser(user1); // This sets the userId automatically
console.log(`User registered: ${user1.getUserName()} with ID: ${user1.getUserId()}`);

const user2 = new User(null, "bob_builder", "password456");
await Database.addUser(user2);
console.log(`User registered: ${user2.getUserName()} with ID: ${user2.getUserId()}`);

// USER POSTS AN ITEM FOR RENT
// User1 creates and posts an item
const laptop = new Item(null, "MacBook Pro 2024", null, null);
laptop.itemTags = [Item.Tag.ELECTRONICS, Item.Tag.OFFICE_SCHOOL];

user1.postItem(laptop); // Sets ownerId and posts to database
console.log(`${user1.getUserName()} posted: ${laptop.getItemName()}`);
console.log(`Item is available for rent: ${laptop.isRenting}`);

// User1 posts another item
const tent = new Item(null, "4-Person Camping Tent", null, null);
tent.itemTags = [Item.Tag.SPORTS_OUTDOORS];
user1.postItem(tent);
console.log(`${user1.getUserName()} now has ${user1.allPostedItems.length} items posted`);

// USER RENTS AN ITEM
// User2 finds and rents the laptop
const availableItems = await Database.getAvailableItems();
const itemToRent = availableItems.find(item => item.getItemId() === laptop.getItemId());

if (itemToRent) {
    // Create a receipt for the rental
    const receipt = new Receipt();
    receipt.itemId = itemToRent.getItemId();
    receipt.ownerId = itemToRent.getOwnerId();
    receipt.renterId = user2.getUserId();
    receipt.rentalStartDate = new Date();
    receipt.rentalEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
    receipt.rentalPrice = 200.00;
    receipt.status = Receipt.Status.ACTIVE;
    await Database.addReceipt(receipt);

    // User2 rents the item
    user2.rentItem(itemToRent); // Sets renterId and marks as rented
    console.log(`${user2.getUserName()} rented: ${itemToRent.getItemName()}`);
    console.log(`Rental period: ${receipt.rentalStartDate.toLocaleDateString()} to ${receipt.rentalEndDate.toLocaleDateString()}`);
    console.log(`${user2.getUserName()} now has ${user2.allRentingItems.length} items rented`);
}

// RETRIEVE USER INFORMATION
// Get user by ID
const retrievedUser = await Database.getUserById(user1.getUserId());
console.log(`Retrieved user: ${retrievedUser.getUserName()}`);

// Get user by username
const foundUser = await Database.getUserByUsername("bob_builder");
console.log(`Found user by username: ${foundUser.getUserName()}`);

// VIEW USER'S ITEMS AND RECEIPTS
// Get all items posted by user1
const user1Items = await Database.getItemsByOwner(user1.getUserId());
console.log(`${user1.getUserName()} has ${user1Items.length} items posted`);

// Get all items rented by user2
const user2RentedItems = await Database.getItemsByRenter(user2.getUserId());
console.log(`${user2.getUserName()} is currently renting ${user2RentedItems.length} items`);

// Get all receipts for user1 as owner
const user1OwnerReceipts = await Database.getReceiptsByOwner(user1.getUserId());
console.log(`${user1.getUserName()} has ${user1OwnerReceipts.length} receipts as owner`);

// Get all receipts for user2 as renter
const user2RenterReceipts = await Database.getReceiptsByRenter(user2.getUserId());
console.log(`${user2.getUserName()} has ${user2RenterReceipts.length} receipts as renter`);

// CHECK USER EARNINGS AND SPENDING
// Get total earnings for user1 (as owner)
const user1Earnings = await Database.getTotalEarningsByOwner(user1.getUserId());
console.log(`${user1.getUserName()} total earnings: $${user1Earnings}`);

// Get total spending for user2 (as renter)
const user2Spending = await Database.getTotalSpendingByRenter(user2.getUserId());
console.log(`${user2.getUserName()} total spending: $${user2Spending}`);

// UPDATE USER INFORMATION
// Change username
user1.setUserName("alice_wonderland");
await Database.updateUser(user1);
console.log(`User updated to: ${user1.getUserName()}`);

// Change password
user2.setUserPassword("newSecurePassword789");
await Database.updateUser(user2);
console.log(`${user2.getUserName()} password updated`);

// DELETE USER (if needed)
const tempUser = new User(null, "temp_user", "temp123");
await Database.addUser(tempUser);
console.log(`Temporary user created with ID: ${tempUser.getUserId()}`);

await Database.deleteUser(tempUser.getUserId());
console.log(`Temporary user deleted`);
*/