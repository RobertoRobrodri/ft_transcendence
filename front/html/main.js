import * as routing from "./router/router.js"
import * as loginModule from "./login/login.js"
import * as signUpModule from "./sing-up/signup.js"
import * as callbackModule from "./callback/callback.js"
import * as loaderModule from "./components/loader.js"

document.addEventListener("DOMContentLoaded", loaderModule.displayLoginOrMenu);
loginModule.login();
signUpModule.register();
// callbackModule.callback42();
window.addEventListener("hashchange", routing.router)