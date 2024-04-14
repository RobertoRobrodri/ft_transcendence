import { checkLoginStatus } from "../login/login.js"
import { loadSignUpPage } from "../sing-up/signup.js"
import { loadFriendsPage } from "../friends/friendsScript.js"
import { loadEditProfilePage } from "../profile/profileScript.js"
import { displayLoginOrMenu } from "../components/loader.js"
import { renewJWT, remove_session } from "../components/updatejwt.js"

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
    else
        displayLoginOrMenu();
}

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