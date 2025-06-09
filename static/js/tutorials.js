// Tutorial system functionality
let courses = [];
let userProgress = {};

// Initialize tutorial page
async function initTutorials() {
    setupMenuToggle();
    setupFooterModals();
    setupDemoModal();
    
    // Load courses
    await loadCourses();
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
                if (window.authSystem && window.authSystem.isLoggedIn()) {
                    showTutorialProgress();
                } else {
                    // Show auth modal
                    document.getElementById('auth-toggle-btn').click();
                }
                navMenu.classList.remove('active');
            });
        }
    }
}

// Set up footer modal functionality (same as blog.js)
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

// Set up demo modal functionality
function setupDemoModal() {
    const demoBtn = document.getElementById('demo-btn');
    const demoModal = document.getElementById('demo-modal');
    const closeDemoModal = document.getElementById('close-demo-modal');
    
    if (demoBtn) {
        demoBtn.addEventListener('click', showDemoModal);
    }
    
    if (closeDemoModal) {
        closeDemoModal.addEventListener('click', hideDemoModal);
    }
    
    if (demoModal) {
        demoModal.addEventListener('click', (e) => {
            if (e.target === demoModal) {
                hideDemoModal();
            }
        });
    }
}

function showDemoModal() {
    const demoModal = document.getElementById('demo-modal');
    if (demoModal) {
        demoModal.style.display = 'flex';
    }
}

function hideDemoModal() {
    const demoModal = document.getElementById('demo-modal');
    if (demoModal) {
        demoModal.style.display = 'none';
    }
}

// Load courses from API
async function loadCourses() {
    try {
        const coursesContainer = document.getElementById('courses-grid');
        coursesContainer.innerHTML = '<div class="loading">Loading courses...</div>';
        
        const response = await fetch('/api/tutorials/courses');
        const data = await response.json();
        
        if (data.success && data.courses) {
            courses = data.courses;
            
            // Load user progress if logged in
            if (window.authSystem && window.authSystem.isLoggedIn()) {
                await loadUserProgress();
            }
            
            displayCourses();
        } else {
            throw new Error(data.error || 'Failed to load courses');
        }
        
    } catch (error) {
        const coursesContainer = document.getElementById('courses-grid');
        coursesContainer.innerHTML = `
            <div class="tutorial-error">
                <h3>Error Loading Courses</h3>
                <p>Unable to load tutorial courses. Please try again later.</p>
            </div>
        `;
    }
}

