import { SocketManager } from './SocketManager.js';
import { SOCKET } from './Constants.js';

export class NotificationsSocketManager extends SocketManager {
    constructor() {
        if (!NotificationsSocketManager.instance) {
            super('ws/notifications');
            NotificationsSocketManager.instance = this;
            this.callbacks = {};
        }
        return NotificationsSocketManager.instance;
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
