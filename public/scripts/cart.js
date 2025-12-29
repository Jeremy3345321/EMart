// cart.js - Updated for Database Backend

const cartItemsContainer = document.getElementById('cartItems');
const itemCountElement = document.getElementById('itemCount');
const subtotalElement = document.getElementById('subtotal');
const shippingElement = document.getElementById('shipping');
const totalElement = document.getElementById('total');
const checkoutBtn = document.getElementById('checkoutBtn');
const clearCartBtn = document.getElementById('clearCartBtn');

// Shipping cost
const SHIPPING_COST = 50;

// Load and display cart
async function displayCart() {
    try {
        console.log('🛒 Loading cart...');
        const cart = await cartManager.getCart();
        
        console.log('📦 Cart data:', cart);
        console.log('📊 Cart length:', cart.length);
        
        if (!cart || cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-message">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <h2>Your cart is empty</h2>
                    <p>Add items to get started!</p>
                    <button onclick="window.location.href='dashboard.html'" class="shop-now-btn">Shop Now</button>
                </div>
            `;
            checkoutBtn.disabled = true;
            clearCartBtn.disabled = true;
            await updateSummary();
            return;
        }
        
        checkoutBtn.disabled = false;
        clearCartBtn.disabled = false;
        
        cartItemsContainer.innerHTML = '';
        
        cart.forEach(item => {
            console.log('📦 Creating cart item:', item);
            const cartItem = createCartItem(item);
            cartItemsContainer.appendChild(cartItem);
        });
        
        await updateSummary();
        console.log('✅ Cart display complete');
    } catch (error) {
        console.error('❌ Error displaying cart:', error);
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-message">
                <h2>Error loading cart</h2>
                <p>Please try refreshing the page.</p>
                <button onclick="location.reload()" class="shop-now-btn">Refresh</button>
            </div>
        `;
    }
}

// Create cart item element
function createCartItem(item) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'cart-item';
    itemDiv.dataset.id = item.id;
    
    // Ensure all values exist with fallbacks
    const itemName = item.name || 'Unknown Item';
    const itemCategory = item.category || 'Uncategorized';
    const itemOwner = item.owner || 'Unknown';
    const itemCondition = item.condition || 'Not specified';
    const itemPrice = parseFloat(item.price) || 0;
    const itemQuantity = parseInt(item.quantity) || 1;
    
    itemDiv.innerHTML = `
        <div class="item-image">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
        </div>
        <div class="item-details">
            <h3 class="item-name">${itemName}</h3>
            <p class="item-category">${itemCategory}</p>
            <p class="item-owner">Seller: ${itemOwner}</p>
            <p class="item-condition">Condition: ${itemCondition}</p>
        </div>
        <div class="item-quantity">
            <button class="qty-btn" onclick="changeQuantity(${item.id}, -1)">-</button>
            <input type="number" value="${itemQuantity}" min="1" onchange="updateItemQuantity(${item.id}, this.value)" class="qty-input">
            <button class="qty-btn" onclick="changeQuantity(${item.id}, 1)">+</button>
        </div>
        <div class="item-price">₱${(itemPrice * itemQuantity).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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
async function changeQuantity(productId, change) {
    try {
        const cart = await cartManager.getCart();
        const item = cart.find(i => i.id === productId);
        
        if (item) {
            const newQuantity = item.quantity + change;
            if (newQuantity > 0) {
                await cartManager.updateQuantity(productId, newQuantity);
                await displayCart();
            }
        }
    } catch (error) {
        console.error('❌ Error changing quantity:', error);
        alert('Failed to update quantity. Please try again.');
    }
}

// Update item quantity from input
async function updateItemQuantity(productId, quantity) {
    try {
        const qty = parseInt(quantity);
        if (qty > 0) {
            await cartManager.updateQuantity(productId, qty);
            await displayCart();
        }
    } catch (error) {
        console.error('❌ Error updating quantity:', error);
        alert('Failed to update quantity. Please try again.');
    }
}

// Remove item
async function removeItem(productId) {
    if (confirm('Remove this item from cart?')) {
        try {
            await cartManager.removeFromCart(productId);
            await displayCart();
        } catch (error) {
            console.error('❌ Error removing item:', error);
            alert('Failed to remove item. Please try again.');
        }
    }
}

// Update order summary
async function updateSummary() {
    try {
        const cart = await cartManager.getCart();
        const itemCount = await cartManager.getItemCount();
        const subtotal = await cartManager.getTotal();
        const shipping = cart.length > 0 ? SHIPPING_COST : 0;
        const total = subtotal + shipping;
        
        itemCountElement.textContent = itemCount;
        subtotalElement.textContent = `₱${subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        shippingElement.textContent = `₱${shipping.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        totalElement.textContent = `₱${total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } catch (error) {
        console.error('❌ Error updating summary:', error);
    }
}

// Clear cart
clearCartBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear your cart?')) {
        try {
            await cartManager.clearCart();
            await displayCart();
        } catch (error) {
            console.error('❌ Error clearing cart:', error);
            alert('Failed to clear cart. Please try again.');
        }
    }
});

// Checkout
checkoutBtn.addEventListener('click', async () => {
    try {
        const cart = await cartManager.getCart();
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        
        alert('Proceeding to checkout...');
        // You can add checkout page navigation here
        // window.location.href = 'checkout.html';
    } catch (error) {
        console.error('❌ Error during checkout:', error);
        alert('Failed to proceed to checkout. Please try again.');
    }
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
        sessionStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
});

// Initialize cart display
console.log('🚀 Initializing cart page...');
displayCart();