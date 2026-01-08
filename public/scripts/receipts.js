// receipts.js

// Check if user is logged in - FIXED: Check sessionStorage instead of localStorage
const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
console.log('🔍 Checking user authentication...');
console.log('Current user:', currentUser);

if (!currentUser) {
    console.log('❌ No user found in sessionStorage - redirecting to login');
    window.location.href = 'login.html';
} else {
    console.log('✅ User authenticated:', currentUser.username);
}

// API Base URL
const API_URL = 'http://localhost:3000/api';

// DOM Elements
const rentingTab = document.getElementById('rentingTab');
const rentedTab = document.getElementById('rentedTab');
const rentingGrid = document.getElementById('rentingGrid');
const rentedGrid = document.getElementById('rentedGrid');
const tabButtons = document.querySelectorAll('.tab-btn');

// Tab counts
const rentingCount = document.getElementById('rentingCount');
const rentedCount = document.getElementById('rentedCount');

// Summary elements
const totalRenting = document.getElementById('totalRenting');
const totalSpent = document.getElementById('totalSpent');
const totalRented = document.getElementById('totalRented');
const totalEarnings = document.getElementById('totalEarnings');

// Dropdown menu
const menuBtn = document.getElementById('menuBtn');
const dropdownMenu = document.getElementById('dropdownMenu');

// Toggle dropdown
menuBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove('show');
    }
});

// Dropdown menu actions
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
    sessionStorage.removeItem('currentUser');
    console.log('🚪 User logged out');
    window.location.href = 'login.html';
});

document.getElementById('cartBtn').addEventListener('click', function() {
    window.location.href = 'cart.html';
});

// Tab switching
tabButtons.forEach(button => {
    button.addEventListener('click', function() {
        const tabName = this.dataset.tab;
        
        // Remove active class from all tabs
        tabButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Add active class to clicked tab
        this.classList.add('active');
        
        if (tabName === 'renting') {
            rentingTab.classList.add('active');
        } else if (tabName === 'rented') {
            rentedTab.classList.add('active');
        }
    });
});

// Fetch receipts data
async function fetchReceipts() {
    console.log('📦 Fetching receipts for user ID:', currentUser.userId);
    
    try {
        // Fetch receipts where user is the renter (items they're renting)
        console.log('🔍 Fetching renting receipts...');
        const rentingResponse = await fetch(`${API_URL}/receipts/renter/${currentUser.userId}`);
        const rentingData = await rentingResponse.json();
        console.log('📥 Renting receipts response:', rentingData);
        
        // Fetch receipts where user is the owner (items being rented from them)
        console.log('🔍 Fetching rented receipts...');
        const rentedResponse = await fetch(`${API_URL}/receipts/owner/${currentUser.userId}`);
        const rentedData = await rentedResponse.json();
        console.log('📥 Rented receipts response:', rentedData);
        
        if (rentingData.success) {
            console.log('✅ Processing renting receipts:', rentingData.data.length, 'items');
            displayRentingReceipts(rentingData.data);
        } else {
            console.log('⚠️ No renting receipts found');
            rentingGrid.innerHTML = '<p class="empty-message">No rental history found</p>';
        }
        
        if (rentedData.success) {
            console.log('✅ Processing rented receipts:', rentedData.data.length, 'items');
            displayRentedReceipts(rentedData.data);
        } else {
            console.log('⚠️ No rented receipts found');
            rentedGrid.innerHTML = '<p class="empty-message">No items being rented from you</p>';
        }
        
    } catch (error) {
        console.error('❌ Error fetching receipts:', error);
        rentingGrid.innerHTML = '<p class="empty-message">Error loading receipts</p>';
        rentedGrid.innerHTML = '<p class="empty-message">Error loading receipts</p>';
    }
}

