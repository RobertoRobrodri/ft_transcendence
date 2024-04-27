import { renewJWT } from "../components/updatejwt.js"
import { displayErrorList, displayMessage } from "../components/loader.js"
import { NotificationsSocketManager } from "../socket/NotificationsSocketManager.js"
import { CHAT_TYPES, FRIENDS } from '../socket/Constants.js';
import { connectNotifications } from '../index/index.js';

let NotificationsSM = new NotificationsSocketManager();

export function loadFriendsPage() {

    // Remove previous styles
    const existingStyles = document.head.querySelectorAll('style');
    existingStyles.forEach(style => {
        document.head.removeChild(style);
    });

    let loginPage = document.getElementById("root");
    Promise.all([
        fetch('./friends/friends.html').then(response => response.text()),
        fetch('./friends/friendsStyle.css').then(response => response.text())
    ]).then(([html, css]) => {
        window.location.hash = '#/friends';
        loginPage.innerHTML = html;
        let style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }).catch(error => {
        console.error('Error al cargar el formulario:', error);
    });
    connectNotifications();
    loadUsersTable();
    FriendRequestListener();
}

async function loadUsersTable() {

    const token = sessionStorage.getItem('token')
    try {
        const response = await fetch('/api/user_management/user_list/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        }
        );
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const userInfo = await response.json();
        let friends = userInfo.friends;
        let userTableBody = document.getElementById("user-table-body");
        userTableBody.innerHTML = "";

        friends.forEach(friend => {
            const row = document.createElement("tr");
            row.innerHTML = `
                    <td>${friend.username}</td>
                    <td>${friend.status}</td>
            `;
            userTableBody.appendChild(row);
        });
        // List friend requests
        let requests = userInfo.friend_requests
        let requestTableBody = document.getElementById("request-table-body");
        requestTableBody.innerHTML = "";

        requests.forEach(request => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${request.id}
                    <button type="button" class="btn btn-success" id=ACCEPT_${request.id}>Accept</button>
                    <button type="button" class="btn btn-danger" id=DECLINE_${request.id}>Decline</button>
                </td>
                <td>${request.username}</td>
            `;
            requestTableBody.appendChild(row);
        });
    }
    catch (error) {
        console.error('Error:', error.message);
        renewJWT();
    }
}

async function sendFriendRequest(e) {
    const token = sessionStorage.getItem('token');
    if (!e.target.matches('#FriendRequestForm'))
        return;
    e.preventDefault();

    // Get the input values
    const new_friend = {
        receiver: document.querySelector('#new_friend').value,
    };

    try {
        const response = await fetch('/api/friends/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(new_friend),
        });

        const notificationDiv = document.getElementById('friendRequestNotification');
        notificationDiv.style.display = 'block'; // Make the notification visible

        if (!response.ok) {
            const error = await response.json();
            notificationDiv.textContent = 'Error: ' + error.message;
            notificationDiv.className = 'notification error';
            console.log(error, error.message);
            throw new Error(JSON.stringify(error));
        }
        
        const data = await response.json();
        notificationDiv.textContent = data.message;
        notificationDiv.className = 'notification success';
        NotificationsSM.send(FRIENDS.FRIEND_REQUEST_SENT, data.friend_id);
    } catch (error) {
        displayErrorList(error.message, 'FriendRequestForm');
    }
}

async function HandleFriendRequest(e) {
    const token = sessionStorage.getItem('token');
    let target = e.target.id.split('_');
    if (target[0] !== 'DECLINE' && target[0] !== 'ACCEPT')
        return ;
    let id = target[1];
    const FriendData = {
        action: target[0],
    };
    try {
        const response = await fetch(`/api/friends/${id}/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }, body: JSON.stringify(FriendData),
        })
        if (!response.ok) {
            const error = await response.json();
            throw new Error(JSON.stringify(error));
        }
        const data = await response.json();
        console.log(data);
        loadFriendsPage();
    }
    catch (error) {
        // displayErrorList(JSON.parse(error.message), 'FriendRequestForm');
        console.log(error)
    }
}

NotificationsSM.registerCallback(CHAT_TYPES.USER_DISCONNECTED, user => {
    loadUsersTable();
});

NotificationsSM.registerCallback(CHAT_TYPES.USER_CONNECTED, user => {
    console.log('User connected')
    loadUsersTable();
});

NotificationsSM.registerCallback(CHAT_TYPES.FRIEND_REQUEST_SENT,  data => {
    console.log('Friend request received')
    console.log(data)
});

function FriendRequestListener() {
    document.getElementById('root').addEventListener('submit', sendFriendRequest);
    document.getElementById('root').addEventListener('click', HandleFriendRequest);
}
