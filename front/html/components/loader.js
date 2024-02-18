import { checkLoginStatus, loadLoginPage } from "../login/login.js"
import { loadMainPage } from "../menu/menu.js"

export function loadingAnimation() {
	const $loader = document.createElement("img");
	$loader.src = "./assets/loader.svg"
	$loader.alt = "Loading..."
	return $loader;
}

export function displayError (error, type, id) {
    const errorElement = document.createElement(type);
    errorElement.textContent = error;
    errorElement.style.color = 'red';
    const errorContainer = document.getElementById(id);
    // Remove existing error messages of the same type
    const existingErrors = errorContainer.querySelectorAll(type);
    existingErrors.forEach((existingError) => {
        errorContainer.removeChild(existingError);
    });

    // Append the new error message
    errorContainer.appendChild(errorElement);
}

export function displayLoginOrMenu() {
    if (checkLoginStatus() === true)
        loadMainPage();
    else
        loadLoginPage();
}