// Navigation router and smooth scrolling
(function() {
  // Smooth scroll to sections
  function smoothScrollTo(target) {
    const element = document.querySelector(target);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  }

  // Handle navigation clicks
  function handleNavClick(e) {
    e.preventDefault();
    const href = e.target.getAttribute('href');
    if (href && href.startsWith('#')) {
      smoothScrollTo(href);
      // Close mobile menu if open
      const menu = document.getElementById('mobile-menu');
      if (menu && menu.classList.contains('open')) {
        menu.classList.remove('open');
        menu.setAttribute('aria-hidden', 'true');
        document.querySelector('.btn-menu').setAttribute('aria-expanded', 'false');
      }
    }
  }

  // Add click listeners to all nav links
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('nav-link') || e.target.classList.contains('menu-link')) {
      handleNavClick(e);
    }
  });

  // Handle contact form submission
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      const name = formData.get('name');
      const email = formData.get('email');
      const message = formData.get('message');
      
      // Create mailto link
      const subject = encodeURIComponent('Contact from Corridor Computer Website');
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
      const mailtoLink = `mailto:info@redseaportal.com?subject=${subject}&body=${body}`;
      
      window.location.href = mailtoLink;
    });
  }
})();
