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