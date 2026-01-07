// Item.js - Updated with rental duration functionality

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

    // Rental duration units
    static DurationUnit = {
        HOUR: 'hour',
        DAY: 'day',
        WEEK: 'week',
        MONTH: 'month'
    };
        
    constructor(itemId = null, itemName = null, ownerId = null, renterId = null, imageUrl = null) {
        this.itemId = itemId;
        this.itemName = itemName;
        this.ownerId = ownerId;
        this.renterId = renterId;
        this.imageUrl = imageUrl;
        this.isRenting = false;
        this.isRented = false;
        this.itemTags = [];
        this.description = '';
        this.price = 0;
        this.condition = 'Like New';
        
        // Rating properties
        this.itemRating = null;
        this.ratingCount = 0;
        this.totalRatingPoints = 0;
        
        // NEW: Rental duration properties
        this.rentalDuration = 1; // Default 1 unit
        this.rentalDurationUnit = Item.DurationUnit.DAY; // Default to days
        this.maxRentalDuration = null; // Optional max duration (in same unit)
        this.minRentalDuration = null; // Optional min duration (in same unit)
    }

    // Existing getters and setters...
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

    getRating() { return this.itemRating; }
    getRatingCount() { return this.ratingCount; }

    // NEW: Rental duration getters and setters
    getRentalDuration() { return this.rentalDuration; }
    setRentalDuration(duration) { 
        if (duration <= 0) {
            throw new Error('Rental duration must be greater than 0');
        }
        this.rentalDuration = duration; 
    }

    getRentalDurationUnit() { return this.rentalDurationUnit; }
    setRentalDurationUnit(unit) {
        if (!Object.values(Item.DurationUnit).includes(unit)) {
            throw new Error('Invalid duration unit');
        }
        this.rentalDurationUnit = unit;
    }

    getMaxRentalDuration() { return this.maxRentalDuration; }
    setMaxRentalDuration(duration) {
        if (duration !== null && duration <= 0) {
            throw new Error('Max rental duration must be greater than 0');
        }
        this.maxRentalDuration = duration;
    }

    getMinRentalDuration() { return this.minRentalDuration; }
    setMinRentalDuration(duration) {
        if (duration !== null && duration <= 0) {
            throw new Error('Min rental duration must be greater than 0');
        }
        this.minRentalDuration = duration;
    }

    // NEW: Get formatted duration string
    getFormattedDuration() {
        const plural = this.rentalDuration > 1 ? 's' : '';
        return `${this.rentalDuration} ${this.rentalDurationUnit}${plural}`;
    }

    // NEW: Calculate total price based on rental period
    calculateTotalPrice(requestedDuration, requestedUnit) {
        // Convert requested duration to item's base unit for calculation
        const requestedInBaseDays = this.convertToBaseDays(requestedDuration, requestedUnit);
        const itemBaseDays = this.convertToBaseDays(this.rentalDuration, this.rentalDurationUnit);
        
        // Calculate price per day rate
        const pricePerDay = this.price / itemBaseDays;
        
        // Calculate total
        return pricePerDay * requestedInBaseDays;
    }

    // Helper: Convert any duration to days for calculation
    convertToBaseDays(duration, unit) {
        switch(unit) {
            case Item.DurationUnit.HOUR: return duration / 24;
            case Item.DurationUnit.DAY: return duration;
            case Item.DurationUnit.WEEK: return duration * 7;
            case Item.DurationUnit.MONTH: return duration * 30; // Approximate
            default: return duration;
        }
    }

    // Validate if requested duration is within allowed range
    isValidRentalPeriod(requestedDuration, requestedUnit) {
        // Convert to base unit for comparison
        const requested = this.convertToBaseDays(requestedDuration, requestedUnit);
        const min = this.minRentalDuration ? 
            this.convertToBaseDays(this.minRentalDuration, this.rentalDurationUnit) : 0;
        const max = this.maxRentalDuration ? 
            this.convertToBaseDays(this.maxRentalDuration, this.rentalDurationUnit) : Infinity;
        
        return requested >= min && requested <= max;
    }

    // Existing methods...
    addRating(rating) {
        if (rating < 0 || rating > 5) {
            throw new Error('Rating must be between 0 and 5');
        }
        
        this.totalRatingPoints += rating;
        this.ratingCount += 1;
        this.itemRating = parseFloat((this.totalRatingPoints / this.ratingCount).toFixed(1));
    }

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

    postItem() {
        this.isRenting = true;
    }

    rentItem(receipt) {
        this.isRented = true;
    }
}

module.exports = Item;