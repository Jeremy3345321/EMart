// cart.js

const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
const API_URL = 'http://localhost:3000/api';

if (!currentUser) {
    window.location.href = 'login.html';
}

// Global cart variable
let cart = [];

// DOM Elements
const cartItemsContainer = document.getElementById('cartItems');
const itemCount = document.getElementById('itemCount');
const subtotal = document.getElementById('subtotal');
const shipping = document.getElementById('shipping');
const total = document.getElementById('total');
const checkoutBtn = document.getElementById('checkoutBtn');
const clearCartBtn = document.getElementById('clearCartBtn');

// Dropdown menu handlers
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

// Render cart items
async function renderCart() {
    console.log('🔄 Rendering cart...');
    
    // FIXED: Properly await the async function
    cart = await cartManager.getCart();
    console.log('📦 Cart data:', cart);
    
    if (!cart || cart.length === 0) {
        console.log('⚠️ Cart is empty');
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
        itemCount.textContent = '0';
        subtotal.textContent = '₱0.00';
        shipping.textContent = '₱0.00';
        total.textContent = '₱0.00';
        return;
    }
    
    console.log(`✅ Rendering ${cart.length} items`);
    checkoutBtn.disabled = false;
    clearCartBtn.disabled = false;
    
    cartItemsContainer.innerHTML = cart.map(cartItem => {
        console.log('📋 Cart item:', cartItem);
        return `
            <div class="cart-item" data-item-id="${cartItem.id}">
                <div class="item-image">
                    ${cartItem.item?.imageUrl && cartItem.item.imageUrl.trim() !== '' 
                        ? `<img src="${cartItem.item.imageUrl}" alt="${cartItem.name}">` 
                        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                               <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                               <circle cx="8.5" cy="8.5" r="1.5"></circle>
                               <polyline points="21 15 16 10 5 21"></polyline>
                           </svg>`
                    }
                </div>
                <div class="item-details">
                    <h3 class="item-name">${cartItem.name}</h3>
                    <p class="item-owner">Owner: ${cartItem.owner || 'Unknown'}</p>
                    <p class="item-condition">Condition: ${cartItem.condition || 'Good'}</p>
                </div>
                <div class="item-price">₱${parseFloat(cartItem.price).toFixed(2)}</div>
                <button class="remove-item-btn" onclick="removeFromCart(${cartItem.id})" title="Remove from cart">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
    }).join('');
    
    updateCartTotal();
}

// Update cart total
function updateCartTotal() {
    const totalAmount = cart.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
    const shippingFee = cart.length > 0 ? 50 : 0; // ₱50 flat shipping fee
    const finalTotal = totalAmount + shippingFee;
    
    itemCount.textContent = cart.length;
    subtotal.textContent = `₱${totalAmount.toFixed(2)}`;
    shipping.textContent = `₱${shippingFee.toFixed(2)}`;
    total.textContent = `₱${finalTotal.toFixed(2)}`;
    
    console.log(`💰 Total: ₱${finalTotal.toFixed(2)} (${cart.length} items + ₱${shippingFee} shipping)`);
}

// Remove item from cart
async function removeFromCart(itemId) {
    console.log('🗑️ Removing item:', itemId);
    if (confirm('Remove this item from cart?')) {
        const success = await cartManager.removeFromCart(itemId);
        if (success) {
            await renderCart();
            showToast('Item removed from cart');
        }
    }
}

// Clear entire cart
clearCartBtn.addEventListener('click', async function() {
    if (confirm('Are you sure you want to clear your entire cart?')) {
        const success = await cartManager.clearCart();
        if (success) {
            await renderCart();
            showToast('Cart cleared');
        }
    }
});

// Checkout process
async function checkout() {
    console.log('💳 Starting checkout...');
    
    if (!cart || cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // Show loading state
    checkoutBtn.disabled = true;
    const originalHTML = checkoutBtn.innerHTML;
    checkoutBtn.innerHTML = '<span>Processing...</span>';
    
    try {
        const rentalStartDate = new Date();
        const rentalEndDate = new Date();
        rentalEndDate.setDate(rentalEndDate.getDate() + 7); // Default 7 days rental
        
        const checkoutResults = [];
        
        // Process each item in cart
        for (const cartItem of cart) {
            try {
                console.log(`Processing: ${cartItem.name} (ID: ${cartItem.id})`);
                
                // 1. Update item status to rented
                const updateResponse = await fetch(`${API_URL}/items/${cartItem.id}/rent`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        renterId: currentUser.userId,
                        isRented: true
                    })
                });
                
                const updateData = await updateResponse.json();
                
                if (!updateData.success) {
                    throw new Error(`Failed to update item: ${updateData.message}`);
                }
                
                // 2. Create receipt
                const receiptResponse = await fetch(`${API_URL}/receipts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        itemId: cartItem.id,
                        ownerId: cartItem.ownerId,
                        renterId: currentUser.userId,
                        rentalStartDate: rentalStartDate.toISOString(),
                        rentalEndDate: rentalEndDate.toISOString(),
                        rentalPrice: cartItem.price,
                        status: 'active'
                    })
                });
                
                const receiptData = await receiptResponse.json();
                
                if (!receiptData.success) {
                    throw new Error(`Failed to create receipt: ${receiptData.message}`);
                }
                
                checkoutResults.push({
                    success: true,
                    itemName: cartItem.name,
                    receiptId: receiptData.data.receiptId
                });
                
                console.log(`✅ Successfully rented: ${cartItem.name}`);
                
            } catch (itemError) {
                console.error(`Error processing ${cartItem.name}:`, itemError);
                checkoutResults.push({
                    success: false,
                    itemName: cartItem.name,
                    error: itemError.message
                });
            }
        }
        
        // Check results
        const successCount = checkoutResults.filter(r => r.success).length;
        const failCount = checkoutResults.filter(r => !r.success).length;
        
        if (successCount > 0) {
            // Clear cart of successfully rented items
            for (const result of checkoutResults.filter(r => r.success)) {
                const cartItem = cart.find(i => i.name === result.itemName);
                if (cartItem) {
                    await cartManager.removeFromCart(cartItem.id);
                }
            }
            
            // Show success message
            if (failCount === 0) {
                alert(`Success! All ${successCount} items have been rented. Check your receipts for details.`);
                window.location.href = 'receipts.html';
            } else {
                alert(`Partially successful: ${successCount} items rented, ${failCount} failed. Check console for details.`);
                await renderCart();
            }
        } else {
            alert('Checkout failed. Please try again or contact support.');
        }
        
    } catch (error) {
        console.error('❌ Checkout error:', error);
        alert('An error occurred during checkout. Please try again.');
    } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = originalHTML;
    }
}

// Toast notification
function showToast(message) {
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
    }, 3000);
}

// Event listeners
checkoutBtn.addEventListener('click', checkout);

// Initialize - Load cart on page load
console.log('🚀 Initializing cart page...');
renderCart().then(() => {
    console.log('✅ Cart page initialized');
});

// Add toast CSS
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