// dashboard.js

const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');

if (!currentUser) {
    console.log('❌ No user found, redirecting to login');
    window.location.href = 'login.html';
} else {
    console.log('✅ User logged in:', currentUser.username, 'ID:', currentUser.userId);
}

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
const modalProductImage = document.getElementById('modalProductImage');
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

let currentCategory = 'All';
let currentProduct = null;

// Load products with category filter
async function loadProducts(categoryName = 'All') {
    console.log('='.repeat(50));
    console.log('🔄 LOADING PRODUCTS');
    console.log('Category:', categoryName);
    
    try {
        currentCategory = categoryName;
        const backendTag = categoryMap[categoryName] || categoryName;
        
        let url = 'http://localhost:3000/api/items/available';
        if (backendTag !== 'All') {
            url += `?tag=${encodeURIComponent(backendTag)}`;
        }
        
        console.log('📡 Fetching from:', url);
        
        const response = await fetch(url);
        console.log('📥 Response status:', response.status);
        
        const data = await response.json();
        console.log('📦 Response data:', data);

        if (data.success) {
            const productsGrid = document.getElementById('productsGrid');
            productsGrid.innerHTML = '';

            console.log(`📊 Total items received: ${data.data.length}`);
            
            // Log each item's status
            console.log('📋 Item details:');
            data.data.forEach((item, index) => {
                console.log(`  ${index + 1}. "${item.itemName}":`);
                console.log(`     - isRenting: ${item.isRenting} (type: ${typeof item.isRenting})`);
                console.log(`     - isRented: ${item.isRented} (type: ${typeof item.isRented})`);
                console.log(`     - Owner ID: ${item.ownerId}`);
                console.log(`     - Item ID: ${item.itemId}`);
            });
            
            // Filter with detailed logging
            const availableItems = data.data.filter(item => {
                const rentingCheck = item.isRenting === true || item.isRenting === 1;
                const rentedCheck = item.isRented === false || item.isRented === 0;
                const isAvailable = rentingCheck && rentedCheck;
                
                if (!isAvailable) {
                    console.log(`❌ Filtering OUT "${item.itemName}": isRenting=${item.isRenting}, isRented=${item.isRented}`);
                }
                
                return isAvailable;
            });

            console.log(`✅ Items after filter: ${availableItems.length}`);

            if (availableItems.length === 0) {
                console.log('⚠️ No items to display after filtering');
                productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">No items available in this category.</p>';
                return;
            }

            console.log('🎨 Rendering product cards...');
            availableItems.forEach(item => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.setAttribute('data-item-id', item.itemId);
                
                const hasImage = item.imageUrl && item.imageUrl.trim() !== '';
                
                productCard.innerHTML = `
                    <div class="product-image">
                        ${hasImage 
                            ? `<img src="${item.imageUrl}" alt="${item.itemName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                               <svg style="display:none;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                   <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                   <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                   <polyline points="21 15 16 10 5 21"></polyline>
                               </svg>`
                            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                   <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                   <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                   <polyline points="21 15 16 10 5 21"></polyline>
                               </svg>`
                        }
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
                console.log(`  ✅ Rendered: "${item.itemName}"`);
            });
            
            console.log(`✅ Successfully displayed ${availableItems.length} products`);
            console.log('='.repeat(50));
        }
    } catch (error) {
        console.error('❌ ERROR loading products:', error);
        console.error('Error stack:', error.stack);
        alert('Failed to load products. Check console for details.');
    }
}

// Category navigation
document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        const category = this.textContent.trim();
        console.log('📂 Category clicked:', category);
        loadProducts(category);
    });
});

document.querySelector('.category-item').classList.add('active');
console.log('🚀 Initializing dashboard - loading all products');
loadProducts('All');

// Open product modal
async function openProductModal(product) {
    console.log('🔍 Opening modal for:', product.itemName);
    currentProduct = product;
    
    modalProductName.textContent = product.itemName;
    modalProductPrice.textContent = `₱${parseFloat(product.price).toFixed(2)}`;
    modalProductDescription.textContent = product.description || 'No description available.';
    modalProductCondition.textContent = product.condition;
    modalProductCategory.textContent = product.tags.join(', ') || 'Uncategorized';
    
    const hasImage = product.imageUrl && product.imageUrl.trim() !== '';
    if (hasImage) {
        modalProductImage.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.itemName}" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                 style="max-width: 100%; max-height: 100%; object-fit: contain;">
            <svg style="display:none;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
        `;
    } else {
        modalProductImage.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
        `;
    }
    
    // Fetch owner information
    try {
        const response = await fetch(`http://localhost:3000/api/users/${product.ownerId}`);
        const userData = await response.json();
        if (userData.success) {
            modalProductOwner.textContent = userData.data.username;
            product.ownerUsername = userData.data.username;
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
    console.log('🛒 Adding to cart:', product.itemName);
    
    if (product.isRented || !product.isRenting) {
        alert('This item is not available for rent at the moment.');
        return;
    }
    
    if (product.ownerId === currentUser.userId) {
        alert('You cannot add your own item to the cart.');
        return;
    }
    
    try {
        cartManager.addToCart(product);
        showToast('Item added to cart successfully!');
        console.log(`✅ Added ${product.itemName} to cart`);
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Failed to add item to cart. Please try again.');
    }
}

// Toast notification function
function showToast(message, duration = 3000) {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
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

// Add CSS for toast notification
const style = document.createElement('style');
style.textContent = `
    .toast-notification {
        position: fixed;
        bottom: -100px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #232f3e;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 9999;
        transition: bottom 0.3s ease;
        font-size: 15px;
        font-weight: 500;
    }
    .toast-notification.show {
        bottom: 30px;
    }
    .toast-notification svg {
        color: #4CAF50;
    }
`;
document.head.appendChild(style);