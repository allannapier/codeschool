// Global variables for course data
let currentCourseData = null;
let currentChapterId = null;
let userCourseProgress = {}; // Stores progress for the current course

// DOM Element placeholders (initialize when DOM is ready)
let courseTitleElem, courseSubtitleElem, courseMetaElem;
let chapterListElem, chapterTitleElem, chapterContentElem, youtubeEmbedElem, youtubeIframe;
let prevChapterBtn, nextChapterBtn, markCompleteBtnContainer;

// Initialize the course page
async function initCoursePage() {
    console.log('Initializing course page...');

    // Setup common UI elements (menu, modals) - these might be in a shared JS file eventually
    // For now, assume they are handled by other global scripts (auth.js, tutorials.js for progress modal)
    if (typeof setupMenuToggle === 'function') setupMenuToggle();
    if (typeof setupFooterModals === 'function') setupFooterModals(); // If disclaimer/contact are needed
    if (typeof setupDemoModal === 'function') setupDemoModal();


    // Get DOM elements
    courseTitleElem = document.getElementById('course-title-placeholder');
    courseSubtitleElem = document.getElementById('course-subtitle-placeholder');
    courseMetaElem = document.getElementById('course-meta-placeholder');
    chapterListElem = document.getElementById('chapter-list-placeholder');
    chapterTitleElem = document.getElementById('chapter-title-placeholder');
    chapterContentElem = document.getElementById('chapter-content-placeholder');
    youtubeEmbedElem = document.getElementById('youtube-embed-placeholder');
    youtubeIframe = youtubeEmbedElem ? youtubeEmbedElem.querySelector('iframe') : null;

    prevChapterBtn = document.getElementById('prev-chapter-btn');
    nextChapterBtn = document.getElementById('next-chapter-btn');
    markCompleteBtnContainer = document.getElementById('completion-section');

    // Extract course ID from URL (e.g., /tutorials/course/{courseId})
    const courseId = getCourseIdFromUrl();

    if (!courseId) {
        displayError('Could not determine the course ID from the URL.');
        return;
    }

    await loadCourseDetails(courseId);

    if (window.authSystem && window.authSystem.isLoggedIn()) {
        await loadUserCourseProgress(courseId);
    } else {
        // Try loading progress anyway (will return empty if not authenticated or not found)
        await loadUserCourseProgress(courseId);
    }

    renderCourseHeader();
    renderChapterList();

    // Load the first chapter by default or the last viewed chapter
    const chapterToLoad = determineInitialChapter();
    if (chapterToLoad) {
        loadChapterContent(chapterToLoad);
    } else if (currentCourseData && currentCourseData.chapters && currentCourseData.chapters.length > 0) {
        // Fallback to the very first chapter if no other logic applies
        loadChapterContent(currentCourseData.chapters[0].id);
    } else {
        displayChapterError('No chapters available for this course.');
    }

    setupEventListeners();
    console.log('Course page initialization complete.');
}

function getCourseIdFromUrl() {
    const pathSegments = window.location.pathname.split('/');
    // Assuming URL like /tutorials/course/{courseId} or /tutorials/course/{courseId}/chapter/{chapterId}
    const courseIdIndex = pathSegments.indexOf('course') + 1;
    if (courseIdIndex > 0 && courseIdIndex < pathSegments.length) {
        return pathSegments[courseIdIndex];
    }
    return null;
}

function getChapterIdFromUrl() {
    const pathSegments = window.location.pathname.split('/');
    const chapterIdIndex = pathSegments.indexOf('chapter') + 1;
    if (chapterIdIndex > 0 && chapterIdIndex < pathSegments.length) {
        return pathSegments[chapterIdIndex];
    }
    return null;
}

