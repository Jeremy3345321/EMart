// Receipt.js - Receipt class for managing rental receipts

class Receipt {
    constructor() {
        this.receiptId = null;
        this.itemId = null;
        this.ownerId = null;
        this.renterId = null;
        this.rentalStartDate = null;
        this.rentalEndDate = null;
        this.rentalPrice = 0;
        this.status = 'active'; // active, completed, cancelled
        this.createdAt = null;
        this.updatedAt = null;
    }

    // Getters
    getReceiptId() {
        return this.receiptId;
    }

    getItemId() {
        return this.itemId;
    }

    getOwnerId() {
        return this.ownerId;
    }

    getRenterId() {
        return this.renterId;
    }

    getRentalStartDate() {
        return this.rentalStartDate;
    }

    getRentalEndDate() {
        return this.rentalEndDate;
    }

    getRentalPrice() {
        return this.rentalPrice;
    }

    getStatus() {
        return this.status;
    }

    getCreatedAt() {
        return this.createdAt;
    }

    getUpdatedAt() {
        return this.updatedAt;
    }

    // Setters
    setReceiptId(receiptId) {
        this.receiptId = receiptId;
    }

    setItemId(itemId) {
        this.itemId = itemId;
    }

    setOwnerId(ownerId) {
        this.ownerId = ownerId;
    }

    setRenterId(renterId) {
        this.renterId = renterId;
    }

    setRentalStartDate(date) {
        this.rentalStartDate = date instanceof Date ? date : new Date(date);
    }

    setRentalEndDate(date) {
        this.rentalEndDate = date instanceof Date ? date : new Date(date);
    }

    setRentalPrice(price) {
        this.rentalPrice = parseFloat(price);
    }

    setStatus(status) {
        const validStatuses = ['active', 'completed', 'cancelled'];
        if (validStatuses.includes(status)) {
            this.status = status;
        } else {
            throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
        }
    }

    // Utility methods
    getRentalDuration() {
        if (!this.rentalStartDate || !this.rentalEndDate) {
            return 0;
        }
        const start = new Date(this.rentalStartDate);
        const end = new Date(this.rentalEndDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    isActive() {
        return this.status === 'active';
    }

    isCompleted() {
        return this.status === 'completed';
    }

    isCancelled() {
        return this.status === 'cancelled';
    }

    isOverdue() {
        if (this.status !== 'active') {
            return false;
        }
        const now = new Date();
        const endDate = new Date(this.rentalEndDate);
        return now > endDate;
    }

    getDaysOverdue() {
        if (!this.isOverdue()) {
            return 0;
        }
        const now = new Date();
        const endDate = new Date(this.rentalEndDate);
        const diffTime = Math.abs(now - endDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    getDaysRemaining() {
        if (this.status !== 'active') {
            return 0;
        }
        const now = new Date();
        const endDate = new Date(this.rentalEndDate);
        if (now > endDate) {
            return 0;
        }
        const diffTime = Math.abs(endDate - now);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    // Calculate late fee (if applicable)
    calculateLateFee(feePerDay = 10) {
        if (!this.isOverdue()) {
            return 0;
        }
        return this.getDaysOverdue() * feePerDay;
    }

    // Format receipt info
    toString() {
        return `Receipt #${this.receiptId}: Item ${this.itemId} | Owner: ${this.ownerId} | Renter: ${this.renterId} | Price: ₱${this.rentalPrice} | Status: ${this.status}`;
    }

    toJSON() {
        return {
            receiptId: this.receiptId,
            itemId: this.itemId,
            ownerId: this.ownerId,
            renterId: this.renterId,
            rentalStartDate: this.rentalStartDate,
            rentalEndDate: this.rentalEndDate,
            rentalPrice: this.rentalPrice,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            rentalDuration: this.getRentalDuration(),
            isOverdue: this.isOverdue(),
            daysRemaining: this.getDaysRemaining()
        };
    }
}

module.exports = Receipt;