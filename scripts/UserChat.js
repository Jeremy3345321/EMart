// Chat functionalities of User

class UserWithChat extends User {
    constructor(userId = null, userName = null, userPassword = null) {
        super(userId, userName, userPassword);
        this.conversations = []; // Array of user IDs they've chatted with
    }

    async sendMessage(toUserId, content) {
        const message = new Message(null, this.userId, toUserId, content);
        await Database.addMessage(message);
        console.log(`Message sent to user ${toUserId}`);
        return message;
    }

    async getChatWith(otherUserId) {
        return await Database.getConversation(this.userId, otherUserId);
    }

    async getAllConversations() {
        return await Database.getUserConversations(this.userId);
    }

    async getUnreadMessages() {
        return await Database.getUnreadMessages(this.userId);
    }

    async markConversationAsRead(otherUserId) {
        await Database.markConversationAsRead(this.userId, otherUserId);
    }
}


// USAGE EXAMPLE

/*
// Example: Sending a message
const user1 = await Database.getUserById(1);
const user2 = await Database.getUserById(2);

const message = new Message(null, user1.getUserId(), user2.getUserId(), "Hi! Is this item still available?");
await Database.addMessage(message);

// Get conversation between two users
const conversation = await Database.getConversation(user1.getUserId(), user2.getUserId());

// Get unread messages for a user
const unreadMessages = await Database.getUnreadMessages(user2.getUserId());

// Mark message as read
await Database.markMessageAsRead(message.getMessageId());

// Get all conversations for a user
const conversations = await Database.getUserConversations(user1.getUserId());
*/