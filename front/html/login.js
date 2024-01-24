username = document.querySelector(".username")
password = document.querySelector(".password")

const options = {method: 'POST', body: `{"username":${username.value},"password":${password.value}`};
fetch('http://localhost:8000/api/pong_auth/login/', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));