// Load user progress for tutorials
async function loadUserProgress() {
    try {
        const response = await fetch('/api/tutorials/progress', {
            headers: {
                'Authorization': `Bearer ${await getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            userProgress = data.progress || {};
        }
    } catch (error) {
        console.warn('Could not load user progress:', error);
        userProgress = {};
    }
}

// Get auth token (this would need to be implemented based on your auth system)
async function getAuthToken() {
    // This is a placeholder - implement based on your Supabase auth system
    if (window.authSystem && window.authSystem.getCurrentUser()) {
        // Return Supabase session token
        return 'placeholder-token';
    }
    return null;
}

// Display courses in the grid
function displayCourses() {
    const coursesContainer = document.getElementById('courses-grid');
    
    if (courses.length === 0) {
        coursesContainer.innerHTML = `
            <div class="tutorial-error">
                <h3>No Courses Available</h3>
                <p>Check back soon for new tutorial content!</p>
            </div>
        `;
        return;
    }
    
    const coursesHTML = courses.map(course => createCourseCardHTML(course)).join('');
    coursesContainer.innerHTML = coursesHTML;
    
    // Add event listeners to course cards
    courses.forEach(course => {
        const startBtn = document.getElementById(`start-course-${course.id}`);
        const continueBtn = document.getElementById(`continue-course-${course.id}`);
        
        if (startBtn) {
            startBtn.addEventListener('click', () => startCourse(course.id));
        }
        
        if (continueBtn) {
            continueBtn.addEventListener('click', () => continueCourse(course.id));
        }
    });
}

// Create HTML for a single course card
function createCourseCardHTML(course) {
    // Calculate progress
    const courseProgress = getCourseProgress(course.id);
    const progressPercentage = Math.round((courseProgress.completed / courseProgress.total) * 100);
    
    // Determine course status
    const isStarted = courseProgress.completed > 0;
    const isCompleted = courseProgress.completed === courseProgress.total;
    
    let statusIcon = '';
    let statusText = '';
    
    if (isCompleted) {
        statusIcon = '✅';
        statusText = 'Completed';
    } else if (isStarted) {
        statusIcon = '📚';
        statusText = 'In Progress';
    } else {
        statusIcon = '🚀';
        statusText = 'Start Course';
    }
    
    return `
        <div class="course-card">
            <div class="course-card-header">
                <h3>${course.title}</h3>
                <p>${course.subtitle || 'Start your coding journey with this comprehensive course'}</p>
            </div>
            <div class="course-card-body">
                <div class="course-meta">
                    <div class="course-meta-item">
                        <span>📊</span>
                        <span>${course.difficulty}</span>
                    </div>
                    <div class="course-meta-item">
                        <span>⏱️</span>
                        <span>${course.estimated_duration} hours</span>
                    </div>
                    <div class="course-meta-item">
                        <span>📚</span>
                        <span>${course.chapter_count} chapters</span>
                    </div>
                </div>
                
                <div class="course-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                    <span class="progress-text">${progressPercentage}% Complete</span>
                </div>
                
                <div class="course-actions">
                    ${isStarted ? 
                        `<button id="continue-course-${course.id}" class="btn primary">${statusIcon} Continue Course</button>` :
                        `<button id="start-course-${course.id}" class="btn primary">${statusIcon} ${statusText}</button>`
                    }
                    <button onclick="viewCourseDetails(${course.id})" class="btn secondary">📋 Details</button>
                    ${isCompleted ? `<a href="/tutorials/certificate/${course.id}" class="btn success" style="text-decoration: none;">🏆 Certificate</a>` : ''}
                </div>
            </div>
        </div>
    `;
}

// Get course progress for a specific course
function getCourseProgress(courseId) {
    const progress = userProgress[courseId] || {};
    const course = courses.find(c => c.id === courseId);
    
    return {
        completed: Object.keys(progress).length,
        total: course ? course.chapter_count : 0
    };
}

// Start a course (navigate to first chapter)
function startCourse(courseId) {
    window.location.href = `/tutorials/course/${courseId}`;
}

// Continue a course (navigate to next incomplete chapter)
function continueCourse(courseId) {
    // For now, just go to the course page - the backend will determine the right chapter
    window.location.href = `/tutorials/course/${courseId}`;
}

// View course details (could expand to show a modal with more info)
function viewCourseDetails(courseId) {
    window.location.href = `/tutorials/course/${courseId}`;
}

// Show tutorial progress modal
async function showTutorialProgress() {
    const progressModal = document.getElementById('progress-modal');
    if (!progressModal) return;
    
    progressModal.style.display = 'flex';
    await loadAndDisplayProgress();
}

// Load and display user progress
async function loadAndDisplayProgress() {
    try {
        await loadUserProgress();
        
        // Calculate total progress
        let totalCompleted = 0;
        let totalChapters = 0;
        
        courses.forEach(course => {
            const progress = getCourseProgress(course.id);
            totalCompleted += progress.completed;
            totalChapters += progress.total;
        });
        
        // Update stats
        document.getElementById('completed-count').textContent = totalCompleted;
        document.getElementById('total-count').textContent = totalChapters;
        
        // Display completed chapters
        const completedContainer = document.getElementById('completed-chapters');
        if (totalCompleted === 0) {
            completedContainer.innerHTML = '<p class="placeholder">No chapters completed yet. Start a tutorial to track your progress!</p>';
        } else {
            // Show completed chapters grouped by course
            let completedHTML = '';
            
            courses.forEach(course => {
                const courseProgress = userProgress[course.id];
                if (courseProgress && Object.keys(courseProgress).length > 0) {
                    completedHTML += `
                        <div class="course-progress-section">
                            <h4>${course.title}</h4>
                            ${Object.entries(courseProgress).map(([chapterId, progress]) => `
                                <div class="completed-chapter">
                                    <span class="chapter-title">✅ ${progress.chapter_title || `Chapter ${chapterId}`}</span>
                                    <span class="chapter-date">${new Date(progress.completed_at).toLocaleDateString()}</span>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
            });
            
            completedContainer.innerHTML = completedHTML || '<p class="placeholder">No chapters completed yet.</p>';
        }
    } catch (error) {
        document.getElementById('completed-chapters').innerHTML = '<p class="error">Failed to load progress data.</p>';
    }
}

// Handle contact form submission (same as blog.js)
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
        resultDiv.innerHTML = `<div class="error-message">❌ ${error.message}</div>`;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
    }
}

// Provide showSuccess function for auth system
window.showSuccess = function(message) {
    // Simple alert for now - could be enhanced with a toast notification
    alert(message);
};

// Initialize tutorials when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await initTutorials();
    
    // Wait for Supabase to be ready before initializing auth
    const waitForSupabase = () => {
        return new Promise((resolve) => {
            if (window.supabase && window.SUPABASE_CONFIG?.url && window.SUPABASE_CONFIG?.anonKey) {
                resolve();
            } else {
                window.addEventListener('supabaseReady', () => {
                    resolve();
                }, { once: true });
                // Fallback timeout
                setTimeout(() => {
                    resolve();
                }, 5000);
            }
        });
    };
    
    await waitForSupabase();
    
    // Add additional delay to ensure Supabase client is fully initialized
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Initialize auth system after Supabase is ready
    if (window.authSystem && window.authSystem.initAuth) {
        try {
            await window.authSystem.initAuth();
        } catch (error) {
            // Silent fallback
        }
    }
});