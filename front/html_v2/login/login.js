import { importSingUp } from "../sing-up/signup.js"
import { displayError } from "../components/loader.js"

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
        const response = await fetch('http://localhost:80/api/pong_auth/login/', {
    	method: 'POST',
        headers: {
        	'Content-Type': 'application/json',
        },body: JSON.stringify(loginData),
    });
    if (!response.ok) {
    	throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Check if the response content type is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format. Expected JSON.');
    }

    const data = await response.json();
    // Handle the response data as needed
	const token = data.access_token;
	sessionStorage.setItem('token', token);
    console.log(data);
    } catch (error) {
    	console.error('Error:', error.message);
        displayError(error, 'small', 'loginForm');
	}
}

export function login(e) {
    // event delegation
    //https://stackoverflow.com/questions/1687296/what-is-dom-event-delegation
    document.getElementById('root').addEventListener('submit', handleSubmitLogin);
}

export function loadSignUp(e) {
    document.getElementById('root').addEventListener('click', importSingUp);
}

export async function callback42(e) {
	const urlParams = new URLSearchParams(window.location.search);
	const authorizationCode = urlParams.get('code');

    // Make a POST request to your backend with the authorization code
    if (authorizationCode) {
        const response = await fetch('http://localhost:80/api/pong_auth/42/callback/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: authorizationCode,
            }),
        })
		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}
		data = await response.json()
		const token = data.access_token;
		sessionStorage.setItem('token', token);
    } else {
        console.error('Authorization code not found in the URL.');
    }
}

function checkLoginStatus() {
	return sessionStorage.getItem('token') !== null;
}

export function importLogin(){
    if (checkLoginStatus() === false) {
        console.log("Not logged in");
        let loginPage = document.getElementById("root");
        Promise.all([
            fetch('./login/login.html').then(response => response.text()),
            fetch('./login/login.css').then(response => response.text())
        ]).then(([html, css]) => {
            loginPage.innerHTML = html;
            let style = document.createElement('style');
            style.textContent = css;
            document.head.appendChild(style);
        }).catch(error => {
            console.error('Error al cargar el formulario:', error);
        });
    }
}