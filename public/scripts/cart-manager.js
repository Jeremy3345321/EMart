// cart-manager.js - Fixed with imageUrl mapping

class CartManager {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api';
    }

    // Get current user from session
    getCurrentUser() {
        const user = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
        if (!user) {
            console.warn('⚠️ No user logged in');
            return null;
        }
        return user;
    }

    // Get cart from backend
    async getCart() {
        try {
            const user = this.getCurrentUser();
            if (!user) return [];

            const response = await fetch(`${this.apiUrl}/cart/${user.userId}`);
            const data = await response.json();

            if (data.success) {
                console.log(`✅ Loaded ${data.data.length} items from cart`);
                return data.data.map(cartItem => ({
                    id: cartItem.itemId,
                    name: cartItem.item.itemName,
                    price: cartItem.item.price,
                    category: cartItem.item.tags.length > 0 ? cartItem.item.tags[0] : 'Uncategorized',
                    owner: cartItem.item.ownerName,
                    ownerId: cartItem.item.ownerId,
                    condition: cartItem.item.condition,
                    imageUrl: cartItem.item.imageUrl, // ✅ ADDED: Map imageUrl from item
                    quantity: cartItem.quantity,
                    isRenting: cartItem.item.isRenting,
                    isRented: cartItem.item.isRented,
                    addedAt: cartItem.addedAt
                }));
            }

            return [];
        } catch (error) {
            console.error('❌ Error fetching cart:', error);
            return [];
        }
    }

    // Add item to cart
    async addToCart(product) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                alert('Please log in to add items to cart');
                return null;
            }

            const response = await fetch(`${this.apiUrl}/cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user.userId,
                    itemId: product.itemId,
                    quantity: 1
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log(`✅ Added ${product.itemName} to cart`);
                this.updateCartCount();
                return data.data;
            } else {
                console.error('❌ Failed to add to cart:', data.message);
                alert(data.message);
                return null;
            }
        } catch (error) {
            console.error('❌ Error adding to cart:', error);
            alert('Failed to add item to cart. Please try again.');
            return null;
        }
    }

    // Remove item from cart
    async removeFromCart(productId) {
        try {
            const user = this.getCurrentUser();
            if (!user) return false;

            const response = await fetch(
                `${this.apiUrl}/cart/${user.userId}/${productId}`,
                { method: 'DELETE' }
            );

            const data = await response.json();

            if (data.success) {
                console.log(`✅ Removed item ${productId} from cart`);
                this.updateCartCount();
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Error removing from cart:', error);
            return false;
        }
    }

    // Update item quantity
    async updateQuantity(productId, quantity) {
        try {
            const user = this.getCurrentUser();
            if (!user) return false;

            const response = await fetch(`${this.apiUrl}/cart`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user.userId,
                    itemId: productId,
                    quantity: quantity
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log(`✅ Updated quantity for item ${productId}: ${quantity}`);
                this.updateCartCount();
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Error updating quantity:', error);
            return false;
        }
    }

    // Clear cart
    async clearCart() {
        try {
            const user = this.getCurrentUser();
            if (!user) return false;

            const response = await fetch(
                `${this.apiUrl}/cart/${user.userId}`,
                { method: 'DELETE' }
            );

            const data = await response.json();

            if (data.success) {
                console.log('✅ Cart cleared');
                this.updateCartCount();
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Error clearing cart:', error);
            return false;
        }
    }

    // Get total price
    async getTotal() {
        try {
            const user = this.getCurrentUser();
            if (!user) return 0;

            const response = await fetch(`${this.apiUrl}/cart/${user.userId}/total`);
            const data = await response.json();

            if (data.success) {
                return data.data.total;
            }

            return 0;
        } catch (error) {
            console.error('❌ Error getting cart total:', error);
            return 0;
        }
    }

    // Get total item count
    async getItemCount() {
        try {
            const user = this.getCurrentUser();
            if (!user) return 0;

            const response = await fetch(`${this.apiUrl}/cart/${user.userId}/count`);
            const data = await response.json();

            if (data.success) {
                return data.data.count;
            }

            return 0;
        } catch (error) {
            console.error('❌ Error getting cart count:', error);
            return 0;
        }
    }

    // Update cart count badge in header
    async updateCartCount() {
        const cartBtn = document.getElementById('cartBtn');
        if (!cartBtn) return;

        // Remove existing badge
        const existingBadge = cartBtn.querySelector('.cart-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        const count = await this.getItemCount();

        if (count > 0) {
            const badge = document.createElement('span');
            badge.className = 'cart-badge';
            badge.textContent = count > 99 ? '99+' : count;
            cartBtn.style.position = 'relative';
            cartBtn.appendChild(badge);
        }
    }
}

// Create global instance
const cartManager = new CartManager();

// Update cart count on page load
document.addEventListener('DOMContentLoaded', () => {
    cartManager.updateCartCount();
});