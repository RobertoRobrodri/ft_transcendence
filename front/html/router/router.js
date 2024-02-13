import { checkLoginStatus } from "../login/login.js"
import { loadSignUpPage } from "../sing-up/signup.js"
import { callback42 } from "../callback/callback.js"
import { displayLoginOrMenu } from "../components/loader.js"

export function router() {
	let { hash } = location;
	console.log(hash);
	// TODO if an unauthenticated user tries to see other page should be redirected to login
	if (!hash) {
		displayLoginOrMenu();
	}
	else if (hash === '#/signup' && checkLoginStatus() === false) {
		loadSignUpPage();
	}
	else if (hash === '/callback' && checkLoginStatus() === false) {
		callback42();
	}
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