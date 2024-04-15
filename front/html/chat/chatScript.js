
import { ChatSocketManager } from "../socket/ChatSocketManager.js"
import { GameSocketManager } from "../socket/GameSocketManager.js"
import { CHAT_TYPES, GAME_TYPES, SOCKET } from '../socket/Constants.js';
import { renewJWT } from "../components/updatejwt.js"

// Singleton socket instance
let chatSM = new ChatSocketManager();
let gameSM = new GameSocketManager();
let generalMessages = [];
let selectedChat = "general";
let myUserId = null;
let myUsername = null;

export function init() {
    connectChat();
    document.getElementById('root').addEventListener('click', chatEventHandler);
    // Message send
    const input = document.querySelector('.chat-message input');
    input.addEventListener('keydown', function(event) {
        // Verificar si la tecla presionada es Enter (código 13)
        if (event.keyCode === 13) {
            sendMessage(input);
        }
    });
}

function chatEventHandler(e) {
    if (e.target.matches('#red-myWindowChat') === true)
        disconnect();
    else if (e.target.closest('#chatList')) {
        const clickedListItem = e.target.closest('li');
        if (clickedListItem) {
            const id = clickedListItem.id;
            selectedChat = id;
            clearConversation();
            //If clicked item is general chat
            if(id == "general") {
                loadChatMessages();
                clearUnreadCount("general");
            } else {               //If clicked item is user
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
}

function connectChat() {
    chatSM.connect();
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
    populateChat(userList);
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
chatSM.registerCallback(CHAT_TYPES.IGNORE_LIST, data => {
    data.forEach((username) => {
        console.log(`Ignored username: ${username}`);
    });
});

// Callback someone request play a game
chatSM.registerCallback(CHAT_TYPES.GAME_REQUEST, data => {
    console.log(data);
    //show message to acept or something... then
    chatSM.send(CHAT_TYPES.ACCEPT_GAME, data.sender);
});

// Callback someone request play a game
chatSM.registerCallback(CHAT_TYPES.ACCEPT_GAME, data => {
    // Now the users are connected to room in game, open game window if are closed, send RESTORE_GAME to join to the created room, and then, send PLAYER_READY (remember do in game socket)
    //i do all automatically for test propusses
    console.log("ACCEPT_GAME")
    gameSM.send(GAME_TYPES.RESTORE_GAME);
    gameSM.send(GAME_TYPES.PLAYER_READY);

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

// Load all chat users
function populateChat(userList) {
    userList.forEach((user) => {
        addSingleUser(user)
    });
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
function addSingleUser(user) {
    const chatList = document.getElementById('chatList');
    const listItem = document.createElement('li');
    listItem.id = user.id;
    listItem.className = 'clearfix';
    listItem.innerHTML = `
        <img src="${user.image}">
            <div class="about">
                <div class="name">${user.username}</div>
                <div class="unread"></div>
            </div>
    `;
    chatList.appendChild(listItem);
}

// Remove item from chat
function removeSingleUser(user) {
    const userListElement = document.getElementById('chatList');
    const listItem = document.getElementById(user.id);
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
    console.log(scrollDifference)

    if (scrollDifference <= threshold) {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
}
