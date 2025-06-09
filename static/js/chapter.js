// Chapter functionality
let chapterData = null;
let courseData = null;
let chaptersData = [];
let testQuestions = [];
let practicalEditor = null;

// Initialize chapter page
async function initChapter() {
    // Get data from window object (injected by template)
    if (window.TUTORIAL_DATA) {
        chapterData = window.TUTORIAL_DATA.chapter;
        courseData = window.TUTORIAL_DATA.course;
        chaptersData = window.TUTORIAL_DATA.chapters;
        testQuestions = window.TUTORIAL_DATA.testQuestions || [];
    }
    
    setupMenuToggle();
    setupFooterModals();
    setupDemoModal();
    setupChapterNavigation();
    setupChapterActions();
    setupTestModal();
    setupPracticalModal();
    
    // Update UI with current data
    updateCourseProgress();
    updateChapterNavigation();
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
                    document.getElementById('auth-toggle-btn').click();
                }
                navMenu.classList.remove('active');
            });
        }
    }
}

// Set up footer modals (reuse from tutorials.js)
function setupFooterModals() {
    // Implementation would be similar to tutorials.js
    // Skipping for brevity but would include disclaimer and contact modals
}

// Set up demo modal
function setupDemoModal() {
    const demoBtn = document.getElementById('demo-btn');
    const demoModal = document.getElementById('demo-modal');
    const closeDemoModal = document.getElementById('close-demo-modal');
    
    if (demoBtn) {
        demoBtn.addEventListener('click', () => {
            if (demoModal) demoModal.style.display = 'flex';
        });
    }
    
    if (closeDemoModal) {
        closeDemoModal.addEventListener('click', () => {
            if (demoModal) demoModal.style.display = 'none';
        });
    }
    
    if (demoModal) {
        demoModal.addEventListener('click', (e) => {
            if (e.target === demoModal) {
                demoModal.style.display = 'none';
            }
        });
    }
}

// Set up chapter navigation in sidebar
function setupChapterNavigation() {
    const chaptersNav = document.getElementById('chapters-nav');
    if (!chaptersNav || !chaptersData) return;
    
    const navHTML = chaptersData.map(chapter => {
        const isActive = chapter.id === chapterData.id;
        const isCompleted = isChapterCompleted(chapter.id);
        
        let statusIcon = '○';
        let statusClass = '';
        
        if (isCompleted) {
            statusIcon = '✓';
            statusClass = 'completed';
        } else if (isActive) {
            statusIcon = '▶';
            statusClass = 'active';
        }
        
        return `
            <a href="/tutorials/course/${courseData.id}/chapter/${chapter.id}" 
               class="chapter-nav-item ${statusClass}">
                <span class="chapter-status">${statusIcon}</span>
                <span class="chapter-title">${chapter.title}</span>
            </a>
        `;
    }).join('');
    
    chaptersNav.innerHTML = navHTML;
}

// Set up chapter action buttons
function setupChapterActions() {
    const takeTestBtn = document.getElementById('take-test-btn');
    const startPracticalBtn = document.getElementById('start-practical-btn');
    const markCompleteBtn = document.getElementById('mark-complete-btn');
    
    if (takeTestBtn) {
        takeTestBtn.addEventListener('click', openTestModal);
    }
    
    if (startPracticalBtn) {
        startPracticalBtn.addEventListener('click', openPracticalModal);
    }
    
    if (markCompleteBtn) {
        markCompleteBtn.addEventListener('click', markChapterComplete);
    }
    
    // Update button states based on completion
    updateChapterActionButtons();
}

// Set up test modal functionality
function setupTestModal() {
    const testModal = document.getElementById('test-modal');
    const closeTestModal = document.getElementById('close-test-modal');
    const submitTestBtn = document.getElementById('submit-test-btn');
    const cancelTestBtn = document.getElementById('cancel-test-btn');
    
    if (closeTestModal) {
        closeTestModal.addEventListener('click', closeTestModalHandler);
    }
    
    if (cancelTestBtn) {
        cancelTestBtn.addEventListener('click', closeTestModalHandler);
    }
    
    if (submitTestBtn) {
        submitTestBtn.addEventListener('click', submitTest);
    }
    
    if (testModal) {
        testModal.addEventListener('click', (e) => {
            if (e.target === testModal) {
                closeTestModalHandler();
            }
        });
    }
}

