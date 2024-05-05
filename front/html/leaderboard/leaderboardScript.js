import { renewJWT } from "../components/updatejwt.js"
import { showNotification } from "../components/loader.js";
import { displayErrorList, displayMessage } from "../components/loader.js"
import { NotificationsSocketManager } from "../socket/NotificationsSocketManager.js"
import { connectNotifications, logOut } from '../index/index.js';

let NotificationsSM = new NotificationsSocketManager();

export function loadLeaderboardPage() {

    // Remove previous styles
    const existingStyles = document.head.querySelectorAll('style');
    existingStyles.forEach(style => {
        document.head.removeChild(style);
    });
    
    let loginPage = document.getElementById("root");
    Promise.all([
        fetch('./leaderboard/leaderboard.html').then(response => response.text()),
        fetch('./leaderboard/leaderboardStyle.css').then(response => response.text()),
        import('./leaderboardScript.js').then(module => module)
    ]).then(([html, css, javascript]) => {
        window.location.hash = '#/leaderboard';
        html += `<style>${css}</style>`;
        loginPage.innerHTML = html;
        connectNotifications();
		loadLeaderboardTable();
        //Aqui gestionamos el logOut
        document.getElementById('root').addEventListener('click', logOut);
    }).catch(error => {
        console.error('Error al cargar el formulario:', error);
    });
    
}

async function loadLeaderboardTable() {
    const token = sessionStorage.getItem('token');
    try {
        const response = await fetch('/api/user_management/user_list_all/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const userInfo = await response.json();
        let users = userInfo;

        // Sort users based on Elo scores
        users.sort((a, b) => b.elo - a.elo);
        let pongTableBody = document.getElementById("pong-table-body");
        pongTableBody.innerHTML = "";
        users.forEach(user => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.elo}</td>
            `;
            pongTableBody.appendChild(row);
        });

        // Sort users based on pool ranking
        users.sort((a, b) => b.elo_pool - a.elo_pool);
        let poolTableBody = document.getElementById("pool-table-body");
        poolTableBody.innerHTML = "";
        users.forEach(user => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.elo_pool}</td>
            `;
            poolTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error:', error.message);
        renewJWT();
    }
}
