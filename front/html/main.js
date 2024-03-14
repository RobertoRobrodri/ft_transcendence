import * as routing from "./router/router.js"
import * as loginModule from "./login/login.js"
import * as signUpModule from "./sing-up/signup.js"
import * as callbackModule from "./callback/callback.js"
import * as index from "./index/index.js"

document.addEventListener("DOMContentLoaded", routing.router);
loginModule.login();
signUpModule.register();
callbackModule.sendUpdatedData();
callbackModule.callback42();
window.addEventListener("hashchange", routing.router);
index.checkDiv();
index.checkMenu();
index.setWindowsMovement();