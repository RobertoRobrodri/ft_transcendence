import { loadMenu } from "../menu/menu.js"
import { loadChat } from "../chat/chat.js"
import { renewJWT } from "../components/updatejwt.js"

export function loadMainPage() {

    // Renew jwt
    renewJWT();
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
        loadMenu();
		loadChat();
        //connectChat();
    }).catch(error => {
        console.error('Error al cargar el formulario:', error);
    });
}