// Display receipts where user is renting from others
async function displayRentingReceipts(receipts) {
    console.log('🎨 Displaying renting receipts:', receipts.length);
    
    if (!receipts || receipts.length === 0) {
        rentingGrid.innerHTML = '<p class="empty-message">You haven\'t rented any items yet</p>';
        rentingCount.textContent = '0';
        totalRenting.textContent = '0';
        totalSpent.textContent = '₱0.00';
        return;
    }
    
    rentingCount.textContent = receipts.length;
    totalRenting.textContent = receipts.length;
    
    // Calculate total spent
    const spent = receipts.reduce((sum, receipt) => sum + parseFloat(receipt.rentalPrice || 0), 0);
    totalSpent.textContent = `₱${spent.toFixed(2)}`;
    console.log('💰 Total spent:', spent);
    
    // Fetch item details for each receipt
    console.log('🔍 Fetching item details for receipts...');
    const receiptsWithItems = await Promise.all(
        receipts.map(async (receipt) => {
            try {
                const itemResponse = await fetch(`${API_URL}/items/${receipt.itemId}`);
                const itemData = await itemResponse.json();
                const itemName = itemData.success ? itemData.data.itemName : 'Unknown Item';
                console.log(`✅ Item ${receipt.itemId}: ${itemName}`);
                return {
                    ...receipt,
                    itemName
                };
            } catch (error) {
                console.error(`❌ Error fetching item ${receipt.itemId}:`, error);
                return {
                    ...receipt,
                    itemName: 'Unknown Item'
                };
            }
        })
    );
    
    rentingGrid.innerHTML = receiptsWithItems.map(receipt => createReceiptCard(receipt, 'renting')).join('');
    console.log('✅ Renting receipts displayed');
}

// Display receipts where items are being rented from user
async function displayRentedReceipts(receipts) {
    console.log('🎨 Displaying rented receipts:', receipts.length);
    
    if (!receipts || receipts.length === 0) {
        rentedGrid.innerHTML = '<p class="empty-message">No items are being rented from you</p>';
        rentedCount.textContent = '0';
        totalRented.textContent = '0';
        totalEarnings.textContent = '₱0.00';
        return;
    }
    
    rentedCount.textContent = receipts.length;
    totalRented.textContent = receipts.length;
    
    // Calculate total earnings
    const earnings = receipts.reduce((sum, receipt) => sum + parseFloat(receipt.rentalPrice || 0), 0);
    totalEarnings.textContent = `₱${earnings.toFixed(2)}`;
    console.log('💰 Total earnings:', earnings);
    
    // Fetch item details for each receipt
    console.log('🔍 Fetching item details for receipts...');
    const receiptsWithItems = await Promise.all(
        receipts.map(async (receipt) => {
            try {
                const itemResponse = await fetch(`${API_URL}/items/${receipt.itemId}`);
                const itemData = await itemResponse.json();
                const itemName = itemData.success ? itemData.data.itemName : 'Unknown Item';
                console.log(`✅ Item ${receipt.itemId}: ${itemName}`);
                return {
                    ...receipt,
                    itemName
                };
            } catch (error) {
                console.error(`❌ Error fetching item ${receipt.itemId}:`, error);
                return {
                    ...receipt,
                    itemName: 'Unknown Item'
                };
            }
        })
    );
    
    rentedGrid.innerHTML = receiptsWithItems.map(receipt => createReceiptCard(receipt, 'rented')).join('');
    console.log('✅ Rented receipts displayed');
}

// Create receipt card HTML
function createReceiptCard(receipt, type) {
    const statusClass = `status-${receipt.status}`;
    const statusText = receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1);
    
    // Format dates
    const startDate = new Date(receipt.rentalStartDate).toLocaleDateString();
    const endDate = new Date(receipt.rentalEndDate).toLocaleDateString();
    const createdDate = new Date(receipt.createdAt).toLocaleDateString();
    
    // Calculate rental duration
    const start = new Date(receipt.rentalStartDate);
    const end = new Date(receipt.rentalEndDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    return `
        <div class="receipt-card">
            <div class="receipt-header">
                <div class="receipt-info">
                    <h3>${receipt.itemName}</h3>
                </div>
                <span class="receipt-status ${statusClass}">${statusText}</span>
            </div>
            
            <div class="receipt-body">
                <div class="receipt-field">
                    <span class="field-label">Rental Period</span>
                    <span class="field-value">${days} day${days !== 1 ? 's' : ''}</span>
                </div>
                <div class="receipt-field">
                    <span class="field-label">Start Date</span>
                    <span class="field-value">${startDate}</span>
                </div>
                <div class="receipt-field">
                    <span class="field-label">End Date</span>
                    <span class="field-value">${endDate}</span>
                </div>
                <div class="receipt-field">
                    <span class="field-label">Price</span>
                    <span class="field-value receipt-price">₱${parseFloat(receipt.rentalPrice).toFixed(2)}</span>
                </div>
                ${type === 'rented' ? `
                <div class="receipt-field">
                    <span class="field-label">Renter ID</span>
                    <span class="field-value">#${receipt.renterId}</span>
                </div>
                ` : `
                <div class="receipt-field">
                    <span class="field-label">Owner ID</span>
                    <span class="field-value">#${receipt.ownerId}</span>
                </div>
                `}
            </div>
            
            <div class="receipt-footer">
                <span class="receipt-date">Created: ${createdDate}</span>
                <div class="receipt-actions">
                    <button class="btn-view-item" onclick="viewItem(${receipt.itemId})">View Item</button>
                </div>
            </div>
        </div>
    `;
}

