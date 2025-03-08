document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('loginError');

    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        console.log('Login Response:', response); // Log the response

        if (!response.ok) {
            let errorMessage = 'Login failed';
            try {
                const errorData = await response.json();
                if (errorData && errorData.error) {
                    errorMessage = errorData.error;
                } else if (response.status === 401) {
                    errorMessage = 'Invalid username or password';
                } else {
                    console.error('Server Error:', response.status, response.statusText);
                }
            } catch (jsonError) {
                console.error('Error parsing JSON:', jsonError);
                errorMessage = response.statusText || errorMessage;
            }
            loginError.textContent = errorMessage;
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('Login Data:', data); // Log the data
        localStorage.setItem('adminToken', data.token);
        window.location.href = '/admin-dashboard.html';

    } catch (error) {
        loginError.textContent = error.message;
        console.error('Login Error:', error);
    }
});
