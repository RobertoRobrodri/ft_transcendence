import { checkLoginStatus } from "../login/login.js"
import { loadSignUpPage } from "../sing-up/signup.js"
import { loadFriendsPage } from "../friends/friendsScript.js"
import { loadEditProfilePage } from "../profile/profileScript.js"
import { displayLoginOrMenu } from "../components/loader.js"
import { renewJWT, remove_session } from "../components/updatejwt.js"

let menuLoaded = false;

export function router() {
    let { hash } = location;
    // TODO send to main by default
    if (!hash) {
        displayLoginOrMenu();
    }
    else if (hash === '#/signup' && checkLoginStatus() === false) {
        loadSignUpPage();
    }
    else if (hash === '#/friends' && checkLoginStatus() === true) {
        loadFriendsPage();
    }
    else if (hash === '#/edit-profile' && checkLoginStatus() === true) {
        loadEditProfilePage();
    }
    else {
        displayLoginOrMenu();
    }

    if(!menuLoaded) {
        menuLoaded = true;
        document.getElementById('root').addEventListener('click', configureMenu);
    }
    
}

function configureMenu(e) {
    if (e.target.matches('a')) {
        if (e.target.closest('#menu') !== null) {
            e.preventDefault();
            let href = e.target.getAttribute('href');
            history.pushState({ page: href }, "", href);
            router();
        }
    } else {
        if (e.target.matches('#menuContainer') === false &&
            e.target.matches('#menuLogo') === false) {
            return;
        }
        var menu = document.getElementById('menu');
        if (getComputedStyle(menu).display === 'none') {
            menu.style.display = 'flex';
        } else {
            menu.style.display = 'none';
        }
        e.preventDefault();
    }
}

// window.onpopstate = function() {
//     router();
// };

window.addEventListener("popstate", function(event) {
    if (event.state && event.state.page) {
        router();
    }
});


function updateTime() {
    let currTime = document.getElementById('current-time');
    if(!currTime)
        return;
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var seconds = now.getSeconds();

    // Formatea la hora como HH:MM:SS
    var formattedTime = hours + ':' + (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;

    // Formatea la fecha como DD/MM/AAAA
    var day = now.getDate();
    var month = now.getMonth() + 1; // Se suma 1 porque los meses comienzan desde 0
    var year = now.getFullYear();
    var formattedDate = (day < 10 ? '0' : '') + day + '/' + (month < 10 ? '0' : '') + month + '/' + year;

    // Concatena la fecha y la hora
    var dateTimeString = formattedDate + '  |  ' + formattedTime;

    // Actualiza el contenido del elemento con el ID "current-date-time"
    currTime.innerHTML = dateTimeString;
}

// Update clock
setInterval(updateTime, 1000);

// Renew JWT every minute
setInterval(renewJWT, 60 * 1000);

// if (checkLoginStatus === false) {
//     if (!hash)
//         loadLoginPage();
//     else if (hash === '#/signup') {
//         loadSignUpPage();
//     }
// }
// else {
//     if (!hash)
//         loadMainPage();
// }