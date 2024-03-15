import { renewJWT } from "../components/updatejwt.js"

export async function loadUserInfo() {
    const token = sessionStorage.getItem('token')
    try {
        const response = await fetch('https://localhost:443/api/user_management/user_list/', {
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
        // Token error, try update jwt
        renewJWT();
    }
}
