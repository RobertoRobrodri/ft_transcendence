
  document.addEventListener('DOMContentLoaded', function () {
    // Select the login form
    const loginForm = document.querySelector('.logForm');

    // Add event listener to the form submission
    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault(); // Prevent the default form submission

      // Get the input values
      const username = document.querySelector('.username').value;
      const password = document.querySelector('.password').value;

      // Create an object with the login data
      const loginData = {
        username: username,
        password: password,
      };

      try {
        // Make a POST request to the specified endpoint
        const response = await fetch('http://localhost:80/api/pong_auth/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Check if the response content type is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response format. Expected JSON.');
        }

        const data = await response.json();
        // Handle the response data as needed
        console.log(data);
      } catch (error) {
        console.error('Error:', error.message);
      }
    });
  });