// Set up practical modal functionality
function setupPracticalModal() {
    const practicalModal = document.getElementById('practical-modal');
    const closePracticalModal = document.getElementById('close-practical-modal');
    const runPracticalBtn = document.getElementById('run-practical-btn');
    const submitPracticalBtn = document.getElementById('submit-practical-btn');
    const cancelPracticalBtn = document.getElementById('cancel-practical-btn');
    
    if (closePracticalModal) {
        closePracticalModal.addEventListener('click', closePracticalModalHandler);
    }
    
    if (cancelPracticalBtn) {
        cancelPracticalBtn.addEventListener('click', closePracticalModalHandler);
    }
    
    if (runPracticalBtn) {
        runPracticalBtn.addEventListener('click', runPracticalCode);
    }
    
    if (submitPracticalBtn) {
        submitPracticalBtn.addEventListener('click', submitPractical);
    }
    
    if (practicalModal) {
        practicalModal.addEventListener('click', (e) => {
            if (e.target === practicalModal) {
                closePracticalModalHandler();
            }
        });
    }
}

// Update course progress display
function updateCourseProgress() {
    const progressFill = document.getElementById('course-progress-fill');
    const progressText = document.getElementById('course-progress-text');
    
    if (!progressFill || !progressText || !chaptersData) return;
    
    const completedChapters = chaptersData.filter(chapter => isChapterCompleted(chapter.id)).length;
    const totalChapters = chaptersData.length;
    const progressPercentage = Math.round((completedChapters / totalChapters) * 100);
    
    progressFill.style.width = `${progressPercentage}%`;
    progressText.textContent = `${progressPercentage}% Complete`;
}

// Update chapter navigation to reflect current state
function updateChapterNavigation() {
    // This is handled in setupChapterNavigation()
    setupChapterNavigation();
}

// Update chapter action buttons based on completion status
function updateChapterActionButtons() {
    const markCompleteBtn = document.getElementById('mark-complete-btn');
    
    if (markCompleteBtn) {
        if (isChapterCompleted(chapterData.id)) {
            markCompleteBtn.textContent = '✅ Completed';
            markCompleteBtn.disabled = true;
            markCompleteBtn.classList.add('success');
        }
    }
}

// Check if a chapter is completed
function isChapterCompleted(chapterId) {
    // This would check against user progress data
    // For now, return false - implement with actual progress tracking
    return false;
}

// Open test modal
function openTestModal() {
    const testModal = document.getElementById('test-modal');
    if (!testModal) return;
    
    // Load test questions
    loadTestQuestions();
    testModal.style.display = 'flex';
}

// Close test modal
function closeTestModalHandler() {
    const testModal = document.getElementById('test-modal');
    if (testModal) {
        testModal.style.display = 'none';
        // Reset test state
        resetTestModal();
    }
}

// Load test questions into modal
function loadTestQuestions() {
    const testQuestionsContainer = document.getElementById('test-questions');
    if (!testQuestionsContainer || !testQuestions || testQuestions.length === 0) {
        testQuestionsContainer.innerHTML = '<p>No test questions available for this chapter.</p>';
        return;
    }
    
    const questionsHTML = testQuestions.map((question, index) => `
        <div class="test-question" data-question-id="${index}">
            <div class="question-header">
                <div class="question-number">${index + 1}</div>
                <div class="question-text">${question.question}</div>
            </div>
            <div class="question-options">
                ${question.options.map((option, optionIndex) => `
                    <label class="question-option">
                        <input type="radio" name="question-${index}" value="${optionIndex}">
                        <span>${option}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    testQuestionsContainer.innerHTML = questionsHTML;
    
    // Add event listeners for option selection
    testQuestionsContainer.querySelectorAll('.question-option').forEach(option => {
        option.addEventListener('click', () => {
            const radio = option.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                // Remove selected class from siblings
                option.parentNode.querySelectorAll('.question-option').forEach(sibling => {
                    sibling.classList.remove('selected');
                });
                // Add selected class to current option
                option.classList.add('selected');
            }
        });
    });
}

// Submit test
async function submitTest() {
    const testQuestionsContainer = document.getElementById('test-questions');
    const answers = [];
    
    // Collect answers
    testQuestions.forEach((question, index) => {
        const selectedOption = testQuestionsContainer.querySelector(`input[name="question-${index}"]:checked`);
        answers.push(selectedOption ? parseInt(selectedOption.value) : null);
    });
    
    // Validate all questions answered
    if (answers.includes(null)) {
        alert('Please answer all questions before submitting.');
        return;
    }
    
    // Submit to backend
    try {
        const response = await fetch('/api/tutorials/submit-test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getAuthToken()}`
            },
            body: JSON.stringify({
                course_id: courseData.id,
                chapter_id: chapterData.id,
                answers: answers
            })
        });
        
        const result = await response.json();
        if (result.success) {
            showTestResults(result.score, result.passed, result.feedback);
        } else {
            throw new Error(result.error || 'Failed to submit test');
        }
    } catch (error) {
        alert(`Error submitting test: ${error.message}`);
    }
}

