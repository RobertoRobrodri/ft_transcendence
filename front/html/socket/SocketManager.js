export class SocketManager {
    constructor(path) {
        this.path = path;
    }

    connect() {
        // Prevent reconnection on navigation
        if(this.socket === undefined)
        {
            let token = sessionStorage.getItem('token');
            this.socket = new WebSocket(`wss://localhost:443/${this.path}/?token=${token}`);
            this.setupSocketEvents();
        }
    }

    disconnect()
    {
        const code = 3008;
        const reasson = 'Unexpected';
        if(this.socket.readyState === WebSocket.OPEN) {
            this.socket.close(code, reasson);
            this.socket = undefined;
        }
    }

    setupSocketEvents() {
        this.socket.addEventListener('open', (event) => {
            this.onOpen(event);
        });

        this.socket.addEventListener('message', (event) => {
            this.onMessage(JSON.parse(event.data));
        });

        this.socket.addEventListener('close', (event) => {
            this.onClose(event);
        });

        this.socket.addEventListener('error', (event) => {
            this.onError(event);
        });
    }

    send(sendType, sendMessage) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: sendType,
                message: sendMessage
            }));
        } else {
            console.error('WebSocket connection not open. Unable to send message:', sendMessage);
        }
    }

    onOpen(event) {}
    onMessage(data) {}
    onClose(event) {}
    onError(event) {}
}