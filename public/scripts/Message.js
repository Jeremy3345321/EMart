class Message {
    constructor(messageId = null, fromId = null, toId = null, content = null) {
        this.messageId = messageId;
        this.fromId = fromId;
        this.toId = toId;
        this.content = content;
        this.timestamp = new Date();
        this.isRead = false;
    }

    // Getters and setters
    getMessageId() {
        return this.messageId;
    }

    setMessageId(value) {
        this.messageId = value;
    }

    getFromId() {
        return this.fromId;
    }

    setFromId(value) {
        this.fromId = value;
    }

    getToId() {
        return this.toId;
    }

    setToId(value) {
        this.toId = value;
    }

    getContent() {
        return this.content;
    }

    setContent(value) {
        this.content = value;
    }

    getTimestamp() {
        return this.timestamp;
    }

    setTimestamp(value) {
        this.timestamp = value;
    }

    getIsRead() {
        return this.isRead;
    }

    setIsRead(value) {
        this.isRead = value;
    }
}