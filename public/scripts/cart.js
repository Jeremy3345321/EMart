// Cart Page Logic
const cartItemsContainer = document.getElementById('cartItems');
const emptyMessage = document.getElementById('emptyMessage');
const itemCountElement = document.getElementById('itemCount');
const subtotalElement = document.getElementById('subtotal');
const shippingElement = document.getElementById('shipping');
const totalElement = document.getElementById('total');
const checkoutBtn = document.getElementById('checkoutBtn');
const clearCartBtn = document.getElementById('clearCartBtn');

// Shipping cost
const SHIPPING_COST = 50;

// Load and display cart
function displayCart() {
    const cart = cartManager.getCart();
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        checkoutBtn.disabled = true;
        clearCartBtn.disabled = true;
        updateSummary();
        return;
    }
    
    checkoutBtn.disabled = false;
    clearCartBtn.disabled = false;
    
    cartItemsContainer.innerHTML = '';
    
    cart.forEach(item => {
        const cartItem = createCartItem(item);
        cartItemsContainer.appendChild(cartItem);
    });
    
    updateSummary();
}

// Create cart item element
function createCartItem(item) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'cart-item';
    itemDiv.dataset.id = item.id;
    
    itemDiv.innerHTML = `
        <div class="item-image">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
        </div>
        <div class="item-details">
            <h3 class="item-name">${item.name}</h3>
            <p class="item-category">${item.category}</p>
            <p class="item-owner">Seller: ${item.owner}</p>
        </div>
        <div class="item-quantity">
            <button class="qty-btn" onclick="changeQuantity(${item.id}, -1)">-</button>
            <input type="number" value="${item.quantity}" min="1" onchange="updateItemQuantity(${item.id}, this.value)" class="qty-input">
            <button class="qty-btn" onclick="changeQuantity(${item.id}, 1)">+</button>
        </div>
        <div class="item-price">₱${(item.price * item.quantity).toLocaleString()}</div>
        <button class="remove-btn" onclick="removeItem(${item.id})" title="Remove item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
        </button>
    `;
    
    return itemDiv;
}

// Change quantity
function changeQuantity(productId, change) {
    const cart = cartManager.getCart();
    const item = cart.find(i => i.id === productId);
    
    if (item) {
        const newQuantity = item.quantity + change;
        if (newQuantity > 0) {
            cartManager.updateQuantity(productId, newQuantity);
            displayCart();
        }
    }
}

// Update item quantity from input
function updateItemQuantity(productId, quantity) {
    const qty = parseInt(quantity);
    if (qty > 0) {
        cartManager.updateQuantity(productId, qty);
        displayCart();
    }
}

// Remove item
function removeItem(productId) {
    if (confirm('Remove this item from cart?')) {
        cartManager.removeFromCart(productId);
        displayCart();
    }
}

// Update order summary
function updateSummary() {
    const cart = cartManager.getCart();
    const itemCount = cartManager.getItemCount();
    const subtotal = cartManager.getTotal();
    const shipping = cart.length > 0 ? SHIPPING_COST : 0;
    const total = subtotal + shipping;
    
    itemCountElement.textContent = itemCount;
    subtotalElement.textContent = `₱${subtotal.toLocaleString()}`;
    shippingElement.textContent = `₱${shipping.toLocaleString()}`;
    totalElement.textContent = `₱${total.toLocaleString()}`;
}

// Clear cart
clearCartBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your cart?')) {
        cartManager.clearCart();
        displayCart();
    }
});

// Checkout
checkoutBtn.addEventListener('click', () => {
    const cart = cartManager.getCart();
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    alert('Proceeding to checkout...');
    // You can add checkout page navigation here
    // window.location.href = 'checkout.html';
});

// Cart button (already on cart page)
document.getElementById('cartBtn').addEventListener('click', () => {
    window.location.href = 'cart.html';
});

// Dropdown menu actions
const dropdownMenu = document.getElementById('dropdownMenu');
const menuBtn = document.getElementById('menuBtn');

menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
});

document.addEventListener('click', (e) => {
    if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove('show');
    }
});

document.getElementById('viewProfileBtn').addEventListener('click', () => {
    window.location.href = 'profile.html';
});

document.getElementById('postItemBtn').addEventListener('click', () => {
    window.location.href = 'post-item.html';
});

document.getElementById('seeReceiptsBtn').addEventListener('click', () => {
    window.location.href = 'receipts.html';
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
});

// Initialize cart display
displayCart();
cartManager.updateCartCount();