const loginButton = document.getElementById('auth')

loginButton.addEventListener('click', () => {
    window.electronAPI.connect();
});

