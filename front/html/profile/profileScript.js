import { renewJWT } from "../components/updatejwt.js"
import { displayErrorList } from "../components/loader.js"

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
        let user_info = document.getElementById("user_info");
        let default_picture = './assets/gigachad.jpg'
        let user_updated = user_info.innerHTML.replace(/{{USERNAME}}/g, data.username);
        user_updated = user_updated.replace(/{{WINS}}/g, data.wins);
        user_updated = user_updated.replace(/{{LOSSES}}/g, data.losses);
        user_updated = user_updated.replace(/{{STATUS}}/g, data.status);
        if (data.profile_picture != null)
            user_updated = user_updated.replace(default_picture, 'data:image/png;base64,' + data.profile_picture);
        if (data.qr != null)
        {  
            let qr = 'data:image/png;base64,' + data.qr;
            var htmlDinamico = `
            <div class="vertical-center">
                <img class="userPhoto" src='${qr}' alt="Profile picture">
            </div>
            `;
            user_updated +=htmlDinamico;
        }
        user_info.innerHTML = user_updated;
        user_info.classList.remove("mshide");
    }
    catch (error) {
        console.error('Error:', error.message);
        // Token error, try update jwt
        renewJWT();
    }
}

export function loadEditProfilePage() {
    // Remove previous styles
    const existingStyles = document.head.querySelectorAll('style');
    existingStyles.forEach(style => {
        document.head.removeChild(style);
    });
    
    let loginPage = document.getElementById("root");
    Promise.all([
        fetch('./profile/editProfile.html').then(response => response.text()),
        fetch('./profile/editProfileStyle.css').then(response => response.text())
    ]).then(([html, css]) => {
        window.location.hash = '#/edit-profile';
        loginPage.innerHTML = html;
        let style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        editProfileListener();
    }).catch(error => {
        console.error('Error al cargar el formulario:', error);
    });
}

async function updateProfile(e) {
    const token = sessionStorage.getItem('token');
    if (e.target.matches('#editProfileForm') === false) {
        return;
    }
    e.preventDefault();

    const formData = new FormData();
    if (document.querySelector('#new_username').value) {
        formData.append('username', document.querySelector('#new_username').value);
    }
    if (document.querySelector('#twoFactorAuth').value) {
        formData.append('TwoFactorAuth', document.querySelector('#twoFactorAuth').checked);
    }
    if (document.querySelector('#new_profilePicture').files.length > 0) {
        const file = document.querySelector('#new_profilePicture').files[0];
        formData.append('profile_picture', file);
    }
    try {
        const response = await fetch('/api/user_management/user_update/', {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error);
    }
    const data = await response.json();
    } catch (error) {
        // displayErrorList(JSON.parse(error.message), 'editProfileForm');
    }
}

function editProfileListener() {
	document.getElementById('root').addEventListener('submit', updateProfile);
}