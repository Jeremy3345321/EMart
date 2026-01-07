// PaymentService.js - Handles all PSP interactions

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Database = require('../classes/Database');

class PaymentService {
    
    // ==================== CHECKOUT FLOW ====================
    
    /**
     * Check if in test mode
     */
    static isTestMode() {
        return process.env.NODE_ENV !== 'production';
    }

    /**
     * Create payment with test/live mode support
     */
    static async createRentalPayment(receiptId, userId, amount, currency = 'PHP') {
        try {
            const testMode = this.isTestMode();
            
            console.log(`💳 Creating payment (${testMode ? 'TEST' : 'LIVE'} mode)`);
            console.log(`   Receipt: ${receiptId}, Amount: ₱${amount}`);
            
            // In test mode, Stripe won't charge real cards
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100),
                currency: currency.toLowerCase(),
                metadata: {
                    receiptId: receiptId,
                    userId: userId,
                    type: 'rental_payment',
                    testMode: testMode
                },
                description: `${testMode ? '[TEST] ' : ''}Rental for receipt #${receiptId}`,
            });
            
            // Save to database with test flag
            await Database.pool.execute(
                `INSERT INTO payment_transactions 
                (receipt_id, user_id, amount, currency, transaction_type, 
                payment_intent_id, status, metadata)
                VALUES (?, ?, ?, ?, 'charge', ?, 'pending', ?)`,
                [
                    receiptId, userId, amount, currency, 
                    paymentIntent.id,
                    JSON.stringify({ isTest: testMode })
                ]
            );
            
            return {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                isTest: testMode
            };
            
        } catch (error) {
            console.error('❌ Error creating payment:', error);
            throw error;
        }
    }
    
    /**
     * Confirm payment after successful charge (called by webhook)
     */
    static async confirmRentalPayment(paymentIntentId) {
        try {
            console.log(`✅ Confirming payment: ${paymentIntentId}`);
            
            // Update transaction status
            await Database.pool.execute(
                `UPDATE payment_transactions 
                SET status = 'succeeded', processed_at = NOW()
                WHERE payment_intent_id = ?`,
                [paymentIntentId]
            );
            
            // Get receipt info
            const [transactions] = await Database.pool.execute(
                'SELECT receipt_id, amount FROM payment_transactions WHERE payment_intent_id = ?',
                [paymentIntentId]
            );
            
            if (transactions.length > 0) {
                const { receipt_id, amount } = transactions[0];
                
                // Update receipt with payment info
                await Database.pool.execute(
                    `UPDATE receipts 
                    SET total_paid = ?, payment_transaction_id = (
                        SELECT transaction_id FROM payment_transactions 
                        WHERE payment_intent_id = ?
                    )
                    WHERE receipt_id = ?`,
                    [amount, paymentIntentId, receipt_id]
                );
                
                console.log(`✅ Receipt ${receipt_id} payment confirmed`);
                return receipt_id;
            }
            
        } catch (error) {
            console.error('❌ Error confirming payment:', error);
            throw error;
        }
    }
    
    // ==================== REFUND FLOW (ITEM RECALL) ====================
    
    /**
     * Calculate prorated refund for early return/recall
     */
    static calculateProratedRefund(rentalStartDate, rentalEndDate, totalPaid, returnDate) {
        const start = new Date(rentalStartDate);
        const end = new Date(rentalEndDate);
        const returned = new Date(returnDate);
        
        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const usedDays = Math.ceil((returned - start) / (1000 * 60 * 60 * 24));
        const remainingDays = Math.max(0, totalDays - usedDays);
        
        const refundAmount = (totalPaid * remainingDays) / totalDays;
        
        console.log(`📊 Refund calculation:
            Total days: ${totalDays}
            Used days: ${usedDays}
            Remaining: ${remainingDays}
            Total paid: ₱${totalPaid}
            Refund: ₱${refundAmount.toFixed(2)}`);
        
        return {
            totalDays,
            usedDays,
            remainingDays,
            refundAmount: Math.floor(refundAmount * 100) / 100 // Round down to 2 decimals
        };
    }
    
    /**
     * Process refund for item recall or early return
     */
    static async processRefund(receiptId, reason = 'item_recall', customAmount = null) {
        try {
            console.log(`💸 Processing refund for receipt ${receiptId}`);
            
            // Get receipt and payment info
            const [receipts] = await Database.pool.execute(
                `SELECT r.*, pt.payment_intent_id, pt.amount as paid_amount
                FROM receipts r
                JOIN payment_transactions pt ON r.payment_transaction_id = pt.transaction_id
                WHERE r.receipt_id = ?`,
                [receiptId]
            );
            
            if (receipts.length === 0) {
                throw new Error('Receipt or payment not found');
            }
            
            const receipt = receipts[0];
            
            // Calculate refund amount
            let refundAmount;
            if (customAmount !== null) {
                refundAmount = customAmount;
            } else {
                const calculation = this.calculateProratedRefund(
                    receipt.rental_start_date,
                    receipt.rental_end_date,
                    receipt.paid_amount,
                    new Date()
                );
                refundAmount = calculation.refundAmount;
            }
            
            // Create refund with Stripe
            const refund = await stripe.refunds.create({
                payment_intent: receipt.payment_intent_id,
                amount: Math.round(refundAmount * 100), // Convert to cents
                reason: reason === 'item_recall' ? 'requested_by_customer' : 'requested_by_customer',
                metadata: {
                    receiptId: receiptId,
                    reason: reason
                }
            });
            
            // Store refund transaction
            const [refundResult] = await Database.pool.execute(
                `INSERT INTO payment_transactions 
                (receipt_id, user_id, amount, currency, transaction_type, 
                refund_id, status, metadata)
                VALUES (?, ?, ?, 'PHP', 'refund', ?, 'succeeded', ?)`,
                [
                    receiptId, 
                    receipt.renter_id, 
                    refundAmount, 
                    refund.id,
                    JSON.stringify({ reason, originalPaymentIntent: receipt.payment_intent_id })
                ]
            );
            
            // Update receipt
            await Database.pool.execute(
                `UPDATE receipts 
                SET total_refunded = ?, 
                    refund_transaction_id = ?,
                    status = 'recalled'
                WHERE receipt_id = ?`,
                [refundAmount, refundResult.insertId, receiptId]
            );
            
            console.log(`✅ Refund processed: ₱${refundAmount} (Refund ID: ${refund.id})`);
            
            return {
                refundId: refund.id,
                refundAmount: refundAmount,
                status: refund.status
            };
            
        } catch (error) {
            console.error('❌ Error processing refund:', error);
            throw error;
        }
    }
    
    // ==================== SECURITY DEPOSIT ====================
    
    /**
     * Authorize (hold) security deposit
     */
    static async authorizeSecurityDeposit(receiptId, renterId, depositAmount) {
        try {
            console.log(`🔒 Authorizing security deposit: ₱${depositAmount}`);
            
            // Create payment intent with manual capture (auth only)
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(depositAmount * 100),
                currency: 'php',
                capture_method: 'manual', // Don't charge yet, just authorize
                metadata: {
                    receiptId: receiptId,
                    renterId: renterId,
                    type: 'security_deposit'
                },
                description: `Security deposit for receipt #${receiptId}`,
            });
            
            // Store deposit record
            await Database.pool.execute(
                `INSERT INTO security_deposits 
                (receipt_id, renter_id, deposit_amount, authorization_id, status, expires_at)
                VALUES (?, ?, ?, ?, 'authorized', DATE_ADD(NOW(), INTERVAL 7 DAY))`,
                [receiptId, renterId, depositAmount, paymentIntent.id]
            );
            
            console.log(`✅ Security deposit authorized: ${paymentIntent.id}`);
            
            return {
                clientSecret: paymentIntent.client_secret,
                authorizationId: paymentIntent.id
            };
            
        } catch (error) {
            console.error('❌ Error authorizing deposit:', error);
            throw error;
        }
    }
    
    /**
     * Capture security deposit (for damages)
     */
    static async captureSecurityDeposit(depositId, captureAmount, damageDescription) {
        try {
            console.log(`💰 Capturing security deposit: ₱${captureAmount}`);
            
            // Get deposit info
            const [deposits] = await Database.pool.execute(
                'SELECT * FROM security_deposits WHERE deposit_id = ?',
                [depositId]
            );
            
            if (deposits.length === 0) {
                throw new Error('Security deposit not found');
            }
            
            const deposit = deposits[0];
            
            // Capture the authorization
            const capture = await stripe.paymentIntents.capture(deposit.authorization_id, {
                amount_to_capture: Math.round(captureAmount * 100)
            });
            
            // Update deposit record
            await Database.pool.execute(
                `UPDATE security_deposits 
                SET captured_amount = ?, 
                    status = 'captured',
                    capture_id = ?,
                    damage_description = ?
                WHERE deposit_id = ?`,
                [captureAmount, capture.id, damageDescription, depositId]
            );
            
            console.log(`✅ Deposit captured: ₱${captureAmount}`);
            
            return { captureId: capture.id, capturedAmount: captureAmount };
            
        } catch (error) {
            console.error('❌ Error capturing deposit:', error);
            throw error;
        }
    }
    
    /**
     * Release security deposit (no damages)
     */
    static async releaseSecurityDeposit(depositId) {
        try {
            console.log(`🔓 Releasing security deposit ${depositId}`);
            
            // Get deposit info
            const [deposits] = await Database.pool.execute(
                'SELECT * FROM security_deposits WHERE deposit_id = ?',
                [depositId]
            );
            
            if (deposits.length === 0) {
                throw new Error('Security deposit not found');
            }
            
            const deposit = deposits[0];
            
            // Cancel the authorization (release hold)
            await stripe.paymentIntents.cancel(deposit.authorization_id);
            
            // Update deposit record
            await Database.pool.execute(
                `UPDATE security_deposits 
                SET status = 'released',
                    released_amount = deposit_amount,
                    released_at = NOW()
                WHERE deposit_id = ?`,
                [depositId]
            );
            
            console.log(`✅ Deposit released`);
            
            return { released: true };
            
        } catch (error) {
            console.error('❌ Error releasing deposit:', error);
            throw error;
        }
    }
    
    // ==================== WEBHOOK HANDLER ====================
    
    /**
     * Handle webhook events from PSP
     */
    static async handleWebhook(event) {
        console.log(`📨 Webhook received: ${event.type}`);
        
        try {
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await this.confirmRentalPayment(event.data.object.id);
                    break;
                    
                case 'payment_intent.payment_failed':
                    await Database.pool.execute(
                        `UPDATE payment_transactions 
                        SET status = 'failed', 
                            failure_reason = ?
                        WHERE payment_intent_id = ?`,
                        [event.data.object.last_payment_error?.message, event.data.object.id]
                    );
                    break;
                    
                case 'refund.updated':
                    // Handle refund status changes
                    break;
                    
                default:
                    console.log(`⚠️ Unhandled event type: ${event.type}`);
            }
        } catch (error) {
            console.error('❌ Webhook handling error:', error);
            throw error;
        }
    }
}

module.exports = PaymentService;