// Load complete course details (meta, chapters, and basic chapter info)
async function loadCourseDetails(courseId) {
    try {
        // This API endpoint needs to be created on the backend.
        // It should return full course details including a list of chapters with their IDs, titles, and types (e.g., video, markdown)
        const response = await fetch(`/api/tutorials/course/${courseId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.success && data.course) {
            currentCourseData = data.course;
            // Set page title dynamically
            const pageTitle = document.getElementById('course-page-title');
            if (pageTitle) {
                pageTitle.textContent = `${currentCourseData.title} - Codebotiks`;
            }
        } else {
            throw new Error(data.error || 'Failed to load course details.');
        }
    } catch (error) {
        console.error('Error loading course details:', error);
        displayError('Unable to load course content. Please try again later.');
    }
}

// Load user progress for the current course
async function loadUserCourseProgress(courseId) {
    if (!window.authSystem || !window.authSystem.isLoggedIn()) {
        userCourseProgress = { completed_chapters: {} }; // Reset if not logged in
        return;
    }
    try {
        const token = await window.authSystem.getAccessToken();
        if (!token) {
            userCourseProgress = { completed_chapters: {} };
            return; // Not logged in or token unavailable
        }
        // This API endpoint needs to be created.
        // It should return progress for a specific course, e.g., { courseId: "id", completed_chapters: {"chapter1_id": true, "chapter2_id": false} }
        const response = await fetch(`/api/tutorials/course/${courseId}/progress`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.progress) {
                userCourseProgress = data.progress;
            } else {
                userCourseProgress = { completed_chapters: {} }; // Default to empty progress
            }
        } else {
             userCourseProgress = { completed_chapters: {} }; // Default on error
        }
    } catch (error) {
        console.warn('Could not load user course progress:', error);
        userCourseProgress = { completed_chapters: {} }; // Default on error
    }
}

function renderCourseHeader() {
    if (!currentCourseData || !courseTitleElem || !courseSubtitleElem || !courseMetaElem) return;

    courseTitleElem.textContent = currentCourseData.title;
    courseSubtitleElem.textContent = currentCourseData.subtitle || '';

    // Basic meta info - can be expanded
    courseMetaElem.innerHTML = `
        <span>Difficulty: ${currentCourseData.difficulty || 'N/A'}</span>
        <span>Est. Duration: ${currentCourseData.estimated_duration || 'N/A'} hours</span>
        <span>Chapters: ${currentCourseData.chapters ? currentCourseData.chapters.length : 0}</span>
    `;
}

function renderChapterList() {
    if (!currentCourseData || !currentCourseData.chapters || !chapterListElem) return;

    if (currentCourseData.chapters.length === 0) {
        chapterListElem.innerHTML = '<li>No chapters available for this course.</li>';
        return;
    }

    chapterListElem.innerHTML = currentCourseData.chapters.map(chapter => {
        const isCompleted = userCourseProgress.completed_chapters && userCourseProgress.completed_chapters[chapter.id];
        return `
            <li>
                <a href="#" data-chapter-id="${chapter.id}" class="${isCompleted ? 'completed' : ''}">
                    ${chapter.title}
                </a>
            </li>
        `;
    }).join('');

    // Add event listeners to chapter links
    chapterListElem.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const chapterId = e.target.dataset.chapterId;
            // Update URL without full reload for better UX
            history.pushState(null, '', `/tutorials/course/${currentCourseData.id}/chapter/${chapterId}`);
            loadChapterContent(chapterId);
        });
    });
}

// Determine which chapter to load initially
function determineInitialChapter() {
    const chapterIdFromUrl = getChapterIdFromUrl();
    if (chapterIdFromUrl) {
        return chapterIdFromUrl;
    }
    // Optional: Could add logic here to find the first incomplete chapter from userCourseProgress
    if (currentCourseData && currentCourseData.chapters && currentCourseData.chapters.length > 0) {
        if (userCourseProgress && userCourseProgress.last_viewed_chapter_id) {
            // Check if last_viewed_chapter_id is valid for this course
            if (currentCourseData.chapters.find(ch => ch.id === userCourseProgress.last_viewed_chapter_id)) {
                return userCourseProgress.last_viewed_chapter_id;
            }
        }
        // Default to the first chapter if no specific chapter is in URL or progress
        // return currentCourseData.chapters[0].id;
    }
    return null; // Let the caller decide a fallback if needed
}


// Load content for a specific chapter
async function loadChapterContent(chapterId) {
    if (!currentCourseData) {
        displayChapterError('Course data is not loaded.');
        return;
    }

    const chapter = currentCourseData.chapters.find(c => c.id === chapterId);
    if (!chapter) {
        displayChapterError('Chapter not found.');
        return;
    }

    currentChapterId = chapterId;
    chapterTitleElem.textContent = chapter.title;
    chapterContentElem.innerHTML = '<div class="loading-spinner">Loading chapter content...</div>'; // Show loading state
    youtubeEmbedElem.style.display = 'none'; // Hide video by default

    try {
        // This API endpoint needs to be created.
        // It should return detailed content for a single chapter, e.g., { success: true, chapter: { id: "...", title: "...", content: "...", type: "markdown|video", video_url: "..." } }
        const response = await fetch(`/api/tutorials/course/${currentCourseData.id}/chapter/${chapterId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        if (data.success && data.chapter) {
            const detailedChapter = data.chapter;
            if (detailedChapter.type === 'video' && detailedChapter.video_url) {
                if (youtubeIframe) {
                    youtubeIframe.src = convertToEmbedUrl(detailedChapter.video_url);
                    youtubeEmbedElem.style.display = 'block';
                }
                chapterContentElem.innerHTML = detailedChapter.content || ''; // Display text content if any
            } else if (detailedChapter.content_markdown) { // Assuming markdown content
                 // Use a Markdown renderer if available (e.g., Showdown, Marked.js)
                if (window.showdown) {
                    const converter = new showdown.Converter({tables: true, strikethrough: true, tasklists: true});
                    chapterContentElem.innerHTML = converter.makeHtml(detailedChapter.content_markdown);
                } else {
                    // Fallback to preformatted text if no Markdown renderer
                    chapterContentElem.innerHTML = `<pre>${detailedChapter.content_markdown}</pre>`;
                }
            }
            else { // Default to HTML content or plain text
                chapterContentElem.innerHTML = detailedChapter.content || '<p>No content available for this chapter.</p>';
            }
            highlightCurrentChapterLink();
            updateNavigationButtons();
            renderMarkCompleteButton();

            // Mark as viewed (could be implicit or explicit)
            if (window.authSystem && window.authSystem.isLoggedIn()) {
                 await markChapterAsViewed(chapterId); // Fire-and-forget is okay here
            }

        } else {
            throw new Error(data.error || 'Failed to load chapter content.');
        }
    } catch (error) {
        console.error('Error loading chapter content:', error);
        displayChapterError('Unable to load chapter. Please try again.');
    }
}

function convertToEmbedUrl(url) {
    if (!url) return '';
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
            return `https://www.youtube.com/embed/${urlObj.pathname.slice(1)}`;
        } else if (urlObj.hostname === 'www.youtube.com' && urlObj.searchParams.has('v')) {
            return `https://www.youtube.com/embed/${urlObj.searchParams.get('v')}`;
        }
    } catch (e) {
        console.error("Invalid video URL", e);
        return ''; // Invalid URL
    }
    return url; // Return original if not a known YouTube format
}