// Add this to receipts.js (replace the existing viewItem function)

// Modal elements
const modal = document.getElementById('itemReceiptModal');
const modalLoading = document.getElementById('modalLoading');
const modalContent = document.getElementById('modalContent');
const closeModalBtn = document.getElementById('closeModal');
const closeModalBtnFooter = document.getElementById('closeModalBtn');
const viewFullItemBtn = document.getElementById('viewFullItem');

let currentItemId = null;
let currentReceiptData = null;

// Close modal when clicking close button
closeModalBtn.addEventListener('click', closeModal);
closeModalBtnFooter.addEventListener('click', closeModal);

// Close modal when clicking outside
modal.addEventListener('click', function(e) {
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
    }
});

// View full item on dashboard
viewFullItemBtn.addEventListener('click', function() {
    if (currentItemId) {
        sessionStorage.setItem('viewItemId', currentItemId);
        window.location.href = 'dashboard.html';
    }
});

// View item details - Updated function
async function viewItem(itemId, receipt = null) {
    console.log('🔍 Opening modal for item:', itemId);
    currentItemId = itemId;
    
    // Find receipt data from the displayed receipts
    if (!receipt) {
        // Try to find receipt in current tab
        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        const receiptCard = event.target.closest('.receipt-card');
        
        // Extract receipt data from the card
        receipt = extractReceiptDataFromCard(receiptCard);
    }
    
    currentReceiptData = receipt;
    
    // Show modal
    modal.classList.add('active');
    modalLoading.style.display = 'flex';
    modalContent.style.display = 'none';
    document.body.style.overflow = 'hidden';
    
    try {
        // Fetch item details
        const itemResponse = await fetch(`${API_URL}/items/${itemId}`);
        const itemData = await itemResponse.json();
        
        if (!itemData.success) {
            throw new Error('Failed to load item details');
        }
        
        // Populate modal with data
        populateModal(itemData.data, receipt);
        
        // Show content
        modalLoading.style.display = 'none';
        modalContent.style.display = 'block';
        
    } catch (error) {
        console.error('❌ Error loading item details:', error);
        modalLoading.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 40px; height: 40px; color: #e74c3c;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <p class="modal-loading-text" style="color: #e74c3c;">Failed to load item details</p>
        `;
    }
}

// Extract receipt data from card HTML
function extractReceiptDataFromCard(card) {
    if (!card) return null;
    
    const fields = card.querySelectorAll('.receipt-field');
    const receipt = {
        itemName: card.querySelector('h3').textContent,
        status: card.querySelector('.receipt-status').textContent.toLowerCase(),
        rentalPrice: 0,
        rentalStartDate: '',
        rentalEndDate: '',
        createdAt: card.querySelector('.receipt-date').textContent.replace('Created: ', '')
    };
    
    fields.forEach(field => {
        const label = field.querySelector('.field-label').textContent;
        const value = field.querySelector('.field-value').textContent;
        
        if (label.includes('Price')) {
            receipt.rentalPrice = parseFloat(value.replace('₱', '').replace(',', ''));
        } else if (label.includes('Start Date')) {
            receipt.rentalStartDate = value;
        } else if (label.includes('End Date')) {
            receipt.rentalEndDate = value;
        } else if (label.includes('Rental Period')) {
            receipt.rentalDuration = value;
        } else if (label.includes('Renter ID')) {
            receipt.renterId = value.replace('#', '');
        } else if (label.includes('Owner ID')) {
            receipt.ownerId = value.replace('#', '');
        }
    });
    
    return receipt;
}

// Populate modal with item and receipt data
function populateModal(item, receipt) {
    // Item Information
    const itemImage = document.getElementById('modalItemImage');
    itemImage.src = item.imageUrl || 'images/placeholder.png';
    itemImage.alt = item.itemName;
    
    document.getElementById('modalItemName').textContent = item.itemName;
    document.getElementById('modalItemDescription').textContent = item.description || 'No description available';
    document.getElementById('modalItemPrice').textContent = `₱${parseFloat(item.price).toFixed(2)}`;
    document.getElementById('modalItemDuration').textContent = item.formattedDuration || `${item.rentalDuration} ${item.rentalDurationUnit}(s)`;
    document.getElementById('modalItemCondition').textContent = item.condition;
    
    // Rating
    const ratingElement = document.getElementById('modalItemRating');
    if (item.rating && item.rating > 0) {
        ratingElement.innerHTML = `
            <span style="color: #f39c12;">★</span> ${item.rating.toFixed(1)} (${item.ratingCount} reviews)
        `;
    } else {
        ratingElement.textContent = 'No ratings yet';
    }
    
    document.getElementById('modalItemOwner').textContent = `#${item.ownerId}`;
    
    // Tags
    const tagsContainer = document.getElementById('modalItemTags');
    if (item.tags && item.tags.length > 0) {
        tagsContainer.innerHTML = item.tags.map(tag => 
            `<span class="modal-tag">${tag}</span>`
        ).join('');
    } else {
        tagsContainer.innerHTML = '';
    }
    
    // Receipt Information
    if (receipt) {
        document.getElementById('modalReceiptId').textContent = `#${receipt.receiptId || 'N/A'}`;
        document.getElementById('modalReceiptPrice').textContent = `₱${parseFloat(receipt.rentalPrice || 0).toFixed(2)}`;
        document.getElementById('modalReceiptStart').textContent = formatDate(receipt.rentalStartDate);
        document.getElementById('modalReceiptEnd').textContent = formatDate(receipt.rentalEndDate);
        document.getElementById('modalReceiptDuration').textContent = receipt.rentalDuration || calculateDuration(receipt.rentalStartDate, receipt.rentalEndDate);
        document.getElementById('modalReceiptCreated').textContent = formatDate(receipt.createdAt);
        
        // Status
        const statusElement = document.getElementById('modalReceiptStatus');
        const status = receipt.status || 'active';
        statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        statusElement.className = `modal-status-badge status-${status}`;
    }
}

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Helper function to calculate duration
function calculateDuration(startDate, endDate) {
    if (!startDate || !endDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''}`;
}

// Close modal function
function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    currentItemId = null;
    currentReceiptData = null;
}

// Update the createReceiptCard function to pass receipt data
function createReceiptCard(receipt, type) {
    const statusClass = `status-${receipt.status}`;
    const statusText = receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1);
    
    // Format dates
    const startDate = new Date(receipt.rentalStartDate).toLocaleDateString();
    const endDate = new Date(receipt.rentalEndDate).toLocaleDateString();
    const createdDate = new Date(receipt.createdAt).toLocaleDateString();
    
    // Calculate rental duration
    const start = new Date(receipt.rentalStartDate);
    const end = new Date(receipt.rentalEndDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    // Store receipt data as JSON in data attribute
    const receiptJson = JSON.stringify({
        receiptId: receipt.receiptId,
        itemId: receipt.itemId,
        itemName: receipt.itemName,
        ownerId: receipt.ownerId,
        renterId: receipt.renterId,
        rentalStartDate: receipt.rentalStartDate,
        rentalEndDate: receipt.rentalEndDate,
        rentalPrice: receipt.rentalPrice,
        status: receipt.status,
        createdAt: receipt.createdAt,
        rentalDuration: `${days} day${days !== 1 ? 's' : ''}`
    });
    
    return `
        <div class="receipt-card" data-receipt='${receiptJson.replace(/'/g, "&apos;")}'>
            <div class="receipt-header">
                <div class="receipt-info">
                    <h3>${receipt.itemName}</h3>
                </div>
                <span class="receipt-status ${statusClass}">${statusText}</span>
            </div>
            
            <div class="receipt-body">
                <div class="receipt-field">
                    <span class="field-label">Rental Period</span>
                    <span class="field-value">${days} day${days !== 1 ? 's' : ''}</span>
                </div>
                <div class="receipt-field">
                    <span class="field-label">Start Date</span>
                    <span class="field-value">${startDate}</span>
                </div>
                <div class="receipt-field">
                    <span class="field-label">End Date</span>
                    <span class="field-value">${endDate}</span>
                </div>
                <div class="receipt-field">
                    <span class="field-label">Price</span>
                    <span class="field-value receipt-price">₱${parseFloat(receipt.rentalPrice).toFixed(2)}</span>
                </div>
                ${type === 'rented' ? `
                <div class="receipt-field">
                    <span class="field-label">Renter ID</span>
                    <span class="field-value">#${receipt.renterId}</span>
                </div>
                ` : `
                <div class="receipt-field">
                    <span class="field-label">Owner ID</span>
                    <span class="field-value">#${receipt.ownerId}</span>
                </div>
                `}
            </div>
            
            <div class="receipt-footer">
                <span class="receipt-date">Created: ${createdDate}</span>
                <div class="receipt-actions">
                    <button class="btn-view-item" onclick="viewItemFromCard(this)">View Item</button>
                </div>
            </div>
        </div>
    `;
}


function createReceiptCard(receipt, type) {
    // Normalize the status to ensure compatibility
    const normalizedStatus = normalizeReceiptStatus(receipt.status);
    
    // Use normalized status for everything
    let statusClass = `status-${normalizedStatus.replace(/_/g, '-')}`;
    let statusText = formatStatusText(normalizedStatus);
    
    // Format dates
    const startDate = new Date(receipt.rentalStartDate).toLocaleDateString();
    const endDate = new Date(receipt.rentalEndDate).toLocaleDateString();
    const createdDate = new Date(receipt.createdAt).toLocaleDateString();
    
    // Calculate rental duration
    const start = new Date(receipt.rentalStartDate);
    const end = new Date(receipt.rentalEndDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    // Calculate actual rental days for returned_early status
    let actualDays = days;
    let returnedEarlyInfo = '';
    
    if (normalizedStatus === 'returned_early') {
        const now = new Date();
        const returnDate = receipt.updatedAt ? new Date(receipt.updatedAt) : now;
        actualDays = Math.ceil((returnDate - start) / (1000 * 60 * 60 * 24));
        returnedEarlyInfo = `
            <div class="receipt-field returned-early-info">
                <span class="field-label">Returned After</span>
                <span class="field-value" style="color: #f39c12;">${actualDays} of ${days} day${days !== 1 ? 's' : ''}</span>
            </div>
        `;
    }
    
    // Store receipt data with normalized status
    const receiptJson = JSON.stringify({
        receiptId: receipt.receiptId,
        itemId: receipt.itemId,
        itemName: receipt.itemName,
        ownerId: receipt.ownerId,
        renterId: receipt.renterId,
        rentalStartDate: receipt.rentalStartDate,
        rentalEndDate: receipt.rentalEndDate,
        rentalPrice: receipt.rentalPrice,
        status: normalizedStatus, // Use normalized status
        createdAt: receipt.createdAt,
        updatedAt: receipt.updatedAt,
        rentalDuration: `${days} day${days !== 1 ? 's' : ''}`,
        actualDuration: normalizedStatus === 'returned_early' ? `${actualDays} day${actualDays !== 1 ? 's' : ''}` : null
    });
    
    return `
        <div class="receipt-card ${normalizedStatus === 'returned_early' ? 'returned-early-card' : ''}" data-receipt='${receiptJson.replace(/'/g, "&apos;")}'>
            <div class="receipt-header">
                <div class="receipt-info">
                    <h3>${receipt.itemName}</h3>
                    ${normalizedStatus === 'returned_early' ? '<span class="early-return-badge">📦 Early Return</span>' : ''}
                </div>
                <span class="receipt-status ${statusClass}">${statusText}</span>
            </div>
            
            <div class="receipt-body">
                <div class="receipt-field">
                    <span class="field-label">Rental Period</span>
                    <span class="field-value">${days} day${days !== 1 ? 's' : ''}</span>
                </div>
                ${returnedEarlyInfo}
                <div class="receipt-field">
                    <span class="field-label">Start Date</span>
                    <span class="field-value">${startDate}</span>
                </div>
                <div class="receipt-field">
                    <span class="field-label">End Date</span>
                    <span class="field-value">${endDate}</span>
                </div>
                <div class="receipt-field">
                    <span class="field-label">Price</span>
                    <span class="field-value receipt-price">₱${parseFloat(receipt.rentalPrice).toFixed(2)}</span>
                </div>
                ${type === 'rented' ? `
                <div class="receipt-field">
                    <span class="field-label">Renter ID</span>
                    <span class="field-value">#${receipt.renterId}</span>
                </div>
                ` : `
                <div class="receipt-field">
                    <span class="field-label">Owner ID</span>
                    <span class="field-value">#${receipt.ownerId}</span>
                </div>
                `}
            </div>
            
            <div class="receipt-footer">
                <span class="receipt-date">Created: ${createdDate}</span>
                <div class="receipt-actions">
                    <button class="btn-view-item" onclick="viewItemFromCard(this)">View Item</button>
                </div>
            </div>
        </div>
    `;
}

// Helper function to format status text
function formatStatusText(status) {
    const statusMap = {
        'pending_payment': 'Pending Payment',
        'active': 'Active',
        'completed': 'Completed',
        'cancelled': 'Cancelled',
        'returned_early': 'Returned Early'
    };
    
    return statusMap[status] || status.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Update the populateModal function to show returned_early details
function populateModal(item, receipt) {
    // Item Information
    const itemImage = document.getElementById('modalItemImage');
    itemImage.src = item.imageUrl || 'images/placeholder.png';
    itemImage.alt = item.itemName;
    
    document.getElementById('modalItemName').textContent = item.itemName;
    document.getElementById('modalItemDescription').textContent = item.description || 'No description available';
    document.getElementById('modalItemPrice').textContent = `₱${parseFloat(item.price).toFixed(2)}`;
    document.getElementById('modalItemDuration').textContent = item.formattedDuration || `${item.rentalDuration} ${item.rentalDurationUnit}(s)`;
    document.getElementById('modalItemCondition').textContent = item.condition;
    
    // Rating
    const ratingElement = document.getElementById('modalItemRating');
    if (item.rating && item.rating > 0) {
        ratingElement.innerHTML = `
            <span style="color: #f39c12;">★</span> ${item.rating.toFixed(1)} (${item.ratingCount} reviews)
        `;
    } else {
        ratingElement.textContent = 'No ratings yet';
    }
    
    document.getElementById('modalItemOwner').textContent = `#${item.ownerId}`;
    
    // Tags
    const tagsContainer = document.getElementById('modalItemTags');
    if (item.tags && item.tags.length > 0) {
        tagsContainer.innerHTML = item.tags.map(tag => 
            `<span class="modal-tag">${tag}</span>`
        ).join('');
    } else {
        tagsContainer.innerHTML = '';
    }
    
    // Receipt Information
    if (receipt) {
        document.getElementById('modalReceiptId').textContent = `#${receipt.receiptId || 'N/A'}`;
        document.getElementById('modalReceiptPrice').textContent = `₱${parseFloat(receipt.rentalPrice || 0).toFixed(2)}`;
        document.getElementById('modalReceiptStart').textContent = formatDate(receipt.rentalStartDate);
        document.getElementById('modalReceiptEnd').textContent = formatDate(receipt.rentalEndDate);
        
        // Calculate and display duration (with actual duration if returned early)
        const plannedDuration = calculateDuration(receipt.rentalStartDate, receipt.rentalEndDate);
        let durationText = plannedDuration;
        
        if (receipt.status === 'returned_early' && receipt.actualDuration) {
            durationText = `${receipt.actualDuration} (planned: ${plannedDuration})`;
        }
        
        document.getElementById('modalReceiptDuration').textContent = durationText;
        document.getElementById('modalReceiptCreated').textContent = formatDate(receipt.createdAt);
        
        // Status with special formatting for returned_early
        const statusElement = document.getElementById('modalReceiptStatus');
        const status = receipt.status || 'active';
        const formattedStatus = formatStatusText(status);
        
        statusElement.textContent = formattedStatus;
        statusElement.className = `modal-status-badge status-${status.replace(/_/g, '-')}`;
        
        // Add returned early notice in modal if applicable
        if (status === 'returned_early') {
            const modalBody = document.querySelector('#modalContent .modal-receipt-section');
            
            // Remove existing notice if any
            const existingNotice = modalBody.querySelector('.early-return-notice');
            if (existingNotice) {
                existingNotice.remove();
            }
            
            // Add new notice
            const notice = document.createElement('div');
            notice.className = 'early-return-notice';
            notice.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div>
                    <strong>Item Returned Early</strong>
                    <p>This item was returned before the rental period ended. Refunds may have been processed according to the early return policy.</p>
                </div>
            `;
            modalBody.appendChild(notice);
        }
    }
}

// Add status filter buttons after fetchReceipts function
function addStatusFilters() {
    // Get both tab content areas
    const rentingTab = document.getElementById('rentingTab');
    const rentedTab = document.getElementById('rentedTab');
    
    // Create filter HTML
    const filterHTML = `
        <div class="status-filters">
            <button class="status-filter-btn active" data-status="all">
                All
                <span class="filter-count">0</span>
            </button>
            <button class="status-filter-btn" data-status="active">
                Active
                <span class="filter-count">0</span>
            </button>
            <button class="status-filter-btn" data-status="completed">
                Completed
                <span class="filter-count">0</span>
            </button>
            <button class="status-filter-btn" data-status="returned_early">
                Returned Early
                <span class="filter-count">0</span>
            </button>
            <button class="status-filter-btn" data-status="cancelled">
                Cancelled
                <span class="filter-count">0</span>
            </button>
        </div>
    `;
    
    // Insert filters before the grids (after summary card)
    const rentingSummary = rentingTab.querySelector('.summary-card');
    const rentedSummary = rentedTab.querySelector('.summary-card');
    
    if (rentingSummary && !rentingTab.querySelector('.status-filters')) {
        rentingSummary.insertAdjacentHTML('afterend', filterHTML);
    }
    
    if (rentedSummary && !rentedTab.querySelector('.status-filters')) {
        rentedSummary.insertAdjacentHTML('afterend', filterHTML);
    }
    
    // Add event listeners to filter buttons
    document.querySelectorAll('.status-filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const status = this.dataset.status;
            const parentTab = this.closest('.tab-content');
            const isRentingTab = parentTab.id === 'rentingTab';
            
            // Update active state
            parentTab.querySelectorAll('.status-filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Filter receipts
            filterReceiptsByStatus(status, isRentingTab);
        });
    });
}

function normalizeReceiptStatus(status) {
    // Map any payment/refund statuses back to receipt statuses
    const statusMap = {
        'succeeded': 'returned_early',
        'pending': 'pending_payment',
        'failed': 'cancelled'
    };
    
    return statusMap[status] || status;
}

// Filter receipts by status
function filterReceiptsByStatus(status, isRentingTab) {
    const grid = isRentingTab ? rentingGrid : rentedGrid;
    const allCards = grid.querySelectorAll('.receipt-card');
    
    let visibleCount = 0;
    
    allCards.forEach(card => {
        const receiptData = JSON.parse(card.dataset.receipt);
        
        if (status === 'all' || receiptData.status === status) {
            card.style.display = 'block';
            visibleCount++;
            // Animate in
            card.style.animation = 'fadeIn 0.3s ease-out';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Show empty message if no receipts match filter
    const existingEmpty = grid.querySelector('.filter-empty-message');
    if (existingEmpty) {
        existingEmpty.remove();
    }
    
    if (visibleCount === 0 && allCards.length > 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'filter-empty-message';
        emptyMsg.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 60px; height: 60px; color: #95a5a6;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3>No ${formatStatusText(status)} Receipts</h3>
            <p>Try selecting a different filter</p>
        `;
        grid.appendChild(emptyMsg);
    }
}

