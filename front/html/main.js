import * as loginModule from "./login.js";

const d = document;

d.addEventListener("DOMContentLoaded", loginModule.displayLoginForm);


loginModule.callback42();
// Select the login form
const loginForm = document.querySelector('#loginForm');
// Add event listener to the form submission
loginForm.addEventListener('submit', loginModule.handleSubmitLogin);
// Select the register form
const registerForm = document.querySelector('#RegisterForm');
// Add event listener to the form submission
registerForm.addEventListener('submit', loginModule.handleSubmitRegister);