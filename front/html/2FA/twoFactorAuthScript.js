import { loadMainPage } from "../index/index.js"

async function handleSubmitOTP(e) {
    if (e.target.matches('#SendOTPForm') === false)
        return ;
    e.preventDefault()
    // Get the input values
    const token = sessionStorage.getItem('verification_token')
    const userOTP = document.querySelector('#OTP').value;
    console.log(userOTP)
    const otp = {
        otp: userOTP,
      };
      try {
            const response = await fetch('https://localhost:443/api/pong_auth/verify_otp/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },body: otp,
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        loadMainPage();
        } catch (error) {
            console.error('Error:', error.message);
            // displayError(error.message, 'small', 'SendOTPForm');
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
        welcomePage.innerHTML = html;
        let style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        RegisterOTPSubmitEvent();
    }).catch(error => {
        console.error('Error al cargar el formulario:', error);
    });
}