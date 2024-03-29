import { displayError } from "../components/loader.js"
import { loadMainPage } from "../index/index.js"

async function handleSubmitLogin (e) {
    if (e.target.matches('#loginForm') === false)
        return ;
    e.preventDefault()
    // Get the input values
    const username = document.querySelector('#username').value;
    const password = document.querySelector('#password').value;

    const loginData = {
        username: username,
        password: password,
    };
    try {
        // Make a POST request to the specified endpoint
        const response = await fetch('api/pong_auth/login/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },body: JSON.stringify(loginData),
    });
    if (!response.ok) {
        throw new Error("Incorrect Username or Password");
        //throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Check if the response content type is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format. Expected JSON.');
    }

    const data = await response.json();
    // access token
    const token = data.token;
    const refresh = data.refresh
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('refresh', refresh);
    loadMainPage();
    } catch (error) {
        console.error('Error:', error.message);
        displayError(error.message, 'small', 'loginForm');
    }
}

export function login(e) {
    // event delegation
    //https://stackoverflow.com/questions/1687296/what-is-dom-event-delegation
    document.getElementById('root').addEventListener('submit', handleSubmitLogin);
}

export function checkLoginStatus() {
    return  sessionStorage.getItem('token') !== null &&
            sessionStorage.getItem('refresh') !== null;
}

export function loadLoginPage(){

    // Remove previous styles
    const existingStyles = document.head.querySelectorAll('style');
    existingStyles.forEach(style => {
        document.head.removeChild(style);
    });
    
    let loginPage = document.getElementById("root");
    Promise.all([
        fetch('./login/login.html').then(response => response.text()),
        fetch('./login/login.css').then(response => response.text())
    ]).then(([html, css]) => {
        window.location.hash = '#/login';
        loginPage.innerHTML = html;
        let style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }).catch(error => {
        console.error('Error al cargar el formulario:', error);
    });
}