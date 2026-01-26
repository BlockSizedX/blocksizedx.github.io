// Main JavaScript for BlockSizedX Portfolio

document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Mobile Navigation Toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.innerHTML = navMenu.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
        
        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });
    }
    
    // Active Navigation Link on Scroll
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    function updateActiveNavLink() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (window.scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', updateActiveNavLink);
    
    // Load Works from JSON
    loadWorks();
    
    // Load Templates from JSON
    loadTemplates();
    
    // Contact Form Submission
    function sendMail(e) {
        e.preventDefault();

        const nameInput = document.getElementById("name");
        const emailInput = document.getElementById("email");
        const subjectInput = document.getElementById("subject");
        const messageInput = document.getElementById("message");

        // Validate all fields have values
        if (!nameInput.value.trim() || !emailInput.value.trim() || !subjectInput.value.trim() || !messageInput.value.trim()) {
            alert("Please fill in all fields");
            return;
        }

        const name = encodeURIComponent(nameInput.value.trim());
        const email = encodeURIComponent(emailInput.value.trim());
        const subject = encodeURIComponent(subjectInput.value.trim());
        const message = encodeURIComponent(messageInput.value.trim());

        const body =
            `Name: ${name}%0D%0A` +
            `Email: ${email}%0D%0A%0D%0A` +
            `${message}`;

        const mailtoLink = `mailto:blocksizedx@gmail.com?subject=${subject}&body=${body}`;
        window.location.href = mailtoLink;
    }

    // Attach sendMail to contact form if it exists
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', sendMail);
    }




    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href') !== '#') {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#home') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            }
        });
    });
    
    // Newsletter Form Submission
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            if (email) {
                alert(`Thank you for subscribing with ${email}! You'll receive updates about new templates.`);
                this.reset();
            }
        });
    }
    
    // Add fade-in animation to elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    // Observe all sections
    sections.forEach(section => {
        observer.observe(section);
    });
});

// Load Works from JSON
async function loadWorks() {
    const worksGrid = document.getElementById('worksGrid');
    if (!worksGrid) return;
    
    try {
        const response = await fetch('works.json');
        const works = await response.json();
        
        // Display first 6 works on homepage
        const featuredWorks = works.slice(0, 4);
        
        worksGrid.innerHTML = featuredWorks.map(work => `
            <div class="work-card fade-in">
                <div class="work-image" ${work.images && work.images.length > 0 ? '' : `style="background: linear-gradient(135deg, ${work.color1 || '#0077b6'}, ${work.color2 || '#00b4d8'});"`}>
                    ${work.images && work.images.length > 0 ? `<img src="${work.images[0]}" alt="${work.name}">` : `<i class="${work.icon || 'fas fa-laptop-code'}"></i>`}
                </div>
                <div class="work-content">
                    <h3>${work.name}</h3>
                    <p>${work.description}</p>
                    <div class="work-tags">
                        ${work.tags.map(tag => `<span class="work-tag">${tag}</span>`).join('')}
                    </div>
                    <div class="work-actions">
                        <a href="${work.liveDemo}" target="_blank" class="btn btn-primary" style="padding: 10px 20px;">
                            <i class="fas fa-external-link-alt"></i> Live Demo
                        </a>
                        <a href="works.html#work-${work.id}" class="btn btn-outline" style="padding: 10px 20px;">
                            View Details
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading works:', error);
        worksGrid.innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1;">
                <p>Unable to load works. Please check your internet connection.</p>
            </div>
        `;
    }
}

// Load Templates from JSON
async function loadTemplates() {
    const templatesGrid = document.getElementById('templatesGrid');
    if (!templatesGrid) return;
    
    try {
        const response = await fetch('templates.json');
        const templates = await response.json();
        
        // Display first 5 templates on homepage
        const featuredTemplates = templates.slice(0, 5);
        
        templatesGrid.innerHTML = featuredTemplates.map(template => `
            <div class="template-card fade-in">
                <div class="template-image" ${template.previewImages && template.previewImages.length > 0 ? '' : `style="background: linear-gradient(135deg, ${template.color1 || '#00b4d8'}, ${template.color2 || '#90e0ef'});"`}>
                    ${template.previewImages && template.previewImages.length > 0 ? `<img src="${template.previewImages[0]}" alt="${template.name}" data-template-id="${template.id}">` : `<i class="${template.icon || 'fas fa-palette'}"></i>`}
                    ${template.isPremium ? '<span class="template-badge">Premium</span>' : ''}
                </div>
                <div class="template-content">
                    <h3>${template.name}</h3>
                    <p>${template.shortDescription}</p>
                    <div class="template-price">
                        <span class="price">$${template.price}</span>
                        <span class="category">${template.category}</span>
                    </div>
                    <ul class="template-features">
                        ${template.features.slice(0, 3).map(feature => `
                            <li><i class="fas fa-check"></i> ${feature}</li>
                        `).join('')}
                    </ul>
                    <a href="buynow.html?template=${template.id}" class="btn btn-primary" style="width: 100%;">
                        <i class="fas fa-shopping-cart"></i> Buy Now
                    </a>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading templates:', error);
        templatesGrid.innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1;">
                <p>Unable to load templates. Please check your internet connection.</p>
            </div>
        `;
    }
}