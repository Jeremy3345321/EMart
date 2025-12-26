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
                    <span class="receipt-id">Receipt #${receipt.receiptId}</span>
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

// View item details
function viewItem(itemId) {
    console.log('🔗 Navigating to item:', itemId);
    // Store item ID and redirect to dashboard
    sessionStorage.setItem('viewItemId', itemId);
    window.location.href = 'dashboard.html';
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Receipts page loaded');
    console.log('👤 Current user:', currentUser);
    fetchReceipts();
});