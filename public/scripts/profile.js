// profile.js - FIXED VERSION

// Check if user is logged in
const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');

if (!currentUser) {
    window.location.href = 'login.html';
}

console.log('👤 Current user:', currentUser);

// API Base URL
const API_URL = 'http://localhost:3000/api';

// DOM Elements
const userAvatar = document.getElementById('userAvatar');
const displayName = document.getElementById('displayName');
const displayUsername = document.getElementById('displayUsername');
const totalItemsOwned = document.getElementById('totalItemsOwned');
const availableItems = document.getElementById('availableItems');
const rentedOutItems = document.getElementById('rentedOutItems');
const itemsRenting = document.getElementById('itemsRenting');
const ownedItemsGrid = document.getElementById('ownedItemsGrid');
const rentingItemsGrid = document.getElementById('rentingItemsGrid');
const editProfileBtn = document.getElementById('editProfileBtn');
const addItemBtn = document.getElementById('addItemBtn');
const addItemCard = document.getElementById('addItemCard');

// Dropdown menu
const menuBtn = document.getElementById('menuBtn');
const dropdownMenu = document.getElementById('dropdownMenu');

menuBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
});

document.addEventListener('click', function(e) {
    if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove('show');
    }
});

// Dropdown actions
document.getElementById('viewProfileBtn').addEventListener('click', function() {
    dropdownMenu.classList.remove('show');
    window.location.href = 'profile.html';
});

document.getElementById('postItemBtn').addEventListener('click', function() {
    dropdownMenu.classList.remove('show');
    window.location.href = 'post-item.html';
});

document.getElementById('seeReceiptsBtn').addEventListener('click', function() {
    dropdownMenu.classList.remove('show');
    window.location.href = 'receipts.html';
});

document.getElementById('logoutBtn').addEventListener('click', function() {
    dropdownMenu.classList.remove('show');
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
});

document.getElementById('cartBtn').addEventListener('click', function() {
    window.location.href = 'cart.html';
});

// Initialize profile page
function initializeProfile() {
    // Set user info
    const username = currentUser.username || 'User';
    const email = currentUser.email || 'user@example.com';
    const firstLetter = username.charAt(0).toUpperCase();
    
    userAvatar.textContent = firstLetter;
    displayName.textContent = username;
    displayUsername.textContent = `${email}`;
    
    // Load user's items
    loadUserItems();
    loadRentingItems();
}

// Load user's owned items
async function loadUserItems() {
    console.log('📦 Loading owned items for user:', currentUser.userId);
    
    try {
        const response = await fetch(`${API_URL}/items/owner/${currentUser.userId}`);
        const data = await response.json();
        
        if (data.success) {
            const items = data.data;
            console.log('✅ Loaded owned items:', items);
            
            // Update stats
            totalItemsOwned.textContent = items.length;
            
            const available = items.filter(item => item.isRenting && !item.isRented).length;
            const rented = items.filter(item => item.isRented).length;
            
            availableItems.textContent = available;
            rentedOutItems.textContent = rented;
            
            // Display items
            displayOwnedItems(items);
        } else {
            console.error('Failed to load owned items:', data.message);
            displayEmptyState(ownedItemsGrid, 'owned');
        }
    } catch (error) {
        console.error('❌ Error loading owned items:', error);
        displayEmptyState(ownedItemsGrid, 'owned');
    }
}

// NEW: Load items user is currently renting
async function loadRentingItems() {
    console.log('🏠 Loading renting items for user:', currentUser.userId);
    
    try {
        // Get active receipts where user is the renter
        const response = await fetch(`${API_URL}/receipts/renter/${currentUser.userId}`);
        const data = await response.json();
        
        if (data.success) {
            const receipts = data.data;
            console.log('✅ Loaded receipts:', receipts);
            
            // Filter only active receipts
            const activeReceipts = receipts.filter(r => r.status === 'active');
            
            // Update stat
            itemsRenting.textContent = activeReceipts.length;
            
            if (activeReceipts.length === 0) {
                displayEmptyState(rentingItemsGrid, 'renting');
                return;
            }
            
            // Fetch item details for each active receipt
            const itemPromises = activeReceipts.map(async (receipt) => {
                try {
                    const itemResponse = await fetch(`${API_URL}/items/${receipt.itemId}`);
                    const itemData = await itemResponse.json();
                    
                    if (itemData.success) {
                        return {
                            item: itemData.data,
                            receipt: receipt
                        };
                    }
                    return null;
                } catch (error) {
                    console.error(`Error loading item ${receipt.itemId}:`, error);
                    return null;
                }
            });
            
            const itemsWithReceipts = (await Promise.all(itemPromises)).filter(Boolean);
            console.log('✅ Loaded renting items with details:', itemsWithReceipts);
            
            displayRentingItems(itemsWithReceipts);
        } else {
            console.error('Failed to load receipts:', data.message);
            displayEmptyState(rentingItemsGrid, 'renting');
        }
    } catch (error) {
        console.error('❌ Error loading renting items:', error);
        displayEmptyState(rentingItemsGrid, 'renting');
    }
}

