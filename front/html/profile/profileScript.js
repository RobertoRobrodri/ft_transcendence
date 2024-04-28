import { renewJWT } from "../components/updatejwt.js"
import { displayErrorList, displayError } from "../components/loader.js"

export function init(customData = null) {
    loadUserInfo(customData);
    getTournaments();
}

// window.addEventListener('beforeunload', function(event) {
//     console.log('La página está a punto de descargarse.');
// });

export async function loadUserInfo(customData = null) {
    const token = sessionStorage.getItem('token')
    try {
        let url = 'api/user_management/user_list/';
        if(customData)
            url = `/api/user_management/user_specific/${customData}/`;
        const response = await fetch(url, {
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
                <img class="qrcode" src='${qr}' alt="QR code">
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

// Funcion para obtener una lista de todos los torneos que se ha participado, retorna nombre del torneo y el id
export async function getTournaments() {
    const token = sessionStorage.getItem('token')
    try {
        let url = 'api/blockchain/getTournaments/';
        const response = await fetch(url, {
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
        //al hacer click en un torneo, se solicita la tabla enviando el id del torneo, ejemplo de solicitud:
        getTournamentTable(data['tournaments_participated'][0]['id'])

    }
    catch (error) {
        console.error('Error:', error.message);
        // Token error, try update jwt
        renewJWT();
    }
}

export async function getTournamentTable(tournament_id) {
    // Esta funcion retorna la tabla amacenada en la blockchain del id del torneo especificado
    const token = sessionStorage.getItem('token')
    try {
        let url = `api/blockchain/getTournamentTable/?tournament_id=${tournament_id}`;
        const response = await fetch(url, {
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
        console.log(data)
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

function updateUser(e)
{
    // This prevents refresh page
    e.preventDefault();
    if (e.target.matches('#editProfileForm') === true)
        updateProfile();
    else if (e.target.matches('#changePasswordForm') === true)
        updatePassword();
    else if (e.target.matches('#activateTwoFactorAuthForm') == true)
        update2FA();
    else if (e.target.matches('#confirmOTP') == true)
        TwoFactorAuthConfirmOTPUpdate();
}

async function update2FA()
{
    const token = sessionStorage.getItem('token');
    const formData = {
        TwoFactorAuth: document.querySelector('input[name="twoFactorAuth"]:checked').value
    };
    try {
        const response = await fetch('/api/user_management/user_update_2FA/', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
        });
    if (!response.ok && response.status !== 307) {
        const error = await response.json();
        throw new Error(JSON.stringify(error));
    }
    const data = await response.json();
    if (response.status === 307)
    {
        document.getElementById('qrCodeImg').src = 'data:image/png;base64,' + data.qr;
        // Show modal
        $('#twoFactorAuthModal').modal('show');
    }
    } catch (error) {
        displayError(error.message, 'small', 'activateTwoFactorAuthForm');
    }
}

async function updateProfile() {
    const token = sessionStorage.getItem('token');
    const formData = new FormData();
    if (document.querySelector('#new_username').value) {
        formData.append('username', document.querySelector('#new_username').value);
    }
    if (document.querySelector('#new_profilePicture').files.length > 0) {
        const file = document.querySelector('#new_profilePicture').files[0];
        try {
            if (file.size > 1024 * 1024)
                throw new Error('Image too large!');
            formData.append('profile_picture', file);
        } catch(error) {
            displayError(error.message, 'small', 'editProfileForm')
        }
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
        console.log(error)
        throw new Error(JSON.stringify(error));
    }
    const data = await response.json();
    console.log(data)
    } catch (error) {
        console.log(error)
        displayErrorList(JSON.parse(error.message), 'editProfileForm');
    }
}

async function updatePassword() {
    const token = sessionStorage.getItem('token');
    const old_password = document.querySelector('#old_password').value;
    const new_password = document.querySelector('#new_password').value;
    const new_password2 = document.querySelector('#confirm_password').value;

    const passwordData = {
        old_password: old_password,
        new_password: new_password,
        new_password2: new_password2,
    };
    try {
        const response = await fetch('/api/user_management/user_update_password/', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(JSON.stringify(error));
    }
    const data = await response.json();
    console.log(data)
    } catch (error) {
        displayErrorList(JSON.parse(error.message), 'changePasswordForm');
    }
}

async function TwoFactorAuthConfirmOTPUpdate() {
    // Get the input values
    const token = sessionStorage.getItem('token')
    const userOTP = document.querySelector('#OTP').value;
    const UserData = {
        otp: userOTP,
      };
      try {
            const response = await fetch('api/user_management/user_update_validate_2FA/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(UserData),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log(response)
        } catch (error) {
            console.error('Error:', error.message);
            displayError(error.message, 'small', 'confirmOTP');
        }
}

function editProfileListener() {
	document.getElementById('root').addEventListener('submit', updateUser);
}
