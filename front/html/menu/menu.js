import { WebSocketManager } from "../socket/socket.js"
import { loadOnlineUsers } from "../chat/chat.js"

export async function loadUserInfo() {
    const token = sessionStorage.getItem('token')
    try {
        const response = await fetch('http://localhost:80/api/user_management/user_list/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }}
        );
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        let username = data.username;
        let user_info = document.getElementById("user_info");
        let user_updated = user_info.innerHTML.replace(/{{USERNAME}}/g, username);
        user_info.innerHTML = user_updated;
    }
    catch (error) {
        console.error('Error:', error.message);
        // displayError(error, 'small', 'registrationForm');
    }
}

export function loadChatPage()
{
	const socketManager = new WebSocketManager();
	loadOnlineUsers();
	//socketManager.send('chat_message', 'Holiwis, mundillo');

}
export function loadMainPage() {
	let mainPage = document.getElementById("root");
    Promise.all([
        fetch('./menu/menu.html').then(response => response.text()),
    ]).then(([html, css]) => {
        mainPage.innerHTML = html;
        //clear hash
        history.pushState("", document.title, window.location.pathname + window.location.search);
        loadUserInfo();
		loadChatPage();
    }).catch(error => {
        console.error('Error al cargar el formulario:', error);
    });
}