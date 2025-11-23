// dashboard.js

// Check if user is logged in
const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');

if (!currentUser) {
    // Redirect to login if not logged in
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
    'Groceries': 'Party & Events', // No groceries in backend, mapping to Party & Events
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

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove('show');
    }
});

// View Profile button
document.getElementById('viewProfileBtn').addEventListener('click', function() {
    dropdownMenu.classList.remove('show');
    alert('Profile page will be implemented here');
});

// Post Item button
document.getElementById('postItemBtn').addEventListener('click', function() {
    dropdownMenu.classList.remove('show');
    alert('Post Item page will be implemented here');
});

// Logout button
document.getElementById('logoutBtn').addEventListener('click', function() {
    dropdownMenu.classList.remove('show');
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('currentUser');
        alert('You have been logged out.');
        window.location.href = 'login.html';
    }
});

// Cart button handler
document.getElementById('cartBtn').addEventListener('click', function() {
    alert('Cart functionality will be implemented here');
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

// Global variable to store current filter
let currentCategory = 'All';

// Load products with optional category filter
async function loadProducts(categoryName = 'All') {
    try {
        currentCategory = categoryName;
        
        // Map the display name to backend tag name
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
                
                // Add click event to open modal
                productCard.addEventListener('click', function() {
                    openProductModal(item);
                });
                
                // Add to cart button
                productCard.querySelector('.add-to-cart').addEventListener('click', function(e) {
                    e.stopPropagation();
                    alert('Item added to cart!');
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

// Category navigation click handlers
document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Remove active class from all
        document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
        
        // Add active class to clicked
        this.classList.add('active');
        
        // Get category text
        const category = this.textContent.trim();
        
        // Load products for this category
        loadProducts(category);
    });
});

// Set "All" as active by default
document.querySelector('.category-item').classList.add('active');

// Load all products on page load
loadProducts('All');

// Function to open product modal
async function openProductModal(product) {
    modalProductName.textContent = product.itemName;
    modalProductPrice.textContent = `₱${parseFloat(product.price).toFixed(2)}`;
    modalProductDescription.textContent = product.description || 'No description available.';
    modalProductCondition.textContent = product.condition;
    
    // Display tags
    modalProductCategory.textContent = product.tags.join(', ') || 'Uncategorized';
    
    // Fetch owner information
    try {
        const response = await fetch(`http://localhost:3000/api/users/${product.ownerId}`);
        const userData = await response.json();
        if (userData.success) {
            modalProductOwner.textContent = userData.data.username;
        } else {
            modalProductOwner.textContent = 'Unknown';
        }
    } catch (error) {
        console.error('Error fetching owner info:', error);
        modalProductOwner.textContent = 'Unknown';
    }
    
    // Set availability
    if (product.isRented) {
        modalProductAvailability.textContent = 'Currently Rented';
        modalProductAvailability.style.color = '#d32f2f';
    } else if (product.isRenting) {
        modalProductAvailability.textContent = 'Available';
        modalProductAvailability.style.color = '#388e3c';
    } else {
        modalProductAvailability.textContent = 'Not Available';
        modalProductAvailability.style.color = '#d32f2f';
    }
    
    // Show modal
    productModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Function to close product modal
function closeProductModal() {
    productModal.classList.remove('show');
    document.body.style.overflow = ''; // Restore scrolling
}

// Close modal button
closeModalBtn.addEventListener('click', closeProductModal);

// Close modal when clicking outside
productModal.addEventListener('click', function(e) {
    if (e.target === productModal) {
        closeProductModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && productModal.classList.contains('show')) {
        closeProductModal();
    }
});

// Modal action buttons
modalAddToCart.addEventListener('click', function() {
    alert('Item added to cart!');
    closeProductModal();
});

modalBuyNow.addEventListener('click', function() {
    alert('Proceeding to checkout...');
    closeProductModal();
});