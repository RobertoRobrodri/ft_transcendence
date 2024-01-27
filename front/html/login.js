let form = document.querySelector(".logForm");

    async function sendData(username, password) {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `username=${username}&password=${password}`
        };

        try {
            const response = await fetch('http://127.0.0.1:8000/api/pong_auth/login/', options);
            const data = await response.json();
            
            console.log('API Response:', data);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Get values from the form fields
        let username = document.querySelector(".username").value;
        let password = document.querySelector(".password").value;

        // Send data to the server
        await sendData(username, password);
    });