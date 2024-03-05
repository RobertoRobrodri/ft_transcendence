import { checkLoginStatus } from "../login/login.js"
import { loadSignUpPage } from "../sing-up/signup.js"
import { callback42 } from "../callback/callback.js"
import { displayLoginOrMenu } from "../components/loader.js"
import { renewJWT, remove_session } from "../components/updatejwt.js"

export function router() {
    let { hash } = location;
    console.log(hash);
    // TODO send to main by default
    if (!hash) {
        displayLoginOrMenu();
    }
    else if (hash === '#/signup' && checkLoginStatus() === false) {
        loadSignUpPage();
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