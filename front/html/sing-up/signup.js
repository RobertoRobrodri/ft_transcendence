import { displayError } from "../components/loader.js"
import { loadLoginPage } from "../login/login.js"
import { loadMainPage } from "../menu/menu.js";

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
        const response = await fetch('http://localhost:80/api/pong_auth/register/', {
    	    method: 'POST',
            headers: {
        	'Content-Type': 'application/json',
            },body: JSON.stringify(loginData),
        })
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
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
        console.error('Error:', error.message);
        displayError(error, 'small', 'registrationForm');
    }
}

export function register(e) {
	document.getElementById('root').addEventListener('submit', handleSubmitRegister);
}

export function loadSignUpPage(e){
    // if (e.target.matches('#signupbutton') === false)
    //     return ;
	// e.preventDefault()
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