// Update filter counts
function updateFilterCounts(receipts, isRentingTab) {
    const parentTab = isRentingTab ? rentingTab : rentedTab;
    const filterButtons = parentTab.querySelectorAll('.status-filter-btn');
    
    // Count receipts by status
    const counts = {
        all: receipts.length,
        active: 0,
        completed: 0,
        returned_early: 0,
        cancelled: 0,
        pending_payment: 0
    };
    
    receipts.forEach(receipt => {
        if (counts.hasOwnProperty(receipt.status)) {
            counts[receipt.status]++;
        }
    });
    
    // Update button counts
    filterButtons.forEach(btn => {
        const status = btn.dataset.status;
        const countSpan = btn.querySelector('.filter-count');
        if (countSpan && counts.hasOwnProperty(status)) {
            countSpan.textContent = counts[status];
            
            // Highlight if there are items
            if (counts[status] > 0) {
                countSpan.classList.add('has-items');
            }
        }
    });
}

// Update displayRentingReceipts to include filters
async function displayRentingReceipts(receipts) {
    console.log('🎨 Displaying renting receipts:', receipts.length);
    
    if (!receipts || receipts.length === 0) {
        rentingGrid.innerHTML = '<p class="empty-message">You haven\'t rented any items yet</p>';
        rentingCount.textContent = '0';
        totalRenting.textContent = '0';
        totalSpent.textContent = '₱0.00';
        return;
    }
    
    rentingCount.textContent = receipts.length;
    totalRenting.textContent = receipts.length;
    
    // Calculate total spent
    const spent = receipts.reduce((sum, receipt) => sum + parseFloat(receipt.rentalPrice || 0), 0);
    totalSpent.textContent = `₱${spent.toFixed(2)}`;
    console.log('💰 Total spent:', spent);
    
    // Fetch item details for each receipt
    console.log('🔍 Fetching item details for receipts...');
    const receiptsWithItems = await Promise.all(
        receipts.map(async (receipt) => {
            try {
                const itemResponse = await fetch(`${API_URL}/items/${receipt.itemId}`);
                const itemData = await itemResponse.json();
                const itemName = itemData.success ? itemData.data.itemName : 'Unknown Item';
                console.log(`✅ Item ${receipt.itemId}: ${itemName}`);
                return {
                    ...receipt,
                    itemName
                };
            } catch (error) {
                console.error(`❌ Error fetching item ${receipt.itemId}:`, error);
                return {
                    ...receipt,
                    itemName: 'Unknown Item'
                };
            }
        })
    );
    
    rentingGrid.innerHTML = receiptsWithItems.map(receipt => createReceiptCard(receipt, 'renting')).join('');
    
    // Add filters and update counts
    addStatusFilters();
    updateFilterCounts(receiptsWithItems, true);
    
    console.log('✅ Renting receipts displayed with filters');
}

