import { renewJWT } from "../components/updatejwt.js"
import { showNotification } from "../components/loader.js";
import { displayErrorList, displayMessage } from "../components/loader.js"
import { NotificationsSocketManager } from "../socket/NotificationsSocketManager.js"
import { CHAT_TYPES, FRIENDS } from '../socket/Constants.js';
import { connectNotifications, logOut} from '../index/index.js';

let NotificationsSM = new NotificationsSocketManager();

export function loadFriendsPage() {

    let loginPage = document.getElementById("root");
    Promise.all([
        fetch('./friends/friends.html').then(response => response.text()),
        fetch('./friends/friendsStyle.css').then(response => response.text())
    ]).then(([html, css]) => {
        window.location.hash = '#/friends';
        html += `<style>${css}</style>`;
        loginPage.innerHTML = html;
    }).catch(error => {
        console.error('Error al cargar el formulario:', error);
    });
    connectNotifications();
    loadUsersTable();
    FriendRequestListener();
}

async function loadUsersTable() {
    const token = sessionStorage.getItem('token')
    let { hash } = location;
    if (hash !== '#/friends')
        return ;
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
                    <td><button type="button" class="btn btn-danger" id=DELETE_${friend.id}>Delete</button></td>
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
                <td>${request.username}</td>
                <td>
                    <button type="button" class="btn btn-success" id=ACCEPT_${request.id}>Accept</button>
                    <button type="button" class="btn btn-danger" id=DECLINE_${request.id}>Decline</button>
                </td>
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
        console.log(data)
        NotificationsSM.send(FRIENDS.FRIEND_REQUEST_SENT, data.friend_id );
    } catch (error) {
        displayErrorList(error.message, 'FriendRequestForm');
    }
}

async function HandleFriendRequest(action, id) {
    const token = sessionStorage.getItem('token');
    const FriendData = {
        action: action,
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
        loadUsersTable();
        let nt_action = action === 'DECLINE' ? FRIENDS.FRIEND_REQUEST_DECLINED : FRIENDS.FRIEND_REQUEST_ACCEPTED;
        NotificationsSM.send(nt_action, id);
    }
    catch (error) {
        // displayErrorList(JSON.parse(error.message), 'FriendRequestForm');
        console.log(error)
    }
}

async function DeleteFriend(id) {
    const token = sessionStorage.getItem('token');
    try {
        const response = await fetch(`/api/friends/${id}/delete_friend/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        })
        if (!response.ok) {
            const error = await response.json();
            throw new Error(JSON.stringify(error));
        }
        const data = await response.json();
        console.log(data);
        loadUsersTable();
    }
    catch (error) {
        // displayErrorList(JSON.parse(error.message), 'FriendRequestForm');
        console.log(error)
    }
}

function HandleClickEvent(e) {
    let target = e.target.id.split('_');
    if (target[0] === 'DECLINE' || target[0] === 'ACCEPT')
        HandleFriendRequest(target[0], target[1]) ;
    else if (target[0] === 'DELETE')
        DeleteFriend(target[1])
}

NotificationsSM.registerCallback(FRIENDS.STATUS_DISCONNECTED, user => {
    loadUsersTable();
});

NotificationsSM.registerCallback(FRIENDS.STATUS_CONNECTED, user => {
    loadUsersTable();
});

NotificationsSM.registerCallback(FRIENDS.FRIEND_REQUEST_RECEIVED,  data => {
    showNotification(data);
    loadUsersTable();
});

NotificationsSM.registerCallback(FRIENDS.FRIEND_REQUEST_ACCEPTED,  data => {
    showNotification(data);
    loadUsersTable();
});

NotificationsSM.registerCallback(FRIENDS.FRIEND_REQUEST_DECLINED,  data => {
    showNotification(data);
});

function FriendRequestListener() {
    document.getElementById('root').addEventListener('submit', sendFriendRequest);
    document.getElementById('root').addEventListener('click', HandleClickEvent);
    document.getElementById('root').addEventListener('click', logOut);
}
