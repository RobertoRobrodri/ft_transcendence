import { loadMainPage } from "../menu/menu.js"

export async function callback42(e) {
	const urlParams = new URLSearchParams(window.location.search);
	const authorizationCode = urlParams.get('code');

    // Make a POST request to your backend with the authorization code
    if (authorizationCode) {
        const response = await fetch('http://localhost:80/api/pong_auth/42/callback/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: authorizationCode,
            }),
        })
		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}
		const data = await response.json();
		const token = data.access_token;
		sessionStorage.setItem('token', token);
		loadMainPage();
    } else {
        console.error('Authorization code not found in the URL.');
    }
}