function highlightCurrentChapterLink() {
    chapterListElem.querySelectorAll('a').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.chapterId === currentChapterId) {
            link.classList.add('active');
        }
    });
}

function updateNavigationButtons() {
    if (!currentCourseData || !currentChapterId) return;

    const currentIndex = currentCourseData.chapters.findIndex(c => c.id === currentChapterId);

    prevChapterBtn.disabled = currentIndex <= 0;
    nextChapterBtn.disabled = currentIndex >= currentCourseData.chapters.length - 1;
}

function renderMarkCompleteButton() {
    if (!markCompleteBtnContainer || !currentChapterId || !window.authSystem || !window.authSystem.isLoggedIn()) {
        if(markCompleteBtnContainer) markCompleteBtnContainer.innerHTML = ''; // Clear if not logged in
        return;
    }

    const isCompleted = userCourseProgress.completed_chapters && userCourseProgress.completed_chapters[currentChapterId];

    markCompleteBtnContainer.innerHTML = `
        <button id="mark-complete-btn" class="btn ${isCompleted ? 'secondary' : 'primary'}" style="margin-top:10px;">
            ${isCompleted ? '✅ Mark as Incomplete' : '◻️ Mark as Complete'}
        </button>
    `;

    document.getElementById('mark-complete-btn').addEventListener('click', async () => {
        await toggleChapterCompletion(currentChapterId);
    });
}

