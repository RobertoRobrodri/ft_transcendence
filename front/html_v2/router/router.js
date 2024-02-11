export function importLogin(){
    loginPageView = !loginPageView; // Cambia el estado de la variable
    let loginPage = document.getElementById("root");
    if (loginPageView) {
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
    } else {
        loginPage.innerHTML = ""
    }
}