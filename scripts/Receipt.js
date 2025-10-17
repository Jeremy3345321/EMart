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

/*
// ===== RECEIPT USAGE EXAMPLES =====

// Get all receipts for an item (rental history)
const itemReceipts = await Database.getReceiptsByItem(camera.getItemId());
console.log(`This item has been rented ${itemReceipts.length} times`);

// Get all receipts where user is the owner (earning history)
const ownerReceipts = await Database.getReceiptsByOwner(owner.getUserId());
console.log(`Owner has ${ownerReceipts.length} rental transactions`);

// Get all receipts where user is the renter (rental history)
const renterReceipts = await Database.getReceiptsByRenter(renter.getUserId());
console.log(`Renter has rented ${renterReceipts.length} items`);

// Get all active rentals
const activeRentals = await Database.getActiveReceipts();
console.log(`${activeRentals.length} items are currently being rented`);

// Get completed rentals
const completedRentals = await Database.getReceiptsByStatus(Receipt.Status.COMPLETED);
console.log(`${completedRentals.length} rentals have been completed`);

// Check for overdue rentals
const overdueRentals = await Database.getOverdueReceipts();
if (overdueRentals.length > 0) {
    console.log(`Warning: ${overdueRentals.length} rentals are overdue!`);
}

// Get total earnings for an owner
const totalEarnings = await Database.getTotalEarningsByOwner(owner.getUserId());
console.log(`Owner has earned ${totalEarnings} in total`);

// Get total spending for a renter
const totalSpending = await Database.getTotalSpendingByRenter(renter.getUserId());
console.log(`Renter has spent ${totalSpending} in total`);

// Cancel a receipt
const receiptToCancel = await Database.getReceiptById(1);
if (receiptToCancel) {
    await Database.updateReceiptStatus(receiptToCancel.receiptId, Receipt.Status.CANCELLED);
    console.log('Receipt cancelled');
} = Receipt.Status.ACTIVE;

// await Database.addReceipt(receipt);

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
// await Database.updateReceipt(receipt);

console.log(`Item returned and receipt completed`);
*/