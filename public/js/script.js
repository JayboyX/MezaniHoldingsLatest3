// Quote form submission
document.getElementById('quoteForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
      name: e.target.name.value,
      service: e.target.service.value,
      location: e.target.location.value,
      message: e.target.message.value,
      email: e.target.email.value,
      phone: e.target.phone.value
    };
  
    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
  
      if (response.ok) {
        alert('Quote request submitted! We will contact you soon.');
        e.target.reset();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });
  
  document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const formData = {
      name: e.target.name.value,
      email: e.target.email.value,
      message: e.target.message.value
    };
  
    try {
      const response = await fetch('/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
  
      if (response.ok) {
        alert('Message sent successfully!');
        e.target.reset();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while sending the message.');
    }
  });

  let slideIndex = 0;
showSlides(slideIndex);

// Next/previous controls
function plusSlides(n) {
    showSlides(slideIndex += n);
}

// Thumbnail image controls (optional, if you add thumbnails)
function currentSlide(n) {
    showSlides(slideIndex = n);
}

function showSlides(n) {
    let i;
    let slides = document.getElementsByClassName("slide");
    if (n > slides.length - 1) {slideIndex = 0}
    if (n < 0) {slideIndex = slides.length - 1}
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    slides[slideIndex].style.display = "block";
}

// Automatic slideshow (optional)
let autoSlideInterval;
let autoSlideEnabled = true; // You can control auto slide

function startAutoSlide() {
    autoSlideInterval = setInterval(() => {
        plusSlides(1);
    }, 3000); // Change slide every 3 seconds
}

function stopAutoSlide() {
    clearInterval(autoSlideInterval);
}

if (autoSlideEnabled) {
    startAutoSlide();
}

const numImages = 35; // Total number of images
const galleryWrapper = document.querySelector('.gallery-wrapper');
let currentIndex = 0;

// Load images dynamically
for (let i = 1; i <= numImages; i++) {
    const img = document.createElement('img');
    img.src = `assets/cleaning ${i}.jpg`; // Adjust path as needed
    img.alt = `Cleaning Service ${i}`;
    img.classList.add('gallery-image');
    img.loading = "lazy";
    galleryWrapper.appendChild(img);
}

// Function to show the current set of 3 images
function showImages(index) {
    const images = document.querySelectorAll('.gallery-image');
    const offset = -index * (100 / 3); // Calculate the transform offset
    galleryWrapper.style.transform = `translateX(${offset}%)`;
}

// Navigation buttons
document.querySelector('.prev-btn').addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + numImages) % numImages;
    showImages(currentIndex);
});

document.querySelector('.next-btn').addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % numImages;
    showImages(currentIndex);
});

// Auto-slide functionality
setInterval(() => {
    currentIndex = (currentIndex + 1) % numImages;
    showImages(currentIndex);
}, 3000); // Change image every 3 seconds

// Show the first set of images initially
showImages(currentIndex);


document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = new FormData(this);

    fetch('/send-email', {
        method: 'POST',
        body: JSON.stringify({
            name: formData.get('name'),
            email: formData.get('email'),
            message: formData.get('message'),
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.text())
    .then(data => {
        alert(data); // Show success message
        document.getElementById('contactForm').reset(); // Clear the form
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to send the message, please try again.');
    });
});

window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
  } else {
      navbar.classList.remove('scrolled');
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

