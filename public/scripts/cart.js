// cart.js - Fixed version with proper image display

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
        
        // Check if imageUrl exists and is not empty
        const hasImage = cartItem.imageUrl && cartItem.imageUrl.trim() !== '';
        
        return `
            <div class="cart-item" data-item-id="${cartItem.id}">
                <div class="item-image">
                    ${hasImage
                        ? `<img src="${cartItem.imageUrl}" alt="${cartItem.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                           <svg style="display: none;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
    const shippingFee = cart.length > 0 ? 50 : 0;
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

async function checkout() {
    console.log('💳 Starting checkout...');
    
    if (!cart || cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    checkoutBtn.disabled = true;
    const originalHTML = checkoutBtn.innerHTML;
    checkoutBtn.innerHTML = '<span>Processing...</span>';
    
    try {
        const receipts = [];
        
        // Step 1: Create receipts with proper rental durations
        console.log('📝 Creating receipts with item-specific rental durations...');
        
        for (const cartItem of cart) {
            try {
                console.log(`Creating receipt for: ${cartItem.name}`);
                
                // Fetch item details to get actual rental duration
                const itemResponse = await fetch(`${API_URL}/items/${cartItem.id}`);
                const itemData = await itemResponse.json();
                
                if (!itemData.success) {
                    throw new Error(`Failed to fetch item details for ${cartItem.name}`);
                }
                
                const item = itemData.data;
                
                // Calculate rental dates based on item's rental duration
                const rentalStartDate = new Date();
                const rentalEndDate = new Date();
                
                // Add the appropriate duration based on the item's duration unit
                switch(item.rentalDurationUnit) {
                    case 'hour':
                        rentalEndDate.setHours(rentalEndDate.getHours() + item.rentalDuration);
                        break;
                    case 'day':
                        rentalEndDate.setDate(rentalEndDate.getDate() + item.rentalDuration);
                        break;
                    case 'week':
                        rentalEndDate.setDate(rentalEndDate.getDate() + (item.rentalDuration * 7));
                        break;
                    case 'month':
                        rentalEndDate.setMonth(rentalEndDate.getMonth() + item.rentalDuration);
                        break;
                    default:
                        // Default to days if unit is not recognized
                        rentalEndDate.setDate(rentalEndDate.getDate() + item.rentalDuration);
                }
                
                console.log(`📅 Rental period for ${cartItem.name}:`, {
                    duration: `${item.rentalDuration} ${item.rentalDurationUnit}(s)`,
                    start: rentalStartDate.toISOString(),
                    end: rentalEndDate.toISOString()
                });
                
                // Create receipt with calculated dates
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
                        status: 'pending_payment'
                    })
                });
                
                const receiptData = await receiptResponse.json();
                
                if (!receiptData.success) {
                    throw new Error(`Failed to create receipt: ${receiptData.message}`);
                }
                
                receipts.push({
                    receiptId: receiptData.data.receiptId,
                    itemId: cartItem.id,
                    itemName: cartItem.name,
                    amount: cartItem.price,
                    rentalDuration: `${item.rentalDuration} ${item.rentalDurationUnit}(s)`,
                    startDate: rentalStartDate,
                    endDate: rentalEndDate
                });
                
                console.log(`✅ Receipt created: ${receiptData.data.receiptId} with proper duration`);
                
            } catch (error) {
                console.error(`Error creating receipt for ${cartItem.name}:`, error);
                throw error;
            }
        }
        
        // Step 2: Calculate totals
        const subtotalAmount = cart.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
        const shippingFee = 50;
        const totalAmount = subtotalAmount + shippingFee;
        
        console.log('💰 Totals calculated:', {
            subtotal: subtotalAmount,
            shipping: shippingFee,
            total: totalAmount
        });
        
        // Step 3: Show Stripe payment modal
        console.log('🎨 Opening payment modal...');
        stripePayment.showPaymentModal({
            items: cart.map(item => ({
                name: item.name,
                price: item.price
            })),
            receipts: receipts,
            shipping: shippingFee,
            subtotal: subtotalAmount,
            totalAmount: totalAmount,
            isTestMode: true
        });
        
        console.log('✅ Payment modal opened successfully');
        
    } catch (error) {
        console.error('❌ Checkout error:', error);
        alert(`Checkout failed: ${error.message}`);
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