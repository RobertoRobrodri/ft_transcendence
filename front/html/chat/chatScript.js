
import { ChatSocketManager } from "../socket/ChatSocketManager.js"
import { GameSocketManager } from "../socket/GameSocketManager.js"
import { CHAT_TYPES, GAMES, GAME_TYPES, SOCKET } from '../socket/Constants.js';
import { renewJWT } from "../components/updatejwt.js"
import { createWindow } from "../index/index.js"

// Singleton socket instance
let chatSM = new ChatSocketManager();
let gameSM = new GameSocketManager();
let generalMessages = [];
let selectedChat = "general";
let selectedList = "users";
let myUserId = null;
let myUsername = null;

export function init() {
    connectChat();
    document.getElementById('root').addEventListener('click', chatEventHandler);
    // Message send
    const input = document.querySelector('.chat-message input');
    input.addEventListener('keydown', function(event) {
        // Press enter key
        if (event.keyCode === 13) {
            sendMessage(input);
        }
    });
    setupNav();
    let options = document.getElementById("chatoptions");
    options.classList.add('d-none');
}

function setupNav() {
    const navLinks = document.querySelectorAll('.nav-link');
    const userList = document.getElementById('chatList');
    const blockedList = document.getElementById('blockedList');
    const game_req = document.getElementById('game_request_a');
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            userList.classList.add('d-none');
            blockedList.classList.add('d-none');

            const listToShow = this.getAttribute('data-list');
            if (listToShow === 'users') {
                userList.classList.remove('d-none');
                navLinks.forEach(navLink => {
                    navLink.classList.remove('active');
                });
                selectedList = "users";
                this.classList.add('active');
                game_req.classList.remove('d-none');
            } else if (listToShow === 'blocked') {
                blockedList.classList.remove('d-none');
                navLinks.forEach(navLink => {
                    navLink.classList.remove('active');
                });
                this.classList.add('active');
                selectedList = "blocked";
                game_req.classList.add('d-none');

            }
        });
    });
}

function chatEventHandler(e) {
    if (e.target.matches('#red-myWindowChat') === true)
        disconnect();
    else if (e.target.closest('#chatList') || e.target.closest('#blockedList')) {
        const clickedListItem = e.target.closest('li');
        let options = document.getElementById("chatoptions");
        if (clickedListItem) {
            const id = clickedListItem.id.replace("blockedList_", "").replace("chatList_", "");
            selectedChat = id;
            clearConversation();
            //If clicked item is general chat
            if(id == "general") {
                options.classList.add('d-none');
                loadChatMessages();
                clearUnreadCount("general");
            } else { //If clicked item is user block
                options.classList.remove('d-none');
                loadPrivateChat(id);
                clearUnreadCount(id);
            }
            //change active
            const listItems = document.querySelectorAll('#chatList li');
            listItems.forEach(item => {
                item.classList.remove('active');
            });
            clickedListItem.classList.add('active');
            // Set "head" name and image
            const imgUrl = clickedListItem.querySelector('img').src;
            const name = clickedListItem.querySelector('.name').textContent;
            const chatTopImage = document.getElementById('chatTopImage');
            const chatTopName = document.getElementById('chatTopName');
            chatTopImage.src = imgUrl;
            chatTopName.textContent = name;
        }
    }
    else if (e.target.matches('#game_request') || e.target.matches('#game_request_a')) {
        chatSM.send(CHAT_TYPES.GAME_REQUEST, {
            "rival": selectedChat,
            "game": GAMES.PONG
        });
    }
    else if (e.target.matches('#ban_unban') || e.target.matches('#ban_unban_a')) {
        if (selectedChat == "general")
            return;
        if(selectedList == "users"){
            chatSM.send(CHAT_TYPES.IGNORE_USER, selectedChat);
            const chatTopImage = document.getElementById('chatTopImage');
            const chatTopName = document.getElementById('chatTopName');
            let user = {
                id: selectedChat,
                image: chatTopImage.src,
                username: chatTopName.textContent
            }
            addSingleUser(user, "blockedList")
        }
        else if(selectedList == "blocked") {
            chatSM.send(CHAT_TYPES.UNIGNORE_USER, selectedChat);
            removeSingleUser({id: selectedChat}, 'blockedList')
        }
    }
}

