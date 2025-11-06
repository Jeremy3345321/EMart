class Item {
    static Tag = {
        ELECTRONICS: 'Electronics',
        HOME_GARDEN: 'Home & Garden',
        FASHION: 'Fashion & Apparel',
        COSMETICS: 'Cosmetics',
        SPORTS_OUTDOORS: 'Sports & Outdoors',
        BOOKS_MEDIA: 'Books & Media',
        TOYS_HOBBIES: 'Toys & Hobbies',
        AUTOMOTIVE: 'Automotive',
        BABY_KIDS: 'Baby & Kids',
        OFFICE_SCHOOL: 'Office & School',
        PARTY_EVENTS: 'Party & Events'
    };
        
    constructor(itemId = null, itemName = null, ownerId = null, renterId = null) {
        this.itemId = itemId;
        this.itemName = itemName;
        this.ownerId = ownerId;
        this.renterId = renterId;
        this.isRenting = false;
        this.isRented = false;
        this.itemTags = []; //Array of Item.Tag
    }

    // Behaviour methods
    postItem() {
        this.isRenting = true;
        Database.addItem(this)
        
    }

    rentItem(receipt) {
        this.isRented = true;
        Database.updateItem(this)
    }

    // Setters and getters
    getItemId() {
        return this.itemId;
    }

    setItemId(value) {
        this.itemId = value;
    }

    getItemName() {
        return this.itemName;
    }

    setItemName(value) {
        this.itemName = value;
    }

    getOwnerId() {
        return this.ownerId;
    }

    setOwnerId(value) {
        this.ownerId = value;
    }

    getRenterId() {
        return this.renterId;
    }

    setRenterId(value) {
        this.renterId = value;
    }
}

/*
// ===== ITEM USAGE EXAMPLE =====
// Create a new user (owner)
const owner = new User(null, "john_doe", "password123");
await Database.addUser(owner); // This sets the userId

// Create a new item
const camera = new Item(null, "Canon EOS R5 Camera", owner.getUserId(), null);
camera.itemTags = [Item.Tag.ELECTRONICS, Item.Tag.HOBBIES];

// Owner posts the item for rent
camera.postItem(); // Sets isRenting to true and adds to database

console.log(`Item posted: ${camera.getItemName()}`);
console.log(`Owner ID: ${camera.getOwnerId()}`);
console.log(`Available for rent: ${camera.isRenting}`);

// Search for available items
const availableItems = await Database.getAvailableItems();
console.log(`${availableItems.length} items available for rent`);

// Another user wants to rent the camera
const renter = new User(null, "jane_smith", "password456");
await Database.addUser(renter);

// Create a receipt for the rental
const receipt = new Receipt();
receipt.itemId = camera.getItemId();
receipt.ownerId = camera.getOwnerId();
receipt.renterId = renter.getUserId();
receipt.rentalStartDate = new Date();
receipt.rentalEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days later
receipt.rentalPrice = 150.00;
receipt.status = Receipt.Status.ACTIVE;

// Save receipt to database
await Database.addReceipt(receipt);

// Renter rents the item
camera.setRenterId(renter.getUserId());
camera.rentItem(receipt); // Sets isRented to true and updates database

console.log(`Item rented by user ${renter.getUserId()}`);
console.log(`Rental period: ${receipt.rentalStartDate} to ${receipt.rentalEndDate}`);
console.log(`Rental price: ${receipt.rentalPrice}`);

// Get all items owned by a user
const myItems = await Database.getItemsByOwner(owner.getUserId());
console.log(`Owner has ${myItems.length} items`);

// Get all items rented by a user
const rentedItems = await Database.getItemsByRenter(renter.getUserId());
console.log(`Renter has ${rentedItems.length} items currently rented`);

// Later: Return the item
receipt.status = Receipt.Status.COMPLETED;
camera.isRented = false;
camera.setRenterId(null);
await Database.updateItem(camera);
await Database.updateReceiptStatus(receipt.receiptId, Receipt.Status.COMPLETED);

console.log(`Item returned and receipt completed`);
*/