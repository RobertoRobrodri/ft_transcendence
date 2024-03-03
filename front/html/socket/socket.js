export class WebSocketManager {
    constructor() {
        if (!WebSocketManager.instance) {
			let token = sessionStorage.getItem('token');
            this.socket = new WebSocket(`ws://localhost:8000/ws/game/?token=${token}`);
            this.setupSocketEvents();
            WebSocketManager.instance = this;
        }

        return WebSocketManager.instance;
    }

    setupSocketEvents() {
        this.socket.addEventListener('open', (event) => {
            console.log('WebSocket connection opened:', event);
			// socket.send(JSON.stringify({
			// 	type: 'authenticate',
			// 	token: sessionStorage.getItem('token'),
			// }));
        });

        this.socket.addEventListener('message', (event) => {
            console.log('WebSocket message received:', event.data);

            //process messages here

        });

        this.socket.addEventListener('close', (event) => {
            console.log('WebSocket connection closed:', event);
        });

        this.socket.addEventListener('error', (event) => {
            console.error('WebSocket error:', event);
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
}