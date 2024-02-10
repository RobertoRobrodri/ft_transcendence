async function handleSubmit (e) {
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
    console.log(data);
    } catch (error) {
    	console.error('Error:', error.message);
	}
}

export function login(e) {
	// Select the login form
	const loginForm = document.querySelector('#loginForm');
	// Add event listener to the form submission
	loginForm.addEventListener('submit', handleSubmit);
}

export function checkLoginStatus() {
	return localStorage.getItem('token') !== null;
}

export function displayLoginForm() {
    const loginForm = document.getElementById('loginForm');

    if (checkLoginStatus() === true ) {
        loginForm.style.display = 'none';}
    else {
        loginForm.style.display = 'block';
    }
}