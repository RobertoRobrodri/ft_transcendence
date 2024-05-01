import { load2FApage } from "../2FA/twoFactorAuthScript.js"
import { loadMainPage } from "../index/index.js"
import { checkLoginStatus } from "../login/login.js"

async function handleSubmitUpdatedData(e) {
    if (e.target.matches('#SelectUsernameForm') === false)
        return ;
    e.preventDefault()
    // Get the input values
    const token = sessionStorage.getItem('token')
    const username = document.querySelector('#username42').value;
    const userData = {
        username: username,
      };
      try {
            // TODO probably we need to change localhost to domain
            const response = await fetch('api/user_management/user_update/', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },body: JSON.stringify(userData),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        loadMainPage();
        } catch (error) {
            console.error('Error:', error.message);
            displayMessage(error.message, 'small', 'SelectUsernameForm');
        }
}


export function sendUpdatedData(e) {
    document.getElementById('root').addEventListener('submit', handleSubmitUpdatedData);
}

function load42UserWelcomePage() {
    let welcomePage = document.getElementById("root");
    Promise.all([
        fetch('./callback/callback.html').then(response => response.text()),
    ]).then(([html, css]) => {
        welcomePage.innerHTML = html;
        let style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }).catch(error => {
        console.error('Error al cargar el formulario:', error);
    });
}

export async function callback42() {
    const urlParams = new URLSearchParams(window.location.search);
    const authorizationCode = urlParams.get('code');

    if (checkLoginStatus() === true)
        return ;
    // Make a POST request to your backend with the authorization code
    if (authorizationCode) {
        const response = await fetch('api/pong_auth/42/callback/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: authorizationCode,
            }),
        });
        if (!response.ok && response.status !== 307 && response.status !== 308) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        var currentUrl = window.location.href;
        // Remove the query parameters
        var updatedUrl = currentUrl.split('?')[0];
        // Replace the current URL with the updated URL
        window.history.replaceState({}, document.title, updatedUrl);
        // 2FA activated
        if (response.status === 308)
        {
            const verification_token = data.verification_token;
            sessionStorage.setItem('verification_token', verification_token)
            load2FApage();
        }
        else
        {
            const token = data.token;
            const refresh = data.refresh;
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('refresh', refresh);
            // custom status code for new user
            if (response.status === 307)
                load42UserWelcomePage();
            else
                loadMainPage();
        }
    } else {
        //console.error('Authorization code not found in the URL.');
    }
}