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
    const token = sessionStorage.getItem('token')
	if (e.target.matches('#editProfileForm') === false)
        return ;
    e.preventDefault()
    const new_profile_data = {
		username: document.querySelector('#new_username').value,
        // TODO encode to base64
        profile_picture: encodeBase64(document.querySelector('#new_profilePicture').files[0]),
        TwoFactorAuth: document.querySelector('#twoFactorAuth').checked,
	}
    console.log(new_profile_data)
	try {
        const response = await fetch('/api/user_management/user_update/', {
            method: 'PATCH',
            headers: {
            'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`,
            },body: JSON.stringify(new_profile_data),
        })
        if (!response.ok) {
            const error = await response.json();
            throw new Error(JSON.stringify(error));
        }
        const data = await response.json();
		console.log(data);
    }
    catch (error) {
        displayErrorList(JSON.parse(error.message), 'editProfileForm');
    }
}

function editProfileListener() {
	document.getElementById('root').addEventListener('submit', updateProfile);
}

function encodeBase64(file) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onload = () => {
        let base64String = reader.result
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  