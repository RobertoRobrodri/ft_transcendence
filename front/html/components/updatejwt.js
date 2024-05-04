export function remove_session()
{
    
    let { hash } = location;
    if (hash !== '#/login')
    {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refresh");
        location.reload();
        // displayLoginOrMenu();
    }/*
    let { hash } = location;
    const urlParams = new URLSearchParams(window.location.search);
    const authorizationCode = urlParams.get('code');
    if (hash !== '#/login' && !authorizationCode)
    {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refresh");
        displayLoginOrMenu();
    }*/
}

export function renewJWT() {
    const refreshToken = sessionStorage.getItem('refresh');
    const token = sessionStorage.getItem('token');
    if (refreshToken) {
        fetch('/api/pong_auth/token/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                refresh: refreshToken,
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('error refreshing token');
            }
            return response.json();
        })
        .then(data => {
            const token = data.access;
            sessionStorage.setItem('token', token);
        })
        .catch(error => {
            console.error('Error renewing token:', error);
            //remove_session();
        });
    } else {
        console.log('There is no token stored in sessionStorage.');
        //remove_session();
    }
}