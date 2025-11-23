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
        
    constructor(itemId = null, itemName = null, ownerId = null, renterId = null, imageUrl = null) {
        this.itemId = itemId;
        this.itemName = itemName;
        this.ownerId = ownerId;
        this.renterId = renterId;
        this.imageUrl = imageUrl;
        this.isRenting = false;
        this.isRented = false;
        this.itemTags = []; // Array of Item.Tag
        this.description = '';
        this.price = 0;
        this.condition = 'Like New';
    }

    // Getters and Setters
    getItemId() { return this.itemId; }
    setItemId(id) { this.itemId = id; }
    
    getItemName() { return this.itemName; }
    setItemName(name) { this.itemName = name; }
    
    getOwnerId() { return this.ownerId; }
    setOwnerId(id) { this.ownerId = id; }
    
    getRenterId() { return this.renterId; }
    setRenterId(id) { this.renterId = id; }
    
    getImageUrl() { return this.imageUrl; }
    setImageUrl(url) { this.imageUrl = url; }
    
    getDescription() { return this.description; }
    setDescription(desc) { this.description = desc; }
    
    getPrice() { return this.price; }
    setPrice(price) { this.price = price; }
    
    getCondition() { return this.condition; }
    setCondition(condition) { this.condition = condition; }

    // Tag methods
    addTag(tag) {
        if (Object.values(Item.Tag).includes(tag) && !this.itemTags.includes(tag)) {
            this.itemTags.push(tag);
        }
    }

    removeTag(tag) {
        this.itemTags = this.itemTags.filter(t => t !== tag);
    }

    getTags() {
        return this.itemTags;
    }

    hasTag(tag) {
        return this.itemTags.includes(tag);
    }

    // Behaviour methods
    postItem() {
        this.isRenting = true;
        Database.addItem(this);
    }

    rentItem(receipt) {
        this.isRented = true;
        Database.updateItem(this);
    }
}

module.exports = Item;