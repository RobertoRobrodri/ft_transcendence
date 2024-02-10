function handleClick () {
	alert("You are not logged in :(")
}

export function login() {
	const loginForm = document.querySelector('#loginButton');
	loginForm.addEventListener('click', handleClick)
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