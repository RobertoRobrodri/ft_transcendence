const params = new URLSearchParams(window.location.search)
if (params.has('code'))
{

    const clientid  = 'uwu';
    const secretid  = 'UwU';
    const code = params.get('code')
    console.log(code);
    let url = `https://api.intra.42.fr/oauth/token?grant_type=authorization_code&client_id=${clientid}&client_secret=${secretid}&code=${code}&redirect_uri=http://127.0.0.1:5500/front/html/main.html`
    fetch(url, {
        method: 'POST',
        mode: 'cors',
    })
    .then(response => console.log(response))
    // .then(response => console.log(response.access_token))
    // .then(response => console.log(response.refresh_token))
}