// Blog functionality
let blogPosts = [];
let blogPostsContainer;

// Initialize blog page
async function initBlog() {
    // Get DOM elements
    blogPostsContainer = document.getElementById('blog-posts');
    
    // Set up hamburger menu
    setupMenuToggle();
    
    // Set up footer modals
    setupFooterModals();
    
    // Load and display blog posts
    await loadBlogPosts();
}

// Set up hamburger menu functionality
function setupMenuToggle() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                navMenu.classList.remove('active');
            }
        });
        
        // Set up progress button in menu
        const progressBtn = document.getElementById('progress-btn');
        if (progressBtn) {
            progressBtn.addEventListener('click', () => {
                if (window.authSystem && window.authSystem.showProgressModal) {
                    window.authSystem.showProgressModal();
                } else {
                    console.warn('Auth system not loaded');
                }
                navMenu.classList.remove('active');
            });
        }
    }
}

// Set up footer modal functionality
function setupFooterModals() {
    // Disclaimer modal
    const disclaimerBtn = document.getElementById('disclaimer-btn');
    const disclaimerModal = document.getElementById('disclaimer-modal');
    const closeDisclaimerModal = document.getElementById('close-disclaimer-modal');
    
    if (disclaimerBtn && disclaimerModal && closeDisclaimerModal) {
        disclaimerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            disclaimerModal.style.display = 'flex';
        });
        
        closeDisclaimerModal.addEventListener('click', () => {
            disclaimerModal.style.display = 'none';
        });
        
        disclaimerModal.addEventListener('click', (e) => {
            if (e.target === disclaimerModal) {
                disclaimerModal.style.display = 'none';
            }
        });
    }
    
    // Contact modal
    const contactBtn = document.getElementById('contact-btn');
    const contactModal = document.getElementById('contact-modal');
    const closeContactModal = document.getElementById('close-contact-modal');
    const contactForm = document.getElementById('contact-form');
    
    if (contactBtn && contactModal && closeContactModal && contactForm) {
        contactBtn.addEventListener('click', (e) => {
            e.preventDefault();
            contactModal.style.display = 'flex';
        });
        
        closeContactModal.addEventListener('click', () => {
            contactModal.style.display = 'none';
        });
        
        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) {
                contactModal.style.display = 'none';
            }
        });
        
        // Handle contact form submission
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleContactForm();
        });
        
        // Handle contact cancel button
        const contactCancel = document.getElementById('contact-cancel');
        if (contactCancel) {
            contactCancel.addEventListener('click', () => {
                contactModal.style.display = 'none';
                contactForm.reset();
            });
        }
    }
}

// Load blog posts from API
async function loadBlogPosts() {
    try {
        blogPostsContainer.innerHTML = '<div class="loading">Loading blog posts...</div>';
        
        const response = await fetch('/api/blog-posts');
        const data = await response.json();
        
        if (data.success && data.posts) {
            blogPosts = data.posts;
            displayBlogPosts();
        } else {
            throw new Error(data.error || 'Failed to load blog posts');
        }
        
    } catch (error) {
        console.error('Error loading blog posts:', error);
        blogPostsContainer.innerHTML = `
            <div class="blog-error">
                <h3>Error Loading Blog Posts</h3>
                <p>Unable to load blog posts. Please try again later.</p>
            </div>
        `;
    }
}

// Display blog posts in the container
function displayBlogPosts() {
    if (blogPosts.length === 0) {
        blogPostsContainer.innerHTML = `
            <div class="blog-error">
                <h3>No Blog Posts Found</h3>
                <p>Check back soon for new content!</p>
            </div>
        `;
        return;
    }
    
    const postsHTML = blogPosts.map(post => createBlogPostHTML(post)).join('');
    blogPostsContainer.innerHTML = postsHTML;
}

// Create HTML for a single blog post
function createBlogPostHTML(post) {
    // Format the date
    const date = new Date(post.created_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    return `
        <article class="blog-post">
            ${post.blog_image_url ? `
                <img src="${post.blog_image_url}" 
                     alt="${post.blog_title}" 
                     class="blog-post-image"
                     onerror="this.style.display='none'">
            ` : `
                <div class="blog-post-image"></div>
            `}
            <div class="blog-post-content">
                <div class="blog-post-meta">
                    <span class="blog-post-author">By ${post.author}</span>
                    <span class="blog-post-date">${date}</span>
                </div>
                <h2 class="blog-post-title">${post.blog_title}</h2>
                <div class="blog-post-text">${post.blog_text}</div>
            </div>
        </article>
    `;
}

// Handle contact form submission
async function handleContactForm() {
    const form = document.getElementById('contact-form');
    const resultDiv = document.getElementById('contact-result');
    const submitBtn = document.getElementById('contact-submit');
    
    // Get form data
    const formData = new FormData(form);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message')
    };
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    resultDiv.innerHTML = '';
    
    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            resultDiv.innerHTML = '<div class="success-message">✅ Message sent successfully! We\'ll get back to you soon.</div>';
            form.reset();
            
            // Close modal after 2 seconds
            setTimeout(() => {
                document.getElementById('contact-modal').style.display = 'none';
                resultDiv.innerHTML = '';
            }, 2000);
        } else {
            throw new Error(result.error || 'Failed to send message');
        }
        
    } catch (error) {
        console.error('Contact form error:', error);
        resultDiv.innerHTML = `<div class="error-message">❌ ${error.message}</div>`;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
    }
}

// Initialize blog when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initBlog();
    
    // Initialize auth system if available
    if (window.authSystem && window.authSystem.initAuth) {
        window.authSystem.initAuth();
    }
});