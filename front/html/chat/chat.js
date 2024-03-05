
import { ChatSocketManager } from "../socket/ChatSocketManager.js"
import { CHAT_TYPES, SOCKET } from '../socket/Constants.js';
import { remove_session } from "../components/updatejwt.js"

// Singleton socket instance
let chatSM = new ChatSocketManager();

export function connectChat()
{
    chatSM.connect();
}

///////////////////////
// Socket rcv events //
///////////////////////

// Callback socket connected
chatSM.registerCallback(SOCKET.CONNECTED, event => {
    console.log('Socket connected:', event);
    // Request all connected users
    chatSM.send(CHAT_TYPES.GET_USERS);
});

// Callback socket disconnected
chatSM.registerCallback(SOCKET.DISCONNECTED, event => {
    console.log('Socket connection lost:', event);
});

// Callback socket error
chatSM.registerCallback(SOCKET.ERROR, event => {
    console.log('Expired JWT token. Redirecting to login.');
    remove_session();
    //window.location.href = '/login';
});

// Callback rcv all connected users
chatSM.registerCallback(CHAT_TYPES.USER_LIST, userList => {
    populateChat(userList)
});

// Callback rcv all connected users
chatSM.registerCallback(CHAT_TYPES.USER_CONNECTED, user => {
    addSingleUser(user)
});

// Callback rcv all connected users
chatSM.registerCallback(CHAT_TYPES.USER_DISCONNECTED, user => {
    removeSingleUser(user)
});


/////////////////
// Manage chat //
/////////////////

// Load all chat users
export function populateChat(userList) {
    userList.forEach((username) => {
        addSingleUser(username)
    });
}



export function openChatPopup(selectedUsername) {
    chatSM.send('chat_with', `Abriendo chat con ${selectedUsername}`);
}

//////////////////
// UI FUNCTIONS //
//////////////////
export function loadChat()
{
	let mainPage = document.getElementById("sidebar");
    Promise.all([
        fetch('./chat/chat.html').then(response => response.text()),
    ]).then(([html]) => {
        mainPage.innerHTML = html;
        connectChat();
    }).catch(error => {
        console.error('Error al cargar el formulario:', error);
    });
}

// Add new item to chat
export function addSingleUser(username) {
    const userListElement = document.getElementById('userList');
    const listItem = document.createElement('li');
    listItem.classList.add('nav-item');  // Cambiado para que coincida con la estructura del menú
    const link = document.createElement('a');
    link.classList.add('nav-link');
    link.textContent = username;
    link.addEventListener('click', () => {
        openChatPopup(username);
    });
    listItem.appendChild(link);
    userListElement.appendChild(listItem);
}

// Remove item from chat
export function removeSingleUser(username) {
    const userListElement = document.getElementById('userList');
    const listItem = Array.from(userListElement.children).find(element => {
        const link = element.querySelector('.nav-link');
        return link && link.textContent.trim() === username;
    });

    if (listItem) {
        userListElement.removeChild(listItem);
    }
}