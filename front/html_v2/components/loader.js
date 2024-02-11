export function loadingAnimation() {
	const $loader = document.createElement("img");
	$loader.src = "./assets/loader.svg"
	$loader.alt = "Loading..."
	return $loader;
}