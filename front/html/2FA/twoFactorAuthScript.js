import { loadMainPage } from "../index/index.js"
import { displayMessage } from "../components/loader.js"

async function handleSubmitOTP(e) {
    if (e.target.matches('#SendOTPForm') === false)
        return ;
    e.preventDefault()
    // Get the input values
    const token = sessionStorage.getItem('verification_token')
    const userOTP = document.querySelector('#OTP').value;
    const UserData = {
        otp: userOTP,
    };
    try {
        const response = await fetch('api/pong_auth/verify_otp/', {
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
        sessionStorage.removeItem("verification_token");
        const data = await response.json();
        const new_token = data.token;
        const refresh = data.refresh;
        sessionStorage.setItem('token', new_token);
        sessionStorage.setItem('refresh', refresh);
        loadMainPage();
    } catch (error) {
        console.error('Error:', error.message);
        displayMessage(error.message, 'small', 'SendOTPForm');
    }
}


function RegisterOTPSubmitEvent(e) {
    document.getElementById('root').addEventListener('submit', handleSubmitOTP);
}

export function load2FApage() {
    let welcomePage = document.getElementById("root");
    Promise.all([
        fetch('./2FA/twoFactorAuth.html').then(response => response.text()),
    ]).then(([html, css]) => {
        html += `<style>${css}</style>`;
        welcomePage.innerHTML = html;
        RegisterOTPSubmitEvent();
    }).catch(error => {
        console.error('Error al cargar el formulario:', error);
    });
}