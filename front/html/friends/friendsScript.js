import { renewJWT } from "../components/updatejwt.js"
import { displayErrorList } from "../components/loader.js"



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
    loadUsersTable();
    FriendRequestListener();

}

async function loadUsersTable() {

    const token = sessionStorage.getItem('token')
    try {
        // TODO: Cambiar la api por la que obtiene los usuarios
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
                <td>${request.id}</td>
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
    const token = sessionStorage.getItem('token')
    if (e.target.matches('#FriendRequestForm') === false)
        return;
    e.preventDefault()
    // Get the input values
    const new_friend = {
        receiver: document.querySelector('#new_friend').value,
    }
    try {
        const response = await fetch('/api/friends/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }, body: JSON.stringify(new_friend),
        })
        if (!response.ok) {
            const error = await response.json();
            throw new Error(JSON.stringify(error));
        }
        const data = await response.json();
        console.log(data);
    }
    catch (error) {
        displayErrorList(JSON.parse(error.message), 'FriendRequestForm');
    }
}

function FriendRequestListener() {
    document.getElementById('root').addEventListener('submit', sendFriendRequest);
}