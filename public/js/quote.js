document.getElementById('quoteForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = document.getElementById('quoteForm');

    // Client-Side Validation
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        console.log('Form validation failed'); // Log validation failure
        return;
    }

    form.classList.remove('was-validated');
    form.reset();

    const formData = new FormData(form);

    // Log form data for debugging
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }

    try {
        const response = await fetch('/api/inquiry', {
            method: 'POST',
            body: formData
        });

        console.log('Response Status:', response.status); // Log response status

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error || errorData.message || 'Error submitting inquiry.';
            console.error('Server Error:', errorMessage); // Log server error
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('Inquiry submitted successfully:', data); // Log success

        alert('Your inquiry has been submitted successfully!');

    } catch (error) {
        console.error('Error submitting inquiry:', error); // Log client-side error
        alert('An error occurred: ' + error.message);
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
