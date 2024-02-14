export async function loadUserInfo() {
    const token = sessionStorage.getItem('token')
    console.log(token);
    try {
        const response = await fetch('http://localhost:80/api/user_management/user_list/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }}
        );
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
    }
    catch (error) {
        console.error('Error:', error.message);
        // displayError(error, 'small', 'registrationForm');
    }
}

export function loadMainPage() {
	let mainPage = document.getElementById("root");
    Promise.all([
        fetch('./menu/menu.html').then(response => response.text()),
    ]).then(([html, css]) => {
        mainPage.innerHTML = html;
        //clear hash
        history.pushState("", document.title, window.location.pathname + window.location.search);
        loadUserInfo();
    }).catch(error => {
        console.error('Error al cargar el formulario:', error);
    });
}