async function toggleChapterCompletion(chapterId) {
    if (!window.authSystem || !window.authSystem.isLoggedIn() || !currentCourseData) return;

    const token = await window.authSystem.getAccessToken();
    if (!token) {
        alert('You must be logged in to update progress.');
        return;
    }

    const isCurrentlyCompleted = userCourseProgress.completed_chapters && userCourseProgress.completed_chapters[chapterId];
    const newStatus = !isCurrentlyCompleted;

    try {
        // This API endpoint needs to be created
        // POST /api/tutorials/course/{courseId}/chapter/{chapterId}/progress
        // Body: { completed: newStatus }
        const response = await fetch(`/api/tutorials/course/${currentCourseData.id}/chapter/${chapterId}/progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ completed: newStatus })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                if (!userCourseProgress.completed_chapters) {
                    userCourseProgress.completed_chapters = {};
                }
                userCourseProgress.completed_chapters[chapterId] = newStatus;

                // Update UI
                renderChapterList(); // Re-render list to show completion status
                highlightCurrentChapterLink(); // Re-highlight as renderChapterList might remove it
                renderMarkCompleteButton(); // Update button text/state

                // Optionally, show a success message
            } else {
                throw new Error(data.error || 'Failed to update progress.');
            }
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error toggling chapter completion:', error);
        alert(`Failed to update progress: ${error.message}`);
    }
}

async function markChapterAsViewed(chapterId) {
    // This function could inform the backend that a chapter has been viewed.
    // Useful for tracking "last viewed chapter" or more detailed analytics.
    // For now, it's a placeholder.
    if (!window.authSystem || !window.authSystem.isLoggedIn() || !currentCourseData) return;
    const token = await window.authSystem.getAccessToken();
    if (!token) return;

    try {
        // Example: POST /api/tutorials/course/{courseId}/chapter/{chapterId}/viewed
        await fetch(`/api/tutorials/course/${currentCourseData.id}/chapter/${chapterId}/viewed`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        // No need to handle response for this fire-and-forget action
    } catch (error) {
        console.warn('Could not mark chapter as viewed:', error);
    }
}


function setupEventListeners() {
    if (prevChapterBtn) {
        prevChapterBtn.addEventListener('click', () => {
            const currentIndex = currentCourseData.chapters.findIndex(c => c.id === currentChapterId);
            if (currentIndex > 0) {
                const prevChapterId = currentCourseData.chapters[currentIndex - 1].id;
                history.pushState(null, '', `/tutorials/course/${currentCourseData.id}/chapter/${prevChapterId}`);
                loadChapterContent(prevChapterId);
            }
        });
    }

    if (nextChapterBtn) {
        nextChapterBtn.addEventListener('click', () => {
            const currentIndex = currentCourseData.chapters.findIndex(c => c.id === currentChapterId);
            if (currentIndex < currentCourseData.chapters.length - 1) {
                const nextChapterId = currentCourseData.chapters[currentIndex + 1].id;
                history.pushState(null, '', `/tutorials/course/${currentCourseData.id}/chapter/${nextChapterId}`);
                loadChapterContent(nextChapterId);
            }
        });
    }
    // Handle browser back/forward navigation for chapter changes
    window.addEventListener('popstate', () => {
        const chapterIdFromUrl = getChapterIdFromUrl();
        const courseIdFromUrl = getCourseIdFromUrl();

        if (courseIdFromUrl === currentCourseData?.id && chapterIdFromUrl && chapterIdFromUrl !== currentChapterId) {
            loadChapterContent(chapterIdFromUrl);
        } else if (courseIdFromUrl === currentCourseData?.id && !chapterIdFromUrl && currentChapterId) {
            // Navigated back to course page from a chapter page (no specific chapter in URL)
            // Optionally, clear chapter content or load a default state
            chapterTitleElem.textContent = "Select a Chapter";
            chapterContentElem.innerHTML = "<p>Please select a chapter from the list to view its content.</p>";
            youtubeEmbedElem.style.display = 'none';
            if(youtubeIframe) youtubeIframe.src = '';
            highlightCurrentChapterLink(); // No chapter is active
            updateNavigationButtons();
            if(markCompleteBtnContainer) markCompleteBtnContainer.innerHTML = '';
        }
    });
}

function displayError(message) {
    if (courseTitleElem) courseTitleElem.textContent = 'Error';
    if (chapterListElem) chapterListElem.innerHTML = '';
    if (chapterContentElem) chapterContentElem.innerHTML = `<div class="error-message">${message}</div>`;
    else if (document.getElementById('course-page-container')) {
        document.getElementById('course-page-container').innerHTML = `<div class="error-message">${message}</div>`;
    }
}

function displayChapterError(message) {
    if (chapterTitleElem) chapterTitleElem.textContent = 'Error';
    if (chapterContentElem) chapterContentElem.innerHTML = `<div class="error-message">${message}</div>`;
}

// Ensure DOM is loaded before running init
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase and AuthSystem to be ready (similar to tutorials.js)
    const waitForSupabase = () => {
        return new Promise((resolve) => {
            if (window.supabase && window.SUPABASE_CONFIG?.url && window.SUPABASE_CONFIG?.anonKey) {
                resolve();
            } else {
                window.addEventListener('supabaseReady', () => resolve(), { once: true });
                setTimeout(() => resolve(), 5000); // Fallback timeout
            }
        });
    };
    await waitForSupabase();
    await new Promise(resolve => setTimeout(resolve, 500)); // Additional delay

    if (window.authSystem && typeof window.authSystem.initAuth === 'function') {
        try {
            await window.authSystem.initAuth();
        } catch (error) {
            console.warn('Auth system initialization failed on course page:', error);
        }
    }
    // It's good to have Showdown.js library for Markdown rendering.
    // Add this to your HTML: <script src="https://cdnjs.cloudflare.com/ajax/libs/showdown/1.9.1/showdown.min.js"></script>
    // Or install via npm and bundle it.
    initCoursePage();
});

// Functions from tutorials.js that might be needed (or moved to a common.js)
// These are placeholders; actual implementation might vary if refactored.
function setupMenuToggle() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                navMenu.classList.remove('active');
            }
        });
        const progressBtn = document.getElementById('progress-btn');
        if (progressBtn) {
            progressBtn.addEventListener('click', () => {
                if (window.authSystem && window.authSystem.isLoggedIn()) {
                    // This function needs to be available globally or imported
                    if (typeof showTutorialProgress === 'function') showTutorialProgress();
                    else console.warn('showTutorialProgress function not found.');
                } else {
                    document.getElementById('auth-toggle-btn')?.click();
                }
                navMenu.classList.remove('active');
            });
        }
    }
}

function setupFooterModals() {
    const disclaimerBtn = document.getElementById('disclaimer-btn');
    const disclaimerModal = document.getElementById('disclaimer-modal');
    const closeDisclaimerModal = document.getElementById('close-disclaimer-modal');
    if (disclaimerBtn && disclaimerModal && closeDisclaimerModal) {
        disclaimerBtn.addEventListener('click', (e) => { e.preventDefault(); disclaimerModal.style.display = 'flex'; });
        closeDisclaimerModal.addEventListener('click', () => { disclaimerModal.style.display = 'none'; });
        disclaimerModal.addEventListener('click', (e) => { if (e.target === disclaimerModal) disclaimerModal.style.display = 'none'; });
    }
    const contactBtn = document.getElementById('contact-btn');
    const contactModal = document.getElementById('contact-modal');
    const closeContactModal = document.getElementById('close-contact-modal');
    const contactForm = document.getElementById('contact-form');
    if (contactBtn && contactModal && closeContactModal && contactForm) {
        contactBtn.addEventListener('click', (e) => { e.preventDefault(); contactModal.style.display = 'flex'; });
        closeContactModal.addEventListener('click', () => { contactModal.style.display = 'none'; });
        contactModal.addEventListener('click', (e) => { if (e.target === contactModal) contactModal.style.display = 'none'; });
        contactForm.addEventListener('submit', async (e) => { e.preventDefault(); if(typeof handleContactForm === 'function') await handleContactForm(); else console.warn('handleContactForm not found'); });
        const contactCancel = document.getElementById('contact-cancel');
        if (contactCancel) contactCancel.addEventListener('click', () => { contactModal.style.display = 'none'; contactForm.reset(); });
    }
}
function setupDemoModal() {
    const demoBtn = document.getElementById('demo-btn');
    const demoModal = document.getElementById('demo-modal');
    const closeDemoModal = document.getElementById('close-demo-modal');
    if (demoBtn) demoBtn.addEventListener('click', () => { if(demoModal) demoModal.style.display = 'flex';});
    if (closeDemoModal) closeDemoModal.addEventListener('click', () => { if(demoModal) demoModal.style.display = 'none'; });
    if (demoModal) demoModal.addEventListener('click', (e) => { if (e.target === demoModal) demoModal.style.display = 'none'; });
}

// handleContactForm and showTutorialProgress would need to be defined globally or imported
// For now, this course.js assumes they might be available from tutorials.js if it's loaded,
// or these features on the course page simply won't work until a proper shared module is created.
// A more robust solution is to create a common.js for shared UI functions.

// Placeholder for showTutorialProgress if not available from tutorials.js
if (typeof showTutorialProgress === 'undefined') {
    window.showTutorialProgress = function() {
        const progressModal = document.getElementById('progress-modal');
        if (progressModal) progressModal.style.display = 'flex';
        // Actual loading of progress data would need to be implemented here or in tutorials.js
        console.warn("Minimal showTutorialProgress called. Full functionality might be missing.");
        const completedChaptersDiv = document.getElementById('completed-chapters');
        if(completedChaptersDiv) completedChaptersDiv.innerHTML = "<p>Progress loading not fully implemented here. Check main tutorials page.</p>";

        const closeProgressModal = document.getElementById('close-progress-modal');
         if(closeProgressModal && progressModal) {
            closeProgressModal.addEventListener('click', () => {
                progressModal.style.display = 'none';
            });
         }
    }
}
// Placeholder for handleContactForm if not available from tutorials.js
if (typeof handleContactForm === 'undefined') {
    window.handleContactForm = async function() {
        console.warn("Minimal handleContactForm called. Full functionality might be missing.");
        const resultDiv = document.getElementById('contact-result');
        if(resultDiv) resultDiv.innerHTML = "<p class='error-message'>Contact form not fully implemented on this page.</p>";
    }
}
