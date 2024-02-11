let singUpPageView = true;

async function handleSubmitRegister(e) {
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
    }
    catch (error) {
            console.error('Error:', error.message);
    }
        
}

export function register(e) {
	// Select the login form
	const registerForm = document.querySelector('#RegisterForm');
	// Add event listener to the form submission
	registerForm.addEventListener('submit', handleSubmitRegister);
}

export function importSingUp(){
    singUpPageView = !singUpPageView; // Cambia el estado de la variable
    let singUpPage = document.getElementById("sing-up-page");
    if (singUpPageView) {
        Promise.all([
            fetch('./sing-up/sing-up.html').then(response => response.text()),
            fetch('./sing-up/sing-up.css').then(response => response.text())
        ]).then(([html, css]) => {
            singUpPage.innerHTML = html;
            let style = document.createElement('style');
            style.textContent = css;
            document.head.appendChild(style);
        }).catch(error => {
            console.error('Error al cargar el formulario:', error);
        });
    } else {
        singUpPage.innerHTML = ""
    }
}


export function inicializarEventos() {
    document.getElementById("html-sing-up").addEventListener("click", importSingUp);
}