// Display owned items
async function displayOwnedItems(items) {
    // Clear grid except add card
    ownedItemsGrid.innerHTML = '';
    ownedItemsGrid.appendChild(addItemCard);
    
    if (items.length === 0) {
        displayEmptyState(ownedItemsGrid, 'owned');
        return;
    }
    
    // Fetch full item details for each item
    for (const item of items) {
        try {
            const response = await fetch(`${API_URL}/items/${item.itemId}`);
            const itemData = await response.json();
            
            if (itemData.success) {
                const fullItem = itemData.data;
                const itemCard = createOwnedItemCard(fullItem);
                ownedItemsGrid.appendChild(itemCard);
            }
        } catch (error) {
            console.error(`Error loading item ${item.itemId}:`, error);
        }
    }
}

// NEW: Display renting items
function displayRentingItems(itemsWithReceipts) {
    rentingItemsGrid.innerHTML = '';
    
    if (itemsWithReceipts.length === 0) {
        displayEmptyState(rentingItemsGrid, 'renting');
        return;
    }
    
    itemsWithReceipts.forEach(({ item, receipt }) => {
        const card = createRentingItemCard(item, receipt);
        rentingItemsGrid.appendChild(card);
    });
}

// Create owned item card
function createOwnedItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    
    const status = item.isRented ? 'Rented Out' : 'Available';
    const statusClass = item.isRented ? 'status-rented' : 'status-available';
    
    card.innerHTML = `
        <div class="item-image">
            ${item.imageUrl ? 
                `<img src="${item.imageUrl}" alt="${item.itemName}">` :
                `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>`
            }
        </div>
        <h3 title="${item.itemName}">${item.itemName}</h3>
        <p class="price">₱${parseFloat(item.price).toFixed(2)} / ${item.formattedDuration || 'day'}</p>
        <span class="item-status ${statusClass}">${status}</span>
        <button class="manage-btn" onclick="manageItem(${item.itemId})">Manage</button>
    `;
    
    return card;
}

// NEW: Create renting item card
function createRentingItemCard(item, receipt) {
    const card = document.createElement('div');
    card.className = 'item-card';
    
    // Calculate days remaining
    const endDate = new Date(receipt.rentalEndDate);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    
    card.innerHTML = `
        <div class="item-image">
            ${item.imageUrl ? 
                `<img src="${item.imageUrl}" alt="${item.itemName}">` :
                `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>`
            }
        </div>
        <h3 title="${item.itemName}">${item.itemName}</h3>
        <p class="price">₱${parseFloat(receipt.rentalPrice).toFixed(2)} paid</p>
        <span class="item-status ${daysRemaining > 0 ? 'status-available' : 'status-rented'}">
            ${daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
        </span>
        <button class="manage-btn" onclick="viewRentingItem(${item.itemId}, ${receipt.receiptId})">View Details</button>
    `;
    
    return card;
}

// Display empty state
function displayEmptyState(gridElement, type) {
    const existingEmpty = gridElement.querySelector('.empty-state');
    if (existingEmpty) return;
    
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    
    if (type === 'owned') {
        emptyState.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <h3>No Items Yet</h3>
            <p>Start by posting your first item!</p>
        `;
    } else if (type === 'renting') {
        emptyState.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <h3>Not Renting Anything</h3>
            <p>Browse the marketplace to find items to rent!</p>
        `;
    }
    
    gridElement.appendChild(emptyState);
}

// Manage item function (for owned items)
window.manageItem = async function(itemId) {
    console.log('Managing item:', itemId);
    
    try {
        const response = await fetch(`${API_URL}/items/${itemId}`);
        const data = await response.json();
        
        if (data.success) {
            const item = data.data;
            
            // Check if item is currently rented
            if (item.isRented) {
                // Redirect to receipts page
                console.log('Item is rented, redirecting to receipts...');
                window.location.href = 'receipts.html';
            } else {
                // Open edit modal
                openManageItemModal(item);
            }
        } else {
            alert('Failed to load item details');
        }
    } catch (error) {
        console.error('Error loading item:', error);
        alert('Failed to load item details');
    }
};

