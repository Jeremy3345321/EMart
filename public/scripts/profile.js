// profile.js

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
const totalItems = document.getElementById('totalItems');
const availableItems = document.getElementById('availableItems');
const rentedOutItems = document.getElementById('rentedOutItems');
const itemsGrid = document.getElementById('itemsGrid');
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
}

// Load user's items
async function loadUserItems() {
    console.log('📦 Loading items for user:', currentUser.userId);
    
    try {
        const response = await fetch(`${API_URL}/items/owner/${currentUser.userId}`);
        const data = await response.json();
        
        if (data.success) {
            const items = data.data;
            console.log('✅ Loaded items:', items);
            
            // Update stats
            totalItems.textContent = items.length;
            
            const available = items.filter(item => item.isRenting && !item.isRented).length;
            const rented = items.filter(item => item.isRented).length;
            
            availableItems.textContent = available;
            rentedOutItems.textContent = rented;
            
            // Display items
            displayUserItems(items);
        } else {
            console.error('Failed to load items:', data.message);
            displayEmptyState();
        }
    } catch (error) {
        console.error('❌ Error loading items:', error);
        displayEmptyState();
    }
}

// Display user items
async function displayUserItems(items) {
    // Clear grid except add card
    itemsGrid.innerHTML = '';
    itemsGrid.appendChild(addItemCard);
    
    if (items.length === 0) {
        displayEmptyState();
        return;
    }
    
    // Fetch full item details for each item
    for (const item of items) {
        try {
            const response = await fetch(`${API_URL}/items/${item.itemId}`);
            const itemData = await response.json();
            
            if (itemData.success) {
                const fullItem = itemData.data;
                const itemCard = createItemCard(fullItem);
                itemsGrid.appendChild(itemCard);
            }
        } catch (error) {
            console.error(`Error loading item ${item.itemId}:`, error);
        }
    }
}

// Create item card element
function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    
    const status = item.isRented ? 'Rented Out' : 'Available';
    const statusClass = item.isRented ? 'status-rented' : 'status-available';
    
    card.innerHTML = `
        <div class="item-image">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
        </div>
        <h3 title="${item.itemName}">${item.itemName}</h3>
        <p class="price">₱${parseFloat(item.price).toFixed(2)}</p>
        <span class="item-status ${statusClass}">${status}</span>
        <button class="manage-btn" onclick="manageItem(${item.itemId})">Manage</button>
    `;
    
    return card;
}

// Display empty state
function displayEmptyState() {
    const existingEmpty = itemsGrid.querySelector('.empty-state');
    if (existingEmpty) return;
    
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <h3>No Items Yet</h3>
        <p>Start by posting your first item!</p>
    `;
    
    itemsGrid.appendChild(emptyState);
}

// Manage item function
window.manageItem = function(itemId) {
    console.log('Managing item:', itemId);
    alert(`Item management for item #${itemId} will be implemented here`);
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