import { SocketManager } from './SocketManager.js';
import { CHAT_TYPES, SOCKET } from './Constants.js';

export class ChatSocketManager extends SocketManager {
    constructor() {
        if (!ChatSocketManager.instance) {
            super('ws/chat');
            ChatSocketManager.instance = this;
            this.callbacks = {};
        }
        return ChatSocketManager.instance;
    }

    onOpen(event) {
        if (this.callbacks[SOCKET.CONNECTED]) {
            this.callbacks[SOCKET.CONNECTED].forEach(callback => callback(event));
        }
    }

    onClose(event) {
        if (this.callbacks[SOCKET.DISCONNECTED]) {
            this.callbacks[SOCKET.DISCONNECTED].forEach(callback => callback(event));
        }
    }
    
    onError(event)
    {
        console.error("estoy on error =(")
        if (this.callbacks[SOCKET.ERROR]) {
            this.callbacks[SOCKET.ERROR].forEach(callback => callback(event));
        }
    }

    onMessage(data) {
        if (this.callbacks[data.type])
            this.callbacks[data.type].forEach(callback => callback(data.message));
        else
            console.error(`Callback to ${data.type} not registered`)
    }
    
    // Register callbacks
    registerCallback(eventType, callback) {
        if (!this.callbacks[eventType]) {
            this.callbacks[eventType] = [];
        }
        this.callbacks[eventType].push(callback);
    }

    // Unregister callbacks
    unregisterCallback(eventType, callback) {
        if (this.callbacks[eventType]) {
            this.callbacks[eventType] = this.callbacks[eventType].filter(cb => cb !== callback);
        }
    }
}
