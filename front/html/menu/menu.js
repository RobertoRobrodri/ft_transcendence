export async function loadUserInfo() {
    token = sessionStorage.getItem('token')
    const response = await fetch('http://localhost:80/api/user_management/', {
    	method: 'GET',
        headers: {
        	'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        }}
    );
}

export function loadMainPage() {
	let mainPage = document.getElementById("root");
    Promise.all([
        fetch('./menu/menu.html').then(response => response.text()),
    ]).then(([html, css]) => {
        mainPage.innerHTML = html;
        //clear hash
        history.pushState("", document.title, window.location.pathname + window.location.search);
    }).catch(error => {
        console.error('Error al cargar el formulario:', error);
    });
}