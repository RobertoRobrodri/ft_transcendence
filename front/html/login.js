let form = document.querySelector(".logForm")
let username = document.querySelector(".username")
let password = document.querySelector(".password")

async function sendData() {
  const options = {'mode':'no-cors', method: 'POST'};
  // body:(
  //   {
  //     username : username.value,
  //     password : password.value
  //   })
  
  fetch(`http://localhost:8000/api/pong_auth/login/?username=${username.value}&password=${password.value}`, options)
  .then(response => console.log(response))
  .then(response => console.log(response.message))
  .catch(err => console.error(err));
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  sendData();
});