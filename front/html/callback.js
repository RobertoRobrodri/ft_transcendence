const urlParams = new URLSearchParams(window.location.search);
        const authorizationCode = urlParams.get('code');

        // Make a POST request to your backend with the authorization code
        if (authorizationCode) {
            fetch('http://localhost:80/api/pong_auth/42/callback/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: authorizationCode,
                }),
            })
            .then(response => response.json())
            .then(data => {
                // Handle the response from your backend
                console.log(data);
            })
            .catch(error => {
                console.error('Error:', error);
            });
        } else {
            console.error('Authorization code not found in the URL.');
        }