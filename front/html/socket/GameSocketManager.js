import { SocketManager } from './SocketManager.js';

export class GameSocketManager extends SocketManager {
    constructor() {
        if (!GameSocketManager.instance) {
            super('ws/game');
            GameSocketManager.instance = this;
        }
        return GameSocketManager.instance;
    }

    onMessage(message) {
        console.log('Mensaje del juego:', message);
    }

}
