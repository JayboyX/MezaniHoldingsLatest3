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

// Hamburger Menu Toggle
const navbarToggle = document.querySelector('.navbar-toggle');
const navbarMenu = document.querySelector('.navbar-menu');

navbarToggle.addEventListener('click', () => {
    navbarToggle.classList.toggle('active');
    navbarMenu.classList.toggle('active');
});

// Close Mobile Menu When a Link is Clicked
document.querySelectorAll('.navbar-link').forEach(link => {
    link.addEventListener('click', () => {
        if (navbarMenu.classList.contains('active')) {
            navbarToggle.classList.remove('active');
            navbarMenu.classList.remove('active');
        }
    });
});

// Highlight Active Navbar Link on Scroll
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.navbar-link');

    window.addEventListener('scroll', () => {
        let currentSection = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= sectionTop - sectionHeight / 3) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(currentSection)) {
                link.classList.add('active');
            }
        });
    });

    // Smooth Scrolling for Navbar Links
    document.querySelectorAll('.navbar-link').forEach(link => {
      link.addEventListener('click', (e) => {
          const targetId = link.getAttribute('href');
          if (targetId.startsWith('#')) { // Only apply smooth scrolling to anchor links
              e.preventDefault();
              const targetSection = document.querySelector(targetId);
              targetSection.scrollIntoView({ behavior: 'smooth' });
          }
          // Allow default behavior for non-anchor links (e.g., admin-login.html)
      });
  });
});
