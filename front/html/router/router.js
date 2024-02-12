import { checkLoginStatus } from "../login/login.js"
import { importSignUp } from "../sing-up/signup.js"
import * as callbackModule from "../callback/callback.js"
import { displayLoginOrMenu } from "../components/loader.js"

export function router() {
	let { hash } = location;
	console.log(hash);
	if (checkLoginStatus() === false && !hash) {
		displayLoginOrMenu();
	}
	else if (hash === '#/signup') {
		importSignUp();
	}
}