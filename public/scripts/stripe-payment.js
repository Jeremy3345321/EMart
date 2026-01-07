// stripe-payment.js - Place this in public/scripts/stripe-payment.js

// ========================================
// STRIPE PAYMENT HANDLER
// ========================================

class StripePaymentHandler {
    constructor() {
        // Initialize Stripe with your publishable key
        this.stripe = Stripe('pk_test_51SmsNe2LPB6lMaGqKOtPH3Aak10SqgmnRNyqpQdarU2bbLktiSJzsEVcqAa49I4X8RLpVTTXNRnxpG3sGLwJ5hPI00iXFrWZQI');
        this.elements = null;
        this.cardElement = null;
        this.receipts = [];
        
        this.modal = document.getElementById('paymentModal');
        this.form = document.getElementById('paymentForm');
        this.submitButton = document.getElementById('submitPayment');
        this.cardErrors = document.getElementById('cardErrors');
        this.processingOverlay = document.getElementById('processingOverlay');
        this.testModeNotice = document.getElementById('testModeNotice');
        
        this.setupEventListeners();
        
        console.log('✅ Stripe Payment Handler initialized');
    }
    
    setupEventListeners() {
        // Close modal button
        document.getElementById('closePaymentModal').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Close on overlay click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Handle form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePayment();
        });
        
        console.log('✅ Event listeners setup complete');
    }
    
    async showPaymentModal(checkoutData) {
        console.log('💳 Opening payment modal...');
        console.log('Checkout data:', checkoutData);
        
        // Store checkout data
        this.receipts = checkoutData.receipts;
        
        // Show test mode notice
        if (checkoutData.isTestMode) {
            this.testModeNotice.style.display = 'flex';
        }
        
        // Populate payment summary
        this.populatePaymentSummary(checkoutData);
        
        // Create Stripe card element
        this.createCardElement();
        
        // Show modal
        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        console.log('✅ Payment modal opened');
    }
    
    populatePaymentSummary(data) {
        const summaryItems = document.getElementById('paymentSummaryItems');
        const paymentAmount = document.getElementById('paymentAmount');
        
        // Clear existing items
        summaryItems.innerHTML = '';
        
        // Add each item
        data.items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'payment-summary-item';
            itemDiv.innerHTML = `
                <span class="payment-summary-item-name">${item.name}</span>
                <span>₱${parseFloat(item.price).toFixed(2)}</span>
            `;
            summaryItems.appendChild(itemDiv);
        });
        
        // Add shipping
        const shippingDiv = document.createElement('div');
        shippingDiv.className = 'payment-summary-item';
        shippingDiv.innerHTML = `
            <span>Shipping Fee</span>
            <span>₱${parseFloat(data.shipping).toFixed(2)}</span>
        `;
        summaryItems.appendChild(shippingDiv);
        
        // Set total
        paymentAmount.textContent = `₱${parseFloat(data.totalAmount).toFixed(2)}`;
        
        console.log('✅ Payment summary populated');
    }
    
    createCardElement() {
        // Create Stripe Elements instance
        this.elements = this.stripe.elements();
        
        // Create card element with styling
        this.cardElement = this.elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#32325d',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    '::placeholder': {
                        color: '#aab7c4'
                    }
                },
                invalid: {
                    color: '#fa755a',
                    iconColor: '#fa755a'
                }
            },
            hidePostalCode: true
        });
        
        // Mount card element
        this.cardElement.mount('#cardElement');
        
        // Handle card errors
        this.cardElement.on('change', (event) => {
            if (event.error) {
                this.cardErrors.textContent = event.error.message;
            } else {
                this.cardErrors.textContent = '';
            }
        });
        
        console.log('✅ Stripe card element created and mounted');
    }
    
    async handlePayment() {
        console.log('💳 Processing payment for', this.receipts.length, 'items...');
        
        // Disable submit button and show processing
        this.submitButton.disabled = true;
        this.processingOverlay.style.display = 'flex';
        
        try {
            // Process each receipt
            for (const receipt of this.receipts) {
                console.log(`Processing payment for receipt ${receipt.receiptId}...`);
                
                // Get client secret
                const { clientSecret, paymentIntentId } = await this.getClientSecret(receipt);
                console.log(`Got client secret: ${clientSecret.substring(0, 20)}...`);
                
                // Confirm card payment with Stripe
                const result = await this.stripe.confirmCardPayment(clientSecret, {
                    payment_method: {
                        card: this.cardElement,
                        billing_details: {
                            name: currentUser.username
                        }
                    }
                });
                
                if (result.error) {
                    throw new Error(result.error.message);
                }
                
                console.log(`✅ Payment successful for receipt ${receipt.receiptId}`);
                
                // Confirm payment on backend
                await this.confirmPayment(paymentIntentId);
                
                // Update item status and send notifications
                await this.completeRental(receipt);
            }
            
            // All payments successful
            console.log('✅ All payments completed successfully');
            
            // Clear cart
            await cartManager.clearCart();
            
            // Show success and redirect
            alert('Payment successful! Your rentals have been confirmed.');
            window.location.href = 'receipts.html';
            
        } catch (error) {
            console.error('❌ Payment error:', error);
            this.cardErrors.textContent = error.message;
            this.submitButton.disabled = false;
            this.processingOverlay.style.display = 'none';
        }
    }
    
    async getClientSecret(receipt) {
        console.log(`Creating payment intent for receipt ${receipt.receiptId}...`);
        
        const response = await fetch(`${API_URL}/payments/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                receiptId: receipt.receiptId,
                userId: currentUser.userId,
                amount: receipt.amount,
                currency: 'PHP'
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to create payment');
        }
        
        return {
            clientSecret: data.data.clientSecret,
            paymentIntentId: data.data.paymentIntentId
        };
    }
    
    async confirmPayment(paymentIntentId) {
        console.log(`Confirming payment ${paymentIntentId} on backend...`);
        
        const response = await fetch(`${API_URL}/payments/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentIntentId })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('Failed to confirm payment on server');
        }
        
        console.log('✅ Payment confirmed on backend');
        return data;
    }
    
    async completeRental(receipt) {
        console.log(`Completing rental for receipt ${receipt.receiptId}...`);
        
        try {
            // 1. Update item status to rented
            await fetch(`${API_URL}/items/${receipt.itemId}/rent`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    renterId: currentUser.userId,
                    isRented: false // Will be set to true when item arrives
                })
            });
            
            // 2. Update receipt status to active
            await fetch(`${API_URL}/receipts/${receipt.receiptId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'active' })
            });
            
            // 3. Send notifications (handled by server)
            
            console.log(`✅ Rental completed for receipt ${receipt.receiptId}`);
        } catch (error) {
            console.error(`Error completing rental:`, error);
            // Don't throw - payment succeeded, just log the error
        }
    }
    
    closeModal() {
        console.log('Closing payment modal...');
        
        this.modal.classList.remove('show');
        document.body.style.overflow = '';
        
        // Destroy card element
        if (this.cardElement) {
            this.cardElement.destroy();
            this.cardElement = null;
        }
        
        // Reset form
        this.form.reset();
        this.cardErrors.textContent = '';
        this.submitButton.disabled = false;
        this.processingOverlay.style.display = 'none';
        
        console.log('✅ Payment modal closed');
    }
}

// Create global instance after page loads
let stripePayment;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        stripePayment = new StripePaymentHandler();
    });
} else {
    stripePayment = new StripePaymentHandler();
}