// Update displayRentedReceipts similarly
async function displayRentedReceipts(receipts) {
    console.log('🎨 Displaying rented receipts:', receipts.length);
    
    if (!receipts || receipts.length === 0) {
        rentedGrid.innerHTML = '<p class="empty-message">No items are being rented from you</p>';
        rentedCount.textContent = '0';
        totalRented.textContent = '0';
        totalEarnings.textContent = '₱0.00';
        return;
    }
    
    rentedCount.textContent = receipts.length;
    totalRented.textContent = receipts.length;
    
    // Calculate total earnings
    const earnings = receipts.reduce((sum, receipt) => sum + parseFloat(receipt.rentalPrice || 0), 0);
    totalEarnings.textContent = `₱${earnings.toFixed(2)}`;
    console.log('💰 Total earnings:', earnings);
    
    // Fetch item details for each receipt
    console.log('🔍 Fetching item details for receipts...');
    const receiptsWithItems = await Promise.all(
        receipts.map(async (receipt) => {
            try {
                const itemResponse = await fetch(`${API_URL}/items/${receipt.itemId}`);
                const itemData = await itemResponse.json();
                const itemName = itemData.success ? itemData.data.itemName : 'Unknown Item';
                console.log(`✅ Item ${receipt.itemId}: ${itemName}`);
                return {
                    ...receipt,
                    itemName
                };
            } catch (error) {
                console.error(`❌ Error fetching item ${receipt.itemId}:`, error);
                return {
                    ...receipt,
                    itemName: 'Unknown Item'
                };
            }
        })
    );
    
    rentedGrid.innerHTML = receiptsWithItems.map(receipt => createReceiptCard(receipt, 'rented')).join('');
    
    // Add filters and update counts
    addStatusFilters();
    updateFilterCounts(receiptsWithItems, false);
    
    console.log('✅ Rented receipts displayed with filters');
}

// New function to handle view item from card
function viewItemFromCard(button) {
    const card = button.closest('.receipt-card');
    const receiptData = JSON.parse(card.dataset.receipt);
    viewItem(receiptData.itemId, receiptData);
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Receipts page loaded');
    console.log('👤 Current user:', currentUser);
    fetchReceipts();
});