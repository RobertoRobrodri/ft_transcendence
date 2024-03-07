import { loadUserInfo } from "./menu.js"
import { connectChat } from "./chat.js"
import { renewJWT } from "../components/updatejwt.js"

export function loadMainPage() {

    // Renew jwt
    renewJWT();

	// Remove previous styles
    const existingStyles = document.head.querySelectorAll('style');
    existingStyles.forEach(style => {
        document.head.removeChild(style);
    });

    let mainPage = document.getElementById("root");
    Promise.all([
        fetch('./index/index.html').then(response => response.text()),
		fetch('../styles.css').then(response => response.text())
    ]).then(([html, css]) => {
        mainPage.innerHTML = html;
		let style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        //clear hash
        history.pushState("", document.title, window.location.pathname + window.location.search);
        loadUserInfo();
		connectChat();
    }).catch(error => {
        console.error('Error al cargar el formulario:', error);
    });
}