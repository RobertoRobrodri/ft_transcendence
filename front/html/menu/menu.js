import { connectChat } from "../chat/chat.js"
import { remove_session } from "../components/updatejwt.js"

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
        // Token refresh error, remove tokens and redirect to login page?
        remove_session();
    }
}

export function loadMenu() {

    let mainPage = document.getElementById("navmenu");
    Promise.all([
        fetch('./menu/menu.html').then(response => response.text()),
    ]).then(([html]) => {
        mainPage.innerHTML = html;
        loadUserInfo();
    }).catch(error => {
        console.error('Error al cargar el formulario:', error);
    });
}