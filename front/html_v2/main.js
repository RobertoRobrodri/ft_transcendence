import * as routing from "./router/router.js"
import * as loginModule from "./login/login.js"
import * as signUpModule from "./sing-up/signup.js"

document.addEventListener("DOMContentLoaded", loginModule.importLogin);
loginModule.login();
loginModule.loadSignUp();
signUpModule.register();
//window.addEventListener("hashchange", routing.router)