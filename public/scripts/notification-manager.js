// notification-manager.js - Global notification management (Updated with Delete)

class NotificationManager {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api';
        this.notificationBtn = null;
        this.notificationDropdown = null;
        this.notificationList = null;
        this.pollInterval = null;
    }

    // Initialize notification system
    async initialize() {
        console.log('📬 Initializing notification system');
        
        const user = this.getCurrentUser();
        if (!user) return;

        this.setupEventListeners();
        await this.loadNotifications();
        await this.updateBadge();
        this.startPolling();
    }

    // Get current user
    getCurrentUser() {
        return JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    }

    // Setup event listeners for existing HTML elements
    setupEventListeners() {
        this.notificationBtn = document.getElementById('notificationBtn');
        this.notificationDropdown = document.getElementById('notificationDropdown');
        this.notificationList = document.getElementById('notificationList');

        if (!this.notificationBtn || !this.notificationDropdown) {
            console.error('Notification elements not found in HTML');
            return;
        }

        // Toggle dropdown on button click
        this.notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const notificationContainer = this.notificationBtn.closest('.dropdown');
            if (notificationContainer && !notificationContainer.contains(e.target)) {
                this.hideDropdown();
            }
        });

        // Mark all as read button
        const markAllReadBtn = document.getElementById('markAllRead');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => {
                this.markAllAsRead();
            });
        }
    }

    // Load notifications from API
    async loadNotifications() {
        const user = this.getCurrentUser();
        if (!user) return;

        try {
            const response = await fetch(`${this.apiUrl}/notifications/${user.userId}`);
            const data = await response.json();

            if (data.success) {
                this.renderNotifications(data.data);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    // Render notifications in dropdown
    renderNotifications(notifications) {
        if (!this.notificationList) return;

        if (!notifications || notifications.length === 0) {
            this.notificationList.innerHTML = `
                <div class="notification-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        this.notificationList.innerHTML = notifications.map(notif => `
            <div class="notification-item ${notif.isRead ? '' : 'unread'}" data-id="${notif.notificationId}" data-item-id="${notif.itemId || ''}">
                <div class="notification-icon ${notif.type}">
                    ${this.getNotificationIcon(notif.type)}
                </div>
                <div class="notification-content">
                    <h4 class="notification-title">${notif.title}</h4>
                    <p class="notification-message">${notif.message}</p>
                    <span class="notification-time">${notif.timeAgo || this.getTimeAgo(notif.createdAt)}</span>
                </div>
                <button class="notification-delete" data-id="${notif.notificationId}" title="Delete notification">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `).join('');

        // Add click handlers for notifications
        this.notificationList.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking delete button
                if (e.target.closest('.notification-delete')) return;
                
                const notifId = item.dataset.id;
                const itemId = item.dataset.itemId;
                this.handleNotificationClick(notifId, itemId);
            });
        });

        // Add click handlers for delete buttons
        this.notificationList.querySelectorAll('.notification-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation(); // Prevent notification click
                const notifId = btn.dataset.id;
                await this.deleteNotification(notifId);
            });
        });
    }

    // Get icon for notification type
    getNotificationIcon(type) {
        const icons = {
            'rental_started': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>`,
            'item_rented_out': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>`,
            'rental_ended': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>`,
            'item_returned': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>`
        };
        return icons[type] || icons['rental_started'];
    }

    // Get time ago string
    getTimeAgo(createdAt) {
        if (!createdAt) return 'just now';
        
        const now = new Date();
        const created = new Date(createdAt);
        const diffMs = now - created;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return created.toLocaleDateString();
    }

    // Handle notification click
    async handleNotificationClick(notificationId, itemId) {
        // Mark as read
        try {
            await fetch(`${this.apiUrl}/notifications/${notificationId}/read`, {
                method: 'PUT'
            });
            await this.updateBadge();
            await this.loadNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }

        // Redirect to profile page
        this.hideDropdown();
        window.location.href = 'profile.html';
    }

    // Delete notification
    async deleteNotification(notificationId) {
        try {
            const response = await fetch(`${this.apiUrl}/notifications/${notificationId}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (data.success) {
                console.log('✅ Notification deleted');
                // Reload notifications and update badge
                await this.updateBadge();
                await this.loadNotifications();
            } else {
                console.error('Failed to delete notification');
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    }

    // Update notification badge
    async updateBadge() {
        const user = this.getCurrentUser();
        if (!user || !this.notificationBtn) return;

        try {
            const response = await fetch(`${this.apiUrl}/notifications/${user.userId}/unread-count`);
            const data = await response.json();

            if (data.success) {
                const count = data.data.count;
                
                // Remove existing badge
                const existingBadge = this.notificationBtn.querySelector('.notification-badge');
                if (existingBadge) {
                    existingBadge.remove();
                }

                // Add new badge if count > 0
                if (count > 0) {
                    const badge = document.createElement('span');
                    badge.className = 'notification-badge';
                    badge.textContent = count > 99 ? '99+' : count;
                    this.notificationBtn.appendChild(badge);
                }
            }
        } catch (error) {
            console.error('Error updating badge:', error);
        }
    }

    // Mark all notifications as read
    async markAllAsRead() {
        const user = this.getCurrentUser();
        if (!user) return;

        try {
            await fetch(`${this.apiUrl}/notifications/${user.userId}/read-all`, {
                method: 'PUT'
            });
            await this.updateBadge();
            await this.loadNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }

    // Toggle dropdown visibility
    toggleDropdown() {
        if (!this.notificationDropdown) return;
        
        this.notificationDropdown.classList.toggle('show');
        if (this.notificationDropdown.classList.contains('show')) {
            this.loadNotifications();
        }
    }

    // Hide dropdown
    hideDropdown() {
        if (this.notificationDropdown) {
            this.notificationDropdown.classList.remove('show');
        }
    }

    // Start polling for new notifications
    startPolling(interval = 30000) { // Poll every 30 seconds
        this.pollInterval = setInterval(async () => {
            await this.updateBadge();
        }, interval);
    }

    // Stop polling
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }
}

// Create global instance
const notificationManager = new NotificationManager();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    notificationManager.initialize();
});