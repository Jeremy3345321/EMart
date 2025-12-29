// dashboard.js

// Check if user is logged in
const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');

if (!currentUser) {
    window.location.href = 'login.html';
}

// Map HTML category names to backend tag names
const categoryMap = {
    'All': 'All',
    'Electronics': 'Electronics',
    'Clothing': 'Fashion & Apparel',
    'Home & Kitchen': 'Home & Garden',
    'Books': 'Books & Media',
    'Sports': 'Sports & Outdoors',
    'Toys & Games': 'Toys & Hobbies',
    'Beauty': 'Cosmetics',
    'Groceries': 'Party & Events',
    'Automotive': 'Automotive',
    'Office': 'Office & School'
};

// Dropdown menu toggle
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

// Menu navigation
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

// Product Modal Elements
const productModal = document.getElementById('productModal');
const closeModalBtn = document.getElementById('closeModal');
const modalProductName = document.getElementById('modalProductName');
const modalProductPrice = document.getElementById('modalProductPrice');
const modalProductStars = document.getElementById('modalProductStars');
const modalProductRating = document.getElementById('modalProductRating');
const modalProductDescription = document.getElementById('modalProductDescription');
const modalProductOwner = document.getElementById('modalProductOwner');
const modalProductCategory = document.getElementById('modalProductCategory');
const modalProductCondition = document.getElementById('modalProductCondition');
const modalProductAvailability = document.getElementById('modalProductAvailability');
const modalAddToCart = document.getElementById('modalAddToCart');
const modalBuyNow = document.getElementById('modalBuyNow');

// Global variables
let currentCategory = 'All';
let currentProduct = null; // Store current product being viewed

// Load products with optional category filter
async function loadProducts(categoryName = 'All') {
    try {
        currentCategory = categoryName;
        const backendTag = categoryMap[categoryName] || categoryName;
        
        let url = 'http://localhost:3000/api/items/available';
        if (backendTag !== 'All') {
            url += `?tag=${encodeURIComponent(backendTag)}`;
        }
        
        console.log(`Loading products for category: ${categoryName} (backend: ${backendTag})`);
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            const productsGrid = document.getElementById('productsGrid');
            productsGrid.innerHTML = '';

            if (data.data.length === 0) {
                productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">No items found in this category.</p>';
                return;
            }

            data.data.forEach(item => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.setAttribute('data-item-id', item.itemId);
                
                productCard.innerHTML = `
                    <div class="product-image">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                    </div>
                    <div class="product-info">
                        <div class="product-name">${item.itemName}</div>
                        <div class="product-price">₱${parseFloat(item.price).toFixed(2)}</div>
                        <div class="product-rating">
                            <span class="stars">★★★★★</span>
                            <span>(0)</span>
                        </div>
                        <button class="add-to-cart">Add to Cart</button>
                    </div>
                `;
                
                // Click card to open modal
                productCard.addEventListener('click', function(e) {
                    if (!e.target.classList.contains('add-to-cart')) {
                        openProductModal(item);
                    }
                });
                
                // Add to cart from product card
                productCard.querySelector('.add-to-cart').addEventListener('click', async function(e) {
                    e.stopPropagation();
                    await addItemToCart(item);
                });
                
                productsGrid.appendChild(productCard);
            });
            
            console.log(`✅ Loaded ${data.data.length} products`);
        }
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Failed to load products. Please check the console for details.');
    }
}

// Category navigation
document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        const category = this.textContent.trim();
        loadProducts(category);
    });
});

// Set "All" as active by default
document.querySelector('.category-item').classList.add('active');
loadProducts('All');

// Open product modal
async function openProductModal(product) {
    currentProduct = product; // Store current product
    
    modalProductName.textContent = product.itemName;
    modalProductPrice.textContent = `₱${parseFloat(product.price).toFixed(2)}`;
    modalProductDescription.textContent = product.description || 'No description available.';
    modalProductCondition.textContent = product.condition;
    modalProductCategory.textContent = product.tags.join(', ') || 'Uncategorized';
    
    // Fetch owner information
    try {
        const response = await fetch(`http://localhost:3000/api/users/${product.ownerId}`);
        const userData = await response.json();
        if (userData.success) {
            modalProductOwner.textContent = userData.data.username;
            product.ownerUsername = userData.data.username; // Store for cart
        } else {
            modalProductOwner.textContent = 'Unknown';
            product.ownerUsername = 'Unknown';
        }
    } catch (error) {
        console.error('Error fetching owner info:', error);
        modalProductOwner.textContent = 'Unknown';
        product.ownerUsername = 'Unknown';
    }
    
    // Set availability
    if (product.isRented) {
        modalProductAvailability.textContent = 'Currently Rented';
        modalProductAvailability.style.color = '#d32f2f';
        modalAddToCart.disabled = true;
        modalBuyNow.disabled = true;
    } else if (product.isRenting) {
        modalProductAvailability.textContent = 'Available';
        modalProductAvailability.style.color = '#388e3c';
        modalAddToCart.disabled = false;
        modalBuyNow.disabled = false;
    } else {
        modalProductAvailability.textContent = 'Not Available';
        modalProductAvailability.style.color = '#d32f2f';
        modalAddToCart.disabled = true;
        modalBuyNow.disabled = true;
    }
    
    productModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Close product modal
function closeProductModal() {
    productModal.classList.remove('show');
    document.body.style.overflow = '';
    currentProduct = null;
}

closeModalBtn.addEventListener('click', closeProductModal);

productModal.addEventListener('click', function(e) {
    if (e.target === productModal) {
        closeProductModal();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && productModal.classList.contains('show')) {
        closeProductModal();
    }
});

// Add item to cart function
async function addItemToCart(product) {
    // Check if item is available
    if (product.isRented || !product.isRenting) {
        alert('This item is not available for rent at the moment.');
        return;
    }
    
    // Check if user is trying to add their own item
    if (product.ownerId === currentUser.userId) {
        alert('You cannot add your own item to the cart.');
        return;
    }
    
    try {
        // Add to cart using cartManager
        cartManager.addToCart(product);
        
        // Show success message
        showToast('Item added to cart successfully!');
        
        console.log(`✅ Added ${product.itemName} to cart`);
    } catch (error) {
        console.error('Error adding to cart:', error);
        console.log('Error adding to cart:', error);
        alert('Failed to add item to cart. Please try again.');
    }
}

// Toast notification function
function showToast(message, duration = 3000) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Modal action buttons
modalAddToCart.addEventListener('click', async function() {
    if (currentProduct) {
        await addItemToCart(currentProduct);
        closeProductModal();
    }
});

modalBuyNow.addEventListener('click', function() {
    if (currentProduct) {
        addItemToCart(currentProduct);
        setTimeout(() => {
            window.location.href = 'cart.html';
        }, 500);
    }
});