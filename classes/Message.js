class Message {
    constructor(messageId = null, fromId = null, toId = null, content = null) {
        this.messageId = messageId;
        this.fromId = fromId;
        this.toId = toId;
        this.content = content;
        this.timestamp = new Date();
        this.isRead = false;
    }
}