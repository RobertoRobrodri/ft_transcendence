
import { WebSocketManager } from "../socket/socket.js"

export function loadOnlineUsers() {
    const userListElement = document.getElementById('userList');

    const mockUserList = ['Usuario1', 'Usuario2', 'Usuario3'];

    mockUserList.forEach((username) => {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item');
        listItem.textContent = username;

        listItem.addEventListener('click', () => {
            openChatPopup(username);
        });

        userListElement.appendChild(listItem);
    });
}

export function openChatPopup(selectedUsername) {
    const socketManager = new WebSocketManager();
    socketManager.send('chat_with', `Abriendo chat con ${selectedUsername}`);
}