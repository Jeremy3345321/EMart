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