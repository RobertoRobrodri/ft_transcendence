import { checkLoginStatus } from "../login/login.js"
import { loadSignUpPage } from "../sing-up/signup.js"
import { callback42 } from "../callback/callback.js"
import { displayLoginOrMenu } from "../components/loader.js"

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

// if (checkLoginStatus === false) {
// 	if (!hash)
// 		loadLoginPage();
// 	else if (hash === '#/signup') {
// 		loadSignUpPage();
// 	}
// }
// else {
// 	if (!hash)
// 		loadMainPage();
// }