// Open manage item modal
function openManageItemModal(item) {
    let modal = document.getElementById('itemModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'itemModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Manage Item</h2>
                <button class="modal-close" onclick="closeManageItemModal()">&times;</button>
            </div>
            
            <div class="modal-body">
                <form id="itemForm">
                    <div class="form-group">
                        <label>Item Name</label>
                        <input type="text" id="editItemName" value="${item.itemName}" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="editDescription" rows="4" required>${item.description}</textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Rental Duration</label>
                            <input type="number" id="editRentalDuration" value="${item.rentalDuration}" min="1" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Duration Unit</label>
                            <select id="editDurationUnit" required>
                                <option value="hour" ${item.rentalDurationUnit === 'hour' ? 'selected' : ''}>Hour(s)</option>
                                <option value="day" ${item.rentalDurationUnit === 'day' ? 'selected' : ''}>Day(s)</option>
                                <option value="week" ${item.rentalDurationUnit === 'week' ? 'selected' : ''}>Week(s)</option>
                                <option value="month" ${item.rentalDurationUnit === 'month' ? 'selected' : ''}>Month(s)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Price (₱)</label>
                        <input type="number" id="editPrice" value="${item.price}" min="0" step="0.01" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Condition</label>
                        <select id="editCondition" required>
                            <option value="Like New" ${item.condition === 'Like New' ? 'selected' : ''}>Like New</option>
                            <option value="Excellent" ${item.condition === 'Excellent' ? 'selected' : ''}>Excellent</option>
                            <option value="Very Good" ${item.condition === 'Very Good' ? 'selected' : ''}>Very Good</option>
                            <option value="Good" ${item.condition === 'Good' ? 'selected' : ''}>Good</option>
                            <option value="Fair" ${item.condition === 'Fair' ? 'selected' : ''}>Fair</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Availability</label>
                        <select id="editIsRenting" required>
                            <option value="true" ${item.isRenting ? 'selected' : ''}>Available for Rent</option>
                            <option value="false" ${!item.isRenting ? 'selected' : ''}>Not Available</option>
                        </select>
                    </div>
                </form>
            </div>
            
            <div class="modal-footer">
                <button class="btn-secondary" onclick="viewItemReceipts(${item.itemId})">View Receipt History</button>
                <div class="modal-actions">
                    <button class="btn-cancel" onclick="closeManageItemModal()">Cancel</button>
                    <button class="btn-save" onclick="saveItemChanges(${item.itemId})">Save Changes</button>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Close manage item modal
window.closeManageItemModal = function() {
    const modal = document.getElementById('itemModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// Save item changes
window.saveItemChanges = async function(itemId) {
    console.log('💾 Saving changes for item:', itemId);
    
    // Get form values
    const itemName = document.getElementById('editItemName').value.trim();
    const description = document.getElementById('editDescription').value.trim();
    const rentalDuration = parseInt(document.getElementById('editRentalDuration').value);
    const rentalDurationUnit = document.getElementById('editDurationUnit').value;
    const price = parseFloat(document.getElementById('editPrice').value);
    const condition = document.getElementById('editCondition').value;
    const isRenting = document.getElementById('editIsRenting').value === 'true';
    
    // Validation
    if (!itemName || !description || !rentalDuration || !price) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (rentalDuration <= 0) {
        alert('Rental duration must be greater than 0');
        return;
    }
    
    if (price < 0) {
        alert('Price cannot be negative');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/items/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                itemName,
                description,
                rentalDuration,
                rentalDurationUnit,
                price,
                condition,
                isRenting
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Item updated successfully!');
            closeManageItemModal();
            // Reload items to show updated data
            loadUserItems();
        } else {
            alert('Failed to update item: ' + result.message);
        }
    } catch (error) {
        console.error('Error updating item:', error);
        alert('Failed to update item. Please try again.');
    }
};

// View item receipts
window.viewItemReceipts = function(itemId) {
    console.log('📄 Viewing receipts for item:', itemId);
    closeManageItemModal();
    // Redirect to receipts page with item filter (you can implement filtering later)
    window.location.href = 'receipts.html';
};

// NEW: View renting item details
window.viewRentingItem = async function(itemId, receiptId) {
    console.log('🔍 Viewing renting item:', itemId, 'Receipt:', receiptId);
    
    try {
        // Fetch item details
        const itemResponse = await fetch(`${API_URL}/items/${itemId}`);
        const itemData = await itemResponse.json();
        
        // Fetch receipt details
        const receiptResponse = await fetch(`${API_URL}/receipts/${receiptId}`);
        const receiptData = await receiptResponse.json();
        
        if (itemData.success && receiptData.success) {
            const item = itemData.data;
            const receipt = receiptData.data;
            
            openItemViewModal(item, receipt, true); // true = is renter
        } else {
            alert('Failed to load item details');
        }
    } catch (error) {
        console.error('Error loading item:', error);
        alert('Failed to load item details');
    }
};

// Open item view modal
function openItemViewModal(item, receipt, isRenter) {
    let modal = document.getElementById('itemViewModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'itemViewModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    // Calculate days remaining
    const endDate = new Date(receipt.rentalEndDate);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    const isActive = receipt.status === 'active';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Item Details</h2>
                <button class="modal-close" onclick="closeItemViewModal()">&times;</button>
            </div>
            
            <div class="modal-body">
                <div class="item-details">
                    <div class="item-image-large">
                        ${item.imageUrl ? 
                            `<img src="${item.imageUrl}" alt="${item.itemName}">` :
                            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>`
                        }
                    </div>
                    
                    <div class="item-info-grid">
                        <div class="info-row">
                            <span class="info-label">Item Name:</span>
                            <span class="info-value">${item.itemName}</span>
                        </div>
                        
                        <div class="info-row">
                            <span class="info-label">Description:</span>
                            <span class="info-value">${item.description}</span>
                        </div>
                        
                        <div class="info-row">
                            <span class="info-label">Condition:</span>
                            <span class="info-value">${item.condition}</span>
                        </div>
                        
                        <div class="info-divider"></div>
                        
                        <div class="info-row">
                            <span class="info-label">Receipt ID:</span>
                            <span class="info-value">#${receipt.receiptId}</span>
                        </div>
                        
                        <div class="info-row">
                            <span class="info-label">Rental Period:</span>
                            <span class="info-value">${new Date(receipt.rentalStartDate).toLocaleDateString()} - ${new Date(receipt.rentalEndDate).toLocaleDateString()}</span>
                        </div>
                        
                        <div class="info-row">
                            <span class="info-label">Total Paid:</span>
                            <span class="info-value total-price">₱${parseFloat(receipt.rentalPrice).toFixed(2)}</span>
                        </div>
                        
                        <div class="info-row">
                            <span class="info-label">Status:</span>
                            <span class="info-value">
                                <span class="status-badge status-${receipt.status}">${receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}</span>
                            </span>
                        </div>
                        
                        ${isActive && daysRemaining > 0 ? `
                            <div class="info-row">
                                <span class="info-label">Days Remaining:</span>
                                <span class="info-value days-remaining">${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</span>
                            </div>
                        ` : ''}
                        
                        ${isActive && daysRemaining < 0 ? `
                            <div class="info-row">
                                <span class="info-label">Status:</span>
                                <span class="info-value overdue">⚠️ Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                ${isRenter && isActive ? `
                    <div class="return-section">
                        <p class="return-note">You can return this item early if needed.</p>
                    </div>
                ` : ''}
            </div>
            
            <div class="modal-footer">
                ${isRenter && isActive ? `
                    <button class="btn-danger" onclick="returnItemEarly(${receipt.receiptId}, ${item.itemId})">Return Item Early</button>
                ` : ''}
                <button class="btn-secondary" onclick="closeItemViewModal()">Close</button>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Close item view modal
window.closeItemViewModal = function() {
    const modal = document.getElementById('itemViewModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// Return item early
window.returnItemEarly = async function(receiptId, itemId) {
    if (!confirm('Are you sure you want to return this item early? This action cannot be undone.')) {
        return;
    }
    
    console.log('🔄 Returning item early - Receipt:', receiptId, 'Item:', itemId);
    
    try {
        // Update receipt status to completed
        const receiptResponse = await fetch(`${API_URL}/receipts/${receiptId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'completed' })
        });
        
        const receiptResult = await receiptResponse.json();
        
        if (receiptResult.success) {
            // Update item to be available again
            const itemResponse = await fetch(`${API_URL}/items/${itemId}`);
            const itemData = await itemResponse.json();
            
            if (itemData.success) {
                const item = itemData.data;
                
                const updateResponse = await fetch(`${API_URL}/items/${itemId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ...item,
                        isRented: false,
                        renterId: null
                    })
                });
                
                const updateResult = await updateResponse.json();
                
                if (updateResult.success) {
                    alert('Item returned successfully!');
                    closeItemViewModal();
                    // Reload the page to refresh all data
                    window.location.reload();
                } else {
                    alert('Failed to update item availability');
                }
            }
        } else {
            alert('Failed to return item: ' + receiptResult.message);
        }
    } catch (error) {
        console.error('Error returning item:', error);
        alert('Failed to return item. Please try again.');
    }
};

// Edit profile button
editProfileBtn.addEventListener('click', function() {
    alert('Profile editing will be implemented here');
});

// Add item buttons
addItemBtn.addEventListener('click', function() {
    window.location.href = 'post-item.html';
});

addItemCard.addEventListener('click', function() {
    window.location.href = 'post-item.html';
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Profile page loaded');
    initializeProfile();
});