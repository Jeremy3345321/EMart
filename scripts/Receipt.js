class Receipt {
    static Status = {
        ACTIVE: 'active',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
    }
    
    constructor() {
        this.receiptId = null;
        this.itemId = null;
        this.ownerId = null;
        this.renterId = null;
        this.rentalStartDate = null;
        this.rentalEndDate = null;
        this.rentalPrice = null;
        this.status = null // enum of Receipt.Status
        this.isOwner = null // owner, renting
        this.createdAt = new Date();
    }
}