// Show test results
function showTestResults(score, passed, feedback) {
    const testContent = document.getElementById('test-content');
    const testResults = document.getElementById('test-results');
    
    testContent.style.display = 'none';
    testResults.style.display = 'block';
    
    testResults.innerHTML = `
        <div class="test-score ${passed ? 'passed' : 'failed'}">${score}%</div>
        <div class="test-feedback">${feedback}</div>
        <div class="test-actions">
            <button onclick="closeTestModalHandler()" class="btn primary">Continue</button>
            ${!passed ? '<button onclick="retakeTest()" class="btn secondary">Retake Test</button>' : ''}
        </div>
    `;
    
    // Scroll to results
    setTimeout(() => {
        testResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// Reset test modal
function resetTestModal() {
    const testContent = document.getElementById('test-content');
    const testResults = document.getElementById('test-results');
    
    if (testContent) testContent.style.display = 'block';
    if (testResults) testResults.style.display = 'none';
    
    // Clear selections
    const testQuestionsContainer = document.getElementById('test-questions');
    if (testQuestionsContainer) {
        testQuestionsContainer.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.checked = false;
        });
        testQuestionsContainer.querySelectorAll('.question-option').forEach(option => {
            option.classList.remove('selected');
        });
    }
}

// Retake test
function retakeTest() {
    resetTestModal();
}

// Open practical modal
function openPracticalModal() {
    const practicalModal = document.getElementById('practical-modal');
    if (!practicalModal) return;
    
    practicalModal.style.display = 'flex';
    
    // Initialize code editor
    setTimeout(() => {
        initPracticalEditor();
    }, 100);
}

// Close practical modal
function closePracticalModalHandler() {
    const practicalModal = document.getElementById('practical-modal');
    if (practicalModal) {
        practicalModal.style.display = 'none';
        // Clean up editor
        if (practicalEditor) {
            practicalEditor.dispose();
            practicalEditor = null;
        }
    }
}

// Initialize practical code editor
function initPracticalEditor() {
    if (!window.monaco) {
        console.error('Monaco editor not loaded');
        return;
    }
    
    const editorContainer = document.getElementById('practical-code-editor');
    if (!editorContainer) return;
    
    // Dispose existing editor
    if (practicalEditor) {
        practicalEditor.dispose();
    }
    
    const language = document.getElementById('practical-language').value || 'python';
    
    practicalEditor = window.monaco.editor.create(editorContainer, {
        value: getStarterCode(language),
        language: language,
        theme: 'vs-light',
        automaticLayout: true,
        fontSize: 14,
        minimap: { enabled: false },
        wordWrap: 'on',
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        folding: true,
        autoIndent: 'full'
    });
    
    // Language change handler
    const languageSelect = document.getElementById('practical-language');
    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            const newLanguage = e.target.value;
            const model = practicalEditor.getModel();
            window.monaco.editor.setModelLanguage(model, newLanguage);
            practicalEditor.setValue(getStarterCode(newLanguage));
        });
    }
}

// Get starter code for different languages
function getStarterCode(language) {
    const starterCodes = {
        python: `# Write your solution here
def solve():
    # Your code goes here
    pass

# Test your function
result = solve()
print(result)`,
        
        javascript: `// Write your solution here
function solve() {
    // Your code goes here
}

// Test your function
const result = solve();
console.log(result);`,
        
        java: `// Write your solution here
public class Solution {
    public static void main(String[] args) {
        Solution sol = new Solution();
        // Test your method
        System.out.println(sol.solve());
    }
    
    public Object solve() {
        // Your code goes here
        return null;
    }
}`,
        
        cpp: `// Write your solution here
#include <iostream>
using namespace std;

void solve() {
    // Your code goes here
}

int main() {
    solve();
    return 0;
}`
    };
    
    return starterCodes[language] || starterCodes.python;
}

