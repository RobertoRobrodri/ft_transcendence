export function loadingAnimation() {
	const $loader = document.createElement("img");
	$loader.src = "./assets/loader.svg"
	$loader.alt = "Loading..."
	return $loader;
}

export function displayError (error, type, id) {
    const errorElement = document.createElement(type);
    errorElement.textContent = error.message;
    errorElement.style.color = 'red';
    const errorContainer = document.getElementById(id);
    errorContainer.appendChild(errorElement)
}