
export function loadMainPage() {
	let mainPage = document.getElementById("root");
    Promise.all([
        fetch('./menu/menu.html').then(response => response.text()),
    ]).then(([html, css]) => {
        mainPage.innerHTML = html;
    }).catch(error => {
        console.error('Error al cargar el formulario:', error);
    });
}