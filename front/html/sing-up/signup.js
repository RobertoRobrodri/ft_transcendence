import { displayErrorList } from "../components/loader.js"
import { loadMainPage } from "../index/index.js";

async function handleSubmitRegister(e) {
    if (e.target.matches('#registrationForm') === false)
        return ;
    e.preventDefault()
    // Get the input values
    const username = document.querySelector('#new_username').value;
    const password = document.querySelector('#new_password').value;

    const loginData = {
        username: username,
        password: password,
    };
    try {
        const response = await fetch('api/pong_auth/register/', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },body: JSON.stringify(loginData),
        })
        if (!response.ok) {
            const error = await response.json();
            throw new Error(JSON.stringify(error));
        }
        const data = await response.json();
        // Handle the response data as needed
        const token = data.token;
        const refresh = data.refresh
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('refresh', refresh);
        console.log(data);
        loadMainPage();
    }
    catch (error) {
        displayErrorList(JSON.parse(error.message), 'registrationForm');
    }
}

export function register(e) {
    document.getElementById('root').addEventListener('submit', handleSubmitRegister);
}

export function loadSignUpPage(e){
    // if (e.target.matches('#signupbutton') === false)
    //     return ;
    // e.preventDefault()
    
    // Remove previous styles
    const existingStyles = document.head.querySelectorAll('style');
    existingStyles.forEach(style => {
        document.head.removeChild(style);
    });

    let singUpPage = document.getElementById("root");
    Promise.all([
        fetch('./sing-up/sing_up.html').then(response => response.text()),
        fetch('./sing-up/sing_up.css').then(response => response.text())
    ]).then(([html, css]) => {
        singUpPage.innerHTML = html;
        let style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }).catch(error => {
        console.error('Error al cargar el formulario:', error);
    });
}