// Run practical code
async function runPracticalCode() {
    if (!practicalEditor) return;
    
    const code = practicalEditor.getValue();
    const language = document.getElementById('practical-language').value;
    
    const outputContainer = document.getElementById('practical-output');
    const outputContent = document.getElementById('practical-output-content');
    
    outputContainer.style.display = 'block';
    outputContent.textContent = 'Running code...';
    
    // Scroll to output section
    setTimeout(() => {
        outputContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    try {
        // Use the same code execution API as the main platform
        const response = await fetch('/api/execute-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: code,
                language: language
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            outputContent.textContent = result.output || '(no output)';
        } else {
            outputContent.textContent = `Error: ${result.error}`;
        }
    } catch (error) {
        outputContent.textContent = `Error running code: ${error.message}`;
    }
}

// Submit practical exercise
async function submitPractical() {
    if (!practicalEditor) return;
    
    const code = practicalEditor.getValue().trim();
    const language = document.getElementById('practical-language').value;
    
    if (!code) {
        alert('Please write some code before submitting.');
        return;
    }
    
    try {
        const response = await fetch('/api/tutorials/submit-practical', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getAuthToken()}`
            },
            body: JSON.stringify({
                course_id: courseData.id,
                chapter_id: chapterData.id,
                code: code,
                language: language
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showPracticalResults(result.evaluation, result.passed);
        } else {
            throw new Error(result.error || 'Failed to submit practical');
        }
    } catch (error) {
        alert(`Error submitting practical: ${error.message}`);
    }
}

// Show practical results
function showPracticalResults(evaluation, passed) {
    const resultsContainer = document.getElementById('practical-results');
    if (!resultsContainer) return;
    
    // Format the evaluation text to preserve line breaks and add proper spacing
    const formattedEvaluation = formatPracticalFeedback(evaluation);
    
    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = `
        <h4>📋 Exercise Evaluation</h4>
        <div class="practical-feedback ${passed ? 'success' : 'needs-work'}">
            ${formattedEvaluation}
        </div>
        <div class="practical-actions">
            <button onclick="closePracticalModalHandler()" class="btn primary">Continue</button>
            ${!passed ? '<button onclick="retryPractical()" class="btn secondary">Try Again</button>' : ''}
        </div>
    `;
    
    // Scroll to results
    setTimeout(() => {
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// Format practical feedback for better readability
function formatPracticalFeedback(text) {
    if (!text) return '';
    
    // Convert newlines to HTML line breaks
    let formatted = text.replace(/\n/g, '<br>');
    
    // Add extra spacing after section headers (like **Result:** **Feedback:** etc.)
    formatted = formatted.replace(/\*\*(.*?):\*\*/g, '<strong>$1:</strong>');
    
    // Add spacing after bullet points and dashes
    formatted = formatted.replace(/^[\-\•]\s/gm, '<br>• ');
    
    // Add spacing between major sections
    formatted = formatted.replace(/<br><strong>/g, '<br><br><strong>');
    
    // Clean up multiple consecutive line breaks
    formatted = formatted.replace(/(<br\s*\/?>){3,}/g, '<br><br>');
    
    // Remove leading line breaks
    formatted = formatted.replace(/^(<br\s*\/?>)+/, '');
    
    return formatted;
}

// Retry practical
function retryPractical() {
    const resultsContainer = document.getElementById('practical-results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
}

// Mark chapter as complete
async function markChapterComplete() {
    if (!window.authSystem || !window.authSystem.isLoggedIn()) {
        alert('Please log in to track your progress.');
        return;
    }
    
    try {
        const response = await fetch('/api/tutorials/mark-complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getAuthToken()}`
            },
            body: JSON.stringify({
                course_id: courseData.id,
                chapter_id: chapterData.id
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            updateChapterActionButtons();
            updateCourseProgress();
            updateChapterNavigation();
            
            if (window.showSuccess) {
                window.showSuccess('Chapter marked as complete! 🎉');
            }
        } else {
            throw new Error(result.error || 'Failed to mark chapter complete');
        }
    } catch (error) {
        alert(`Error marking chapter complete: ${error.message}`);
    }
}

// Get auth token (placeholder - implement based on your auth system)
async function getAuthToken() {
    // This would integrate with your Supabase auth system
    return 'placeholder-token';
}

// Provide showSuccess function for auth system
window.showSuccess = function(message) {
    // Simple alert for now - could be enhanced with a toast notification
    alert(message);
};

// Initialize chapter when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Monaco to load
    if (window.require) {
        require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.45.0/min/vs' } });
        require(['vs/editor/editor.main'], function () {
            window.monaco = monaco;
        });
    }
    
    await initChapter();
    
    // Initialize auth system
    const waitForSupabase = () => {
        return new Promise((resolve) => {
            if (window.supabase && window.TUTORIAL_DATA?.supabaseConfig?.url) {
                resolve();
            } else {
                window.addEventListener('supabaseReady', () => {
                    resolve();
                }, { once: true });
                setTimeout(() => {
                    resolve();
                }, 5000);
            }
        });
    };
    
    await waitForSupabase();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (window.authSystem && window.authSystem.initAuth) {
        try {
            await window.authSystem.initAuth();
        } catch (error) {
            // Silent fallback
        }
    }
});