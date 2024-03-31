
import { ChatSocketManager } from "../socket/ChatSocketManager.js"
import { GameSocketManager } from "../socket/GameSocketManager.js"
import { CHAT_TYPES, GAME_TYPES, SOCKET } from '../socket/Constants.js';
import { renewJWT } from "../components/updatejwt.js"

// function register() {
//     document.getElementById("ignorelist").addEventListener("click", getIgnoreList);
//     document.getElementById("Ignore").addEventListener("click", ignoreUser);
//     document.getElementById("Unignore").addEventListener("click", unignoreUser);
//     document.getElementById("disconnect").addEventListener("click", disconnect);
//     document.getElementById("send-button").addEventListener("click", sendMessage);
//     document.getElementById("sendPrivMessageBtn").addEventListener("click", sendPrivMessage);
//     document.getElementById("insiteToGame").addEventListener("click", inviteToTame);
//}

// Singleton socket instance
let chatSM = new ChatSocketManager();
let gameSM = new GameSocketManager();

export function connectChat()
{
    chatSM.connect();
}

function disconnect()
{
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

// Callback socket disconnected
chatSM.registerCallback(SOCKET.DISCONNECTED, event => {
    console.log('Socket connection lost:', event);
    renewJWT();
    chatSM.connect();
});

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
    chatSM.send(CHAT_TYPES.SEEN_MSG, JSON.stringify({
        sender: data.sender
    }));
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


/////////////////
// Manage chat //
/////////////////

function inviteToTame()
{
    var rival = document.getElementById("dstUser");
    chatSM.send(CHAT_TYPES.GAME_REQUEST, rival.value);
}

function getIgnoreList()
{
    chatSM.send(CHAT_TYPES.IGNORE_LIST);
}

function ignoreUser()
{
    var userToIgnore = document.getElementById("dstUser");
    chatSM.send(CHAT_TYPES.IGNORE_USER, JSON.stringify({
        user: userToIgnore.value
    }));
}

function unignoreUser()
{
    var userToUnignore = document.getElementById("dstUser");
    chatSM.send(CHAT_TYPES.UNIGNORE_USER, JSON.stringify({
        user: userToUnignore.value
    }));
}

// Load all chat users
function populateChat(userList) {
    userList.forEach((user) => {
        addSingleUser(user)
    });
}

// Example to send a global message
export function sendMessage(e) {
    if (e.target.matches('#send-button') === false)
        return ;
    e.preventDefault();
    var input = document.getElementById("newMessage");
    chatSM.send(CHAT_TYPES.GENERAL_MSG, input.value);
    input.value = "";
}

// Example to send a message to a specific user
function sendPrivMessage() {
    var dstUser = document.getElementById("dstUser");
    var input = document.getElementById("newPrivMessage");
    chatSM.send(CHAT_TYPES.PRIV_MSG, JSON.stringify({
        recipient: dstUser.value,
        message: input.value
    }));
    input.value = "";
}

// Example to request chat history from this user
export function requestHistory(user) {
    var dstUser = document.getElementById("dstUser");
    dstUser.value = user.id;
    
    chatSM.send(CHAT_TYPES.LIST_MSG, JSON.stringify({
        recipient: dstUser.value
    }));
}

//////////////////
// UI FUNCTIONS //
//////////////////

// Add new item to chat
export function addSingleUser(user) {
    const userListElement = document.getElementById('userList');
    const listItem = document.createElement('li');
    listItem.classList.add('nav-item');  // Cambiado para que coincida con la estructura del menú
    const link = document.createElement('a');
    link.classList.add('nav-link');
    link.textContent = user.username;
	link.id = user.id;
    link.addEventListener('click', () => {
        requestHistory(user);
    });
    listItem.appendChild(link);
    userListElement.appendChild(listItem);
}

// Remove item from chat
export function removeSingleUser(user) {
    const userListElement = document.getElementById('userList');
    const listItem = Array.from(userListElement.children).find(element => {
        const link = element.querySelector('.nav-link');
        return link && link.id === String(user.id);
    });

    if (listItem) {
        userListElement.removeChild(listItem);
    }
}

// Add general message test
export function addGeneralMsg(data) {
    var userList = document.getElementById("general_msg");
    var newmsg = document.createElement("li");
    newmsg.textContent = `${data.sender}: ${data.message}`;
    newmsg.classList.add("list-group-item");
    userList.appendChild(newmsg);
}

// Add private message
export function addPrivateMsg(data) {
    var userList = document.getElementById("private_msg");
    var newmsg = document.createElement("li");
    newmsg.textContent = `${data.sender}: ${data.message}`;
    newmsg.classList.add("list-group-item");
    userList.appendChild(newmsg);
}

// Add history message
export function fillHistoryMsg(data) {
    var messageHistory = document.getElementById("private_msg_history");

    // Remove previous li elements
    while (messageHistory.firstChild)
        messageHistory.removeChild(messageHistory.firstChild);
    
    data.forEach((message) => {
        var newmsg = document.createElement("li");
        newmsg.textContent = `${message.sender}: ${message.message}`;
        newmsg.classList.add("list-group-item");
        messageHistory.appendChild(newmsg);
        // Get message time example
        var date = new Date(message.timestamp);
        var formattedDate = date.toLocaleString();
    });
}