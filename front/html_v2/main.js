import * as routing from "./router/router.js"
import * as loginModule from "./login/login.js"

document.addEventListener("DOMContentLoaded", loginModule.importLogin);
window.addEventListener("hashchange", routing.router)