function showGameRequest(data) {
    var modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `${data.sender_name} want to play pong with you!`;

    // Obtener referencias a los botones de aceptar y cancelar
    var acceptButton = document.getElementById('acceptButton');
    var cancelButton = document.getElementById('cancelButton');

    // Escuchar el clic en el botón de aceptar
    acceptButton.addEventListener('click', function() {
        chatSM.send(CHAT_TYPES.ACCEPT_GAME, data.sender);
        myModal.hide();
    });

    // Escuchar el clic en el botón de cancelar
    cancelButton.addEventListener('click', function() {
        chatSM.send(CHAT_TYPES.REJECT_GAME, data.sender);
        myModal.hide();
    });

    // Mostrar el modal
    var myModal = new bootstrap.Modal(document.getElementById('gameRequestModal'), {
        backdrop: false
    });
    myModal.show();
}

function connectChat() {
    if(chatSM.connect() == chatSM.SOCKETSTATUS.ALREADY_CONNECTED) {
        chatSM.send(CHAT_TYPES.USER_LIST);
    }
}

function disconnect() {
    chatSM.disconnect();
}

///////////////////////
// Socket rcv events //
///////////////////////

// Callback socket connected
chatSM.registerCallback(SOCKET.CONNECTED, event => {
    // Request all connected users
    chatSM.send(CHAT_TYPES.USER_LIST);
    chatSM.send(CHAT_TYPES.IGNORE_LIST);
});

// ! When calling disconnect this is triggered
// Callback socket disconnected
// chatSM.registerCallback(SOCKET.DISCONNECTED, event => {
//     console.log('Socket connection lost:', event);
//     renewJWT();
//     chatSM.connect();
// });

// Callback socket error
chatSM.registerCallback(SOCKET.ERROR, event => {
    console.log('Expired JWT token. Redirecting to login.');
    // remove_session();
    renewJWT();
    chatSM.connect();
});

// Callback rcv all connected users
chatSM.registerCallback(CHAT_TYPES.USER_LIST, userList => {
    userList.forEach((user) => {
        addSingleUser(user)
    });
});

// Callback rcv connected user
chatSM.registerCallback(CHAT_TYPES.USER_CONNECTED, user => {
    addSingleUser(user);
});

// Callback rcv user disconnected
chatSM.registerCallback(CHAT_TYPES.USER_DISCONNECTED, user => {
    removeSingleUser(user);
});

// Callback rcv message in general channel
chatSM.registerCallback(CHAT_TYPES.GENERAL_MSG, data => {
    addGeneralMsg(data);
});

// Callback rcv private message
chatSM.registerCallback(CHAT_TYPES.PRIV_MSG, data => {
    addPrivateMsg(data);

    // When message are received, send request to backend to mark as seen
    chatSM.send(CHAT_TYPES.SEEN_MSG, data.sender);
});

// Callback get private message specific any user
chatSM.registerCallback(CHAT_TYPES.LIST_MSG, data => {
    fillHistoryMsg(data);
});

// Callback get list of ignored users
chatSM.registerCallback(CHAT_TYPES.IGNORE_LIST, blockedList => {

    blockedList.forEach((user) => {
        addSingleUser(user, "blockedList")
    });
});

// Callback someone request play a game
chatSM.registerCallback(CHAT_TYPES.GAME_REQUEST, data => {
    
    showGameRequest(data);
    console.log(data);
    //show message to acept or something... then
    //chatSM.send(CHAT_TYPES.ACCEPT_GAME, data.sender);
});

// Callback someone request play a game
chatSM.registerCallback(CHAT_TYPES.ACCEPT_GAME, data => {
    createWindow('Game');
});

chatSM.registerCallback(CHAT_TYPES.MY_DATA, data => {
    myUserId = data.id;
    myUsername = data.username;
});


/////////////////
// Manage chat //
/////////////////

function inviteToGame() {
    var rival = document.getElementById("dstUser");
    chatSM.send(CHAT_TYPES.GAME_REQUEST, {
        rival: rival.value,
        game: "Pong"
    });
}

function getIgnoreList() {
    chatSM.send(CHAT_TYPES.IGNORE_LIST);
}

function ignoreUser() {
    var userToIgnore = document.getElementById("dstUser");
    chatSM.send(CHAT_TYPES.IGNORE_USER, userToIgnore.value);
}

function unignoreUser() {
    var userToUnignore = document.getElementById("dstUser");
    chatSM.send(CHAT_TYPES.UNIGNORE_USER, userToUnignore.value);
}

function sendMessage(input) {
    const mensaje = input.value.trim();
    if (mensaje === '')
        return;
    // Send global msg
    if (selectedChat == "general") {
        chatSM.send(CHAT_TYPES.GENERAL_MSG, mensaje);
    } else {
        chatSM.send(CHAT_TYPES.PRIV_MSG, {
            recipient: selectedChat,
            message: mensaje
        });
    }
    input.value = "";
}

function loadPrivateChat(id) {
    chatSM.send(CHAT_TYPES.LIST_MSG, id);

}

function loadChatMessages() {
    generalMessages.forEach(function(data) {
        addSingleMessage(`${data.sender_name}: ${data.message}`, data.sender != myUserId)
    });
}

//////////////////
// UI FUNCTIONS //
//////////////////

function incrementUnreadCount(itemId) {
    const listItem = document.getElementById(itemId);
    if (listItem) {
        const unreadElement = listItem.querySelector('.unread');
        let unreadCount = parseInt(unreadElement.textContent.replace(/[()]/g, '')) || 0;
        unreadCount++;
        unreadElement.textContent = `(${unreadCount})`;
    }
}

function clearUnreadCount(itemId) {
    const listItem = document.getElementById(itemId);
    if (listItem) {
        const unreadElement = listItem.querySelector('.unread');
        unreadElement.textContent = '';
    }
}

// Add new item to chat
function addSingleUser(user, list = "chatList") {
    const id = list + "_" + user.id;
    const exist = document.getElementById(id);
    if(exist)
        return;
    const chatList = document.getElementById(list);
    const listItem = document.createElement('li');
    listItem.id = id;
    listItem.className = 'clearfix';
    if(user.image == "")
        user.image = "./assets/gigachad.jpg";
    listItem.innerHTML = `
        <img src="${user.image}">
            <div class="about">
                <div class="name">${user.username}</div>
                <div class="unread"></div>
            </div>
    `;
    chatList.appendChild(listItem);
}

function removeAllUsers(list = "chatList") {
    const chatList = document.getElementById(list);
    // Remover todos los elementos hijos de la lista
    while (chatList.firstChild) {
        chatList.removeChild(chatList.firstChild);
    }
}

// Remove item from chat
function removeSingleUser(user, list = 'chatList') {
    const userListElement = document.getElementById(list);
    const listItem = document.getElementById(list + "_" + user.id);
    if (listItem)
        userListElement.removeChild(listItem);
}

// Add general message test
function addGeneralMsg(data) {
    if (selectedChat === "general") {
        addSingleMessage(`${data.sender_name}: ${data.message}`, data.sender != myUserId)
    } else {
        
        incrementUnreadCount("general");
    }
    generalMessages.push(data);
    if (generalMessages.length > 50)
        generalMessages.shift();
}

function addSingleMessage(messageText, outgoing = false) {
    const chatHistoryList = document.querySelector('.chat-history ul');
    const newMessageItem = document.createElement('li');
    newMessageItem.className = 'clearfix';
    const messageDiv = document.createElement('div');
    if(outgoing)
        messageDiv.className = 'message my-message';
    else
        messageDiv.className = 'message other-message float-right';
    messageDiv.textContent = messageText;
    newMessageItem.appendChild(messageDiv);
    chatHistoryList.appendChild(newMessageItem);
    scrollToBottomIfNeeded();
}

function clearConversation() {
    const chatHistoryList = document.querySelector('.chat-history ul');
    chatHistoryList.innerHTML = '';
}

// Add private message
function addPrivateMsg(data) {
    if (selectedChat == data.sender || selectedChat == data.recipient)
    {
        addSingleMessage(`${data.message}`, selectedChat != data.recipient);
    } else {
        // set/increase unread messages
        incrementUnreadCount(data.sender);
    }
}


// Add history message
function fillHistoryMsg(data) {
    clearConversation();
    data.reverse();
    data.forEach((message) => {
        addSingleMessage(`${message.message}`, message.sender != myUserId)
    });
}

function scrollToBottomIfNeeded() {
    const chatHistory = document.querySelector('.chat-history');
    const scrollDifference = chatHistory.scrollHeight - (chatHistory.scrollTop + chatHistory.clientHeight);
    const threshold = 100;

    if (scrollDifference <= threshold) {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
}
