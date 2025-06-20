// Course Editor JavaScript

let courseData = null;
let chaptersData = [];
let currentChapter = null;
let richEditor = null;
let chaptersSortable = null;

// Initialize the course editor
document.addEventListener('DOMContentLoaded', function() {
    initializeCourseEditor();
});

function initializeCourseEditor() {
    // Load course data if editing
    const courseId = document.getElementById('course-id').value;
    if (courseId) {
        loadCourseData(courseId);
    }
    
    // Initialize form handlers
    setupFormHandlers();
    
    // Initialize rich text editor
    initializeRichEditor();
    
    // Initialize drag and drop for chapters
    initializeChapterSorting();
    
    // Load chapters
    loadChapters();
}

// Setup form event handlers
function setupFormHandlers() {
    // Auto-generate slug from title
    const titleInput = document.getElementById('course-title');
    const slugInput = document.getElementById('course-slug');
    
    titleInput.addEventListener('input', function() {
        if (!slugInput.dataset.manuallyEdited) {
            slugInput.value = generateSlug(this.value);
        }
    });
    
    slugInput.addEventListener('input', function() {
        this.dataset.manuallyEdited = 'true';
        this.value = generateSlug(this.value);
    });
    
    // Handle tag input
    const tagsInput = document.getElementById('course-tags');
    tagsInput.addEventListener('blur', function() {
        // Format tags
        const tags = this.value.split(',').map(tag => tag.trim()).filter(tag => tag);
        this.value = tags.join(', ');
    });
}

// Initialize rich text editor
function initializeRichEditor() {
    const editorContainer = document.getElementById('chapter-content-editor');
    if (editorContainer && window.Quill) {
        richEditor = new Quill(editorContainer, {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'image'],
                    ['clean']
                ]
            },
            placeholder: 'Write your chapter content here...'
        });
    }
}

// Initialize chapter drag and drop sorting
function initializeChapterSorting() {
    const chaptersList = document.getElementById('chapters-list');
    if (chaptersList && window.Sortable) {
        chaptersSortable = Sortable.create(chaptersList, {
            handle: '.chapter-drag-handle',
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function(evt) {
                // Update chapter order
                updateChapterOrder();
            }
        });
    }
}

// Load course data
async function loadCourseData(courseId) {
    try {
        const response = await fetch(`/api/admin/courses/${courseId}`);
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                courseData = data.course;
                populateCourseForm(courseData);
            }
        }
    } catch (error) {
        console.error('Error loading course data:', error);
    }
}

// Load chapters
async function loadChapters() {
    const courseId = document.getElementById('course-id').value;
    if (!courseId) return;
    
    try {
        const response = await fetch(`/api/admin/courses/${courseId}/chapters`);
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                chaptersData = data.chapters;
                renderChaptersList();
            }
        }
    } catch (error) {
        console.error('Error loading chapters:', error);
    }
}

// Populate course form with data
function populateCourseForm(course) {
    document.getElementById('course-title').value = course.title || '';
    document.getElementById('course-slug').value = course.slug || '';
    document.getElementById('course-difficulty').value = course.difficulty || 'beginner';
    document.getElementById('course-duration').value = course.estimated_duration || 8;
    document.getElementById('course-subtitle').value = course.subtitle || '';
    document.getElementById('course-description').value = course.description || '';
    document.getElementById('course-thumbnail').value = course.thumbnail || '';
    document.getElementById('course-status').value = course.status || 'draft';
    document.getElementById('course-featured').checked = course.featured || false;
    document.getElementById('course-tags').value = course.tags ? course.tags.join(', ') : '';
    document.getElementById('course-prerequisites').value = course.prerequisites || '';
}

// Render chapters list
function renderChaptersList() {
    const chaptersList = document.getElementById('chapters-list');
    
    if (chaptersData.length === 0) {
        chaptersList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📖</div>
                <h4>No chapters yet</h4>
                <p>Add your first chapter to get started</p>
                <button class="btn primary" onclick="addChapter()">Add First Chapter</button>
            </div>
        `;
        return;
    }
    
    const chaptersHTML = chaptersData.map(chapter => `
        <div class="chapter-item" data-chapter-id="${chapter.id}">
            <div class="chapter-header">
                <div class="chapter-drag-handle">⋮⋮</div>
                <div class="chapter-info">
                    <h4 class="chapter-title">${chapter.title}</h4>
                    <span class="chapter-meta">${chapter.estimated_duration}min • ${chapter.difficulty}</span>
                </div>
                <div class="chapter-actions">
                    <button class="btn-icon" onclick="editChapter(${chapter.id})" title="Edit Chapter">✏️</button>
                    <button class="btn-icon" onclick="duplicateChapter(${chapter.id})" title="Duplicate">📋</button>
                    <button class="btn-icon danger" onclick="deleteChapter(${chapter.id})" title="Delete">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
    
    chaptersList.innerHTML = chaptersHTML;
}

// Generate URL slug from text
function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim('-'); // Remove leading/trailing hyphens
}

// Save course
async function saveCourse() {
    const courseId = document.getElementById('course-id').value;
    const isEditing = !!courseId;
    
    // Collect form data
    const formData = {
        title: document.getElementById('course-title').value,
        slug: document.getElementById('course-slug').value,
        difficulty: document.getElementById('course-difficulty').value,
        estimated_duration: parseInt(document.getElementById('course-duration').value),
        subtitle: document.getElementById('course-subtitle').value,
        description: document.getElementById('course-description').value,
        thumbnail: document.getElementById('course-thumbnail').value,
        status: document.getElementById('course-status').value,
        featured: document.getElementById('course-featured').checked,
        tags: document.getElementById('course-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
        prerequisites: document.getElementById('course-prerequisites').value
    };
    
    // Validate required fields
    if (!formData.title || !formData.slug || !formData.description) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const url = isEditing ? `/api/admin/courses/${courseId}` : '/api/admin/courses';
        const method = isEditing ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            courseData = data.course;
            
            if (!isEditing) {
                // Update the hidden course ID field
                document.getElementById('course-id').value = data.course.id;
                showMessage('Course created successfully! You can now add chapters.', 'success');
                
                // Update the page title and actions
                document.querySelector('.editor-title h2').textContent = 'Edit Course';
                document.querySelector('.editor-subtitle').textContent = 'Update course details and manage chapters';
                document.getElementById('save-course').textContent = '💾 Update Course';
                document.getElementById('preview-course').disabled = false;
                document.getElementById('preview-course').setAttribute('onclick', 'previewCourse()');
                
                // Reload chapters (will show empty state with add button)
                await loadChapters();
            } else {
                showMessage('Course updated successfully', 'success');
            }
        } else {
            showMessage(data.error || 'Failed to save course', 'error');
        }
    } catch (error) {
        showMessage('Error saving course: ' + error.message, 'error');
    }
}

// Preview course
function previewCourse() {
    const courseId = document.getElementById('course-id').value;
    if (courseId) {
        window.open(`/tutorials/course/${courseId}`, '_blank');
    }
}

// Add new chapter
function addChapter() {
    currentChapter = null;
    openChapterModal('Add New Chapter');
    resetChapterForm();
}

// Edit existing chapter
function editChapter(chapterId) {
    currentChapter = chaptersData.find(ch => ch.id === chapterId);
    if (currentChapter) {
        openChapterModal('Edit Chapter');
        populateChapterForm(currentChapter);
    }
}

// Duplicate chapter
async function duplicateChapter(chapterId) {
    const chapter = chaptersData.find(ch => ch.id === chapterId);
    if (chapter) {
        const duplicatedChapter = {
            ...chapter,
            title: chapter.title + ' (Copy)',
            chapter_number: chaptersData.length + 1
        };
        delete duplicatedChapter.id; // Remove ID so a new one gets generated
        
        await saveChapterData(duplicatedChapter);
    }
}

// Delete chapter
async function deleteChapter(chapterId) {
    if (!confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) {
        return;
    }
    
    const courseId = document.getElementById('course-id').value;
    
    try {
        const response = await fetch(`/api/admin/courses/${courseId}/chapters/${chapterId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Chapter deleted successfully', 'success');
            await loadChapters();
        } else {
            showMessage(data.error || 'Failed to delete chapter', 'error');
        }
    } catch (error) {
        showMessage('Error deleting chapter: ' + error.message, 'error');
    }
}

// Open chapter modal
function openChapterModal(title) {
    document.getElementById('chapter-modal-title').textContent = title;
    document.getElementById('chapter-modal').style.display = 'flex';
    
    // Switch to details tab
    switchChapterTab('details');
    
    // Focus on title input
    setTimeout(() => {
        document.getElementById('chapter-title').focus();
    }, 100);
}

// Close chapter modal
function closeChapterModal() {
    document.getElementById('chapter-modal').style.display = 'none';
    currentChapter = null;
}

// Switch chapter editor tabs
function switchChapterTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="switchChapterTab('${tabName}')"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`chapter-${tabName}-tab`).classList.add('active');
}

// Reset chapter form
function resetChapterForm() {
    document.getElementById('chapter-title').value = '';
    document.getElementById('chapter-number').value = chaptersData.length + 1;
    document.getElementById('chapter-duration').value = 45;
    document.getElementById('chapter-difficulty').value = 'beginner';
    
    // Reset objectives
    const objectivesList = document.getElementById('objectives-list');
    objectivesList.innerHTML = `
        <div class="objective-item">
            <input type="text" placeholder="What will students learn in this chapter?" class="objective-input">
            <button type="button" onclick="removeObjective(this)" class="btn-remove">×</button>
        </div>
    `;
    
    // Reset content editor
    if (richEditor) {
        richEditor.setContents([]);
    }
    
    // Reset assessments
    document.getElementById('has-test').checked = false;
    document.getElementById('has-practical').checked = false;
    toggleTestSection();
    togglePracticalSection();
}

// Populate chapter form
function populateChapterForm(chapter) {
    document.getElementById('chapter-title').value = chapter.title || '';
    document.getElementById('chapter-number').value = chapter.chapter_number || 1;
    document.getElementById('chapter-duration').value = chapter.estimated_duration || 45;
    document.getElementById('chapter-difficulty').value = chapter.difficulty || 'beginner';
    
    // Populate objectives
    const objectivesList = document.getElementById('objectives-list');
    const objectives = chapter.learning_objectives || [];
    
    if (objectives.length > 0) {
        objectivesList.innerHTML = objectives.map(objective => `
            <div class="objective-item">
                <input type="text" value="${objective}" class="objective-input">
                <button type="button" onclick="removeObjective(this)" class="btn-remove">×</button>
            </div>
        `).join('');
    }
    
    // Populate content
    if (richEditor && chapter.content) {
        richEditor.root.innerHTML = chapter.content;
    }
    
    // Populate assessments
    document.getElementById('has-test').checked = chapter.has_test || false;
    document.getElementById('has-practical').checked = chapter.has_practical || false;
    
    // Show/hide sections first
    toggleTestSection();
    togglePracticalSection();
    
    // Then populate test questions AFTER sections are visible
    if (chapter.test_questions && chapter.test_questions.length > 0) {
        // Clear any auto-generated questions first
        const testQuestions = document.getElementById('test-questions');
        testQuestions.innerHTML = '';
        populateTestQuestions(chapter.test_questions);
    }
    
    // Populate practical exercises
    if (chapter.has_practical && chapter.practical_exercises && chapter.practical_exercises.length > 0) {
        // Clear any existing exercises
        const exercisesList = document.getElementById('practical-exercises-list');
        exercisesList.innerHTML = '';
        
        // Add each exercise
        chapter.practical_exercises.forEach((exercise, index) => {
            addPracticalExercise();
            const exerciseNumber = index + 1;
            
            // Populate the fields for this exercise
            const instructionsField = document.getElementById(`practical-instructions-${exerciseNumber}`);
            const starterCodeField = document.getElementById(`practical-starter-code-${exerciseNumber}`);
            const criteriaField = document.getElementById(`practical-evaluation-criteria-${exerciseNumber}`);
            
            if (instructionsField) instructionsField.value = exercise.instructions || '';
            if (starterCodeField) starterCodeField.value = exercise.starter_code || '';
            if (criteriaField) criteriaField.value = exercise.evaluation_criteria || '';
        });
    } else if (chapter.has_practical) {
        // Legacy format - convert single practical to array format
        const exercisesList = document.getElementById('practical-exercises-list');
        exercisesList.innerHTML = '';
        addPracticalExercise();
        
        // Use the old field names as fallback
        const instructionsField = document.getElementById('practical-instructions-1');
        const starterCodeField = document.getElementById('practical-starter-code-1');
        const criteriaField = document.getElementById('practical-evaluation-criteria-1');
        
        if (instructionsField) instructionsField.value = chapter.practical_instructions || '';
        if (starterCodeField) starterCodeField.value = chapter.practical_starter_code || '';
        if (criteriaField) criteriaField.value = chapter.practical_evaluation_criteria || '';
    }
}

// Add learning objective
function addObjective() {
    const objectivesList = document.getElementById('objectives-list');
    const newObjective = document.createElement('div');
    newObjective.className = 'objective-item';
    newObjective.innerHTML = `
        <input type="text" placeholder="What will students learn in this chapter?" class="objective-input">
        <button type="button" onclick="removeObjective(this)" class="btn-remove">×</button>
    `;
    objectivesList.appendChild(newObjective);
    newObjective.querySelector('.objective-input').focus();
}

// Remove learning objective
function removeObjective(button) {
    const objectivesList = document.getElementById('objectives-list');
    if (objectivesList.children.length > 1) {
        button.parentElement.remove();
    } else {
        // Clear the input instead of removing the last one
        button.parentElement.querySelector('.objective-input').value = '';
    }
}

// Toggle test section
function toggleTestSection() {
    const hasTest = document.getElementById('has-test').checked;
    const testSection = document.getElementById('test-section');
    testSection.style.display = hasTest ? 'block' : 'none';
    
    // Only add a default question if section is enabled and empty AND we're not loading existing data
    if (hasTest && !testSection.querySelector('.test-question') && !currentChapter) {
        addTestQuestion();
    }
}

// Toggle practical section
function togglePracticalSection() {
    const hasPractical = document.getElementById('has-practical').checked;
    const practicalSection = document.getElementById('practical-section');
    const addPracticalBtn = document.getElementById('add-practical-btn');
    
    practicalSection.style.display = hasPractical ? 'block' : 'none';
    addPracticalBtn.style.display = hasPractical ? 'inline-block' : 'none';
    
    // If enabling for the first time and no exercises exist, add the first one
    if (hasPractical) {
        const exercisesList = document.getElementById('practical-exercises-list');
        if (exercisesList.children.length === 0) {
            addPracticalExercise();
        }
    }
}

// Add practical exercise
function addPracticalExercise() {
    const exercisesList = document.getElementById('practical-exercises-list');
    const exerciseNumber = exercisesList.children.length + 1;
    
    const exerciseHTML = `
        <div class="practical-exercise-item" data-exercise-index="${exerciseNumber - 1}">
            <div class="practical-exercise-header">
                <h5 class="practical-exercise-title">Exercise ${exerciseNumber}</h5>
                <div class="practical-exercise-actions">
                    <button type="button" onclick="removePracticalExercise(this)" class="remove-practical-btn">Remove</button>
                </div>
            </div>
            <div class="practical-exercise-content">
                <div class="form-group-with-ai">
                    <div class="form-group">
                        <label for="practical-instructions-${exerciseNumber}">Instructions</label>
                        <textarea id="practical-instructions-${exerciseNumber}" 
                                  name="practical-instructions-${exerciseNumber}"
                                  placeholder="Describe what students should accomplish in this exercise"
                                  rows="4"></textarea>
                    </div>
                    <button type="button" class="ai-generate-btn" onclick="generateAIContent('practical_instructions', document.getElementById('practical-instructions-${exerciseNumber}'))">
                        Generate
                    </button>
                </div>
                <div class="form-group">
                    <label for="practical-starter-code-${exerciseNumber}">Starter Code (optional)</label>
                    <textarea id="practical-starter-code-${exerciseNumber}" 
                              name="practical-starter-code-${exerciseNumber}"
                              placeholder="# Write your solution here&#10;def solve():&#10;    pass"
                              rows="6"
                              class="code-textarea"></textarea>
                </div>
                <div class="form-group-with-ai">
                    <div class="form-group">
                        <label for="practical-evaluation-criteria-${exerciseNumber}">AI Evaluation Criteria</label>
                        <textarea id="practical-evaluation-criteria-${exerciseNumber}" 
                                  name="practical-evaluation-criteria-${exerciseNumber}"
                                  placeholder="Describe what the AI should look for when evaluating submissions"
                                  rows="3"></textarea>
                    </div>
                    <button type="button" class="ai-generate-btn" onclick="generateAIContent('practical_evaluation_criteria', document.getElementById('practical-evaluation-criteria-${exerciseNumber}'))">
                        Generate
                    </button>
                </div>
            </div>
        </div>
    `;
    
    exercisesList.insertAdjacentHTML('beforeend', exerciseHTML);
    updateExerciseNumbers();
}

// Remove practical exercise
function removePracticalExercise(button) {
    const exerciseItem = button.closest('.practical-exercise-item');
    const exercisesList = document.getElementById('practical-exercises-list');
    
    // Don't allow removing the last exercise if practical is enabled
    if (exercisesList.children.length <= 1) {
        showMessage('At least one practical exercise is required when practical exercises are enabled.', 'error');
        return;
    }
    
    exerciseItem.remove();
    updateExerciseNumbers();
}

// Update exercise numbers after adding/removing
function updateExerciseNumbers() {
    const exercisesList = document.getElementById('practical-exercises-list');
    const exercises = exercisesList.querySelectorAll('.practical-exercise-item');
    
    exercises.forEach((exercise, index) => {
        const exerciseNumber = index + 1;
        exercise.dataset.exerciseIndex = index;
        
        // Update title
        const title = exercise.querySelector('.practical-exercise-title');
        title.textContent = `Exercise ${exerciseNumber}`;
        
        // Update IDs and names
        const instructionsField = exercise.querySelector('textarea[id^="practical-instructions-"]');
        const starterCodeField = exercise.querySelector('textarea[id^="practical-starter-code-"]');
        const criteriaField = exercise.querySelector('textarea[id^="practical-evaluation-criteria-"]');
        
        if (instructionsField) {
            instructionsField.id = `practical-instructions-${exerciseNumber}`;
            instructionsField.name = `practical-instructions-${exerciseNumber}`;
            const instructionsLabel = exercise.querySelector('label[for^="practical-instructions-"]');
            if (instructionsLabel) {
                instructionsLabel.setAttribute('for', `practical-instructions-${exerciseNumber}`);
            }
        }
        
        if (starterCodeField) {
            starterCodeField.id = `practical-starter-code-${exerciseNumber}`;
            starterCodeField.name = `practical-starter-code-${exerciseNumber}`;
            const starterCodeLabel = exercise.querySelector('label[for^="practical-starter-code-"]');
            if (starterCodeLabel) {
                starterCodeLabel.setAttribute('for', `practical-starter-code-${exerciseNumber}`);
            }
        }
        
        if (criteriaField) {
            criteriaField.id = `practical-evaluation-criteria-${exerciseNumber}`;
            criteriaField.name = `practical-evaluation-criteria-${exerciseNumber}`;
            const criteriaLabel = exercise.querySelector('label[for^="practical-evaluation-criteria-"]');
            if (criteriaLabel) {
                criteriaLabel.setAttribute('for', `practical-evaluation-criteria-${exerciseNumber}`);
            }
        }
    });
}

// Add test question
function addTestQuestion() {
    const testQuestions = document.getElementById('test-questions');
    const questionNumber = testQuestions.children.length + 1;
    
    const questionHTML = `
        <div class="test-question" data-question-index="${questionNumber - 1}">
            <div class="question-header">
                <span class="question-number">Q${questionNumber}</span>
                <button type="button" onclick="removeTestQuestion(this)" class="btn-icon danger">🗑️</button>
            </div>
            <div class="form-group">
                <label>Question</label>
                <input type="text" class="question-text" placeholder="Enter your question here">
            </div>
            <div class="form-group">
                <label>Question Type</label>
                <select class="question-type" onchange="updateQuestionOptions(this)">
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="true-false">True/False</option>
                </select>
            </div>
            <div class="question-options">
                <label>Options</label>
                <div class="options-list">
                    <div class="option-item">
                        <input type="text" class="option-input" placeholder="Option 1">
                        <button type="button" class="correct-indicator" onclick="toggleCorrectAnswer(this)" title="Mark as correct">✓</button>
                        <button type="button" onclick="removeOption(this)" class="btn-remove">×</button>
                    </div>
                    <div class="option-item">
                        <input type="text" class="option-input" placeholder="Option 2">
                        <button type="button" class="correct-indicator" onclick="toggleCorrectAnswer(this)" title="Mark as correct">✓</button>
                        <button type="button" onclick="removeOption(this)" class="btn-remove">×</button>
                    </div>
                </div>
                <button type="button" onclick="addOption(this)" class="btn secondary small">+ Add Option</button>
            </div>
        </div>
    `;
    
    testQuestions.insertAdjacentHTML('beforeend', questionHTML);
}

// Remove test question
function removeTestQuestion(button) {
    button.closest('.test-question').remove();
    updateQuestionNumbers();
}

// Update question numbers
function updateQuestionNumbers() {
    const questions = document.querySelectorAll('.test-question');
    questions.forEach((question, index) => {
        question.dataset.questionIndex = index;
        question.querySelector('.question-number').textContent = `Q${index + 1}`;
    });
}

// Update question options based on type
function updateQuestionOptions(select) {
    const questionType = select.value;
    const optionsList = select.closest('.test-question').querySelector('.options-list');
    
    if (questionType === 'true-false') {
        optionsList.innerHTML = `
            <div class="option-item">
                <input type="text" class="option-input" value="True" readonly>
                <button type="button" class="correct-indicator" onclick="toggleCorrectAnswer(this)" title="Mark as correct">✓</button>
            </div>
            <div class="option-item">
                <input type="text" class="option-input" value="False" readonly>
                <button type="button" class="correct-indicator" onclick="toggleCorrectAnswer(this)" title="Mark as correct">✓</button>
            </div>
        `;
        // Hide add option button
        select.closest('.test-question').querySelector('[onclick="addOption(this)"]').style.display = 'none';
    } else {
        // Reset to multiple choice
        optionsList.innerHTML = `
            <div class="option-item">
                <input type="text" class="option-input" placeholder="Option 1">
                <button type="button" class="correct-indicator" onclick="toggleCorrectAnswer(this)" title="Mark as correct">✓</button>
                <button type="button" onclick="removeOption(this)" class="btn-remove">×</button>
            </div>
            <div class="option-item">
                <input type="text" class="option-input" placeholder="Option 2">
                <button type="button" class="correct-indicator" onclick="toggleCorrectAnswer(this)" title="Mark as correct">✓</button>
                <button type="button" onclick="removeOption(this)" class="btn-remove">×</button>
            </div>
        `;
        // Show add option button
        select.closest('.test-question').querySelector('[onclick="addOption(this)"]').style.display = 'inline-block';
    }
}

// Add option to question
function addOption(button) {
    const optionsList = button.previousElementSibling;
    const optionNumber = optionsList.children.length + 1;
    
    const optionHTML = `
        <div class="option-item">
            <input type="text" class="option-input" placeholder="Option ${optionNumber}">
            <button type="button" class="correct-indicator" onclick="toggleCorrectAnswer(this)" title="Mark as correct">✓</button>
            <button type="button" onclick="removeOption(this)" class="btn-remove">×</button>
        </div>
    `;
    
    optionsList.insertAdjacentHTML('beforeend', optionHTML);
}

// Remove option from question
function removeOption(button) {
    const optionsList = button.closest('.options-list');
    if (optionsList.children.length > 2) {
        button.closest('.option-item').remove();
    }
}

// Toggle correct answer
function toggleCorrectAnswer(button) {
    const question = button.closest('.test-question');
    const indicators = question.querySelectorAll('.correct-indicator');
    
    // Clear all correct indicators in this question
    indicators.forEach(indicator => {
        indicator.style.background = '#ccc';
        indicator.dataset.correct = 'false';
    });
    
    // Mark this one as correct
    button.style.background = 'var(--admin-success)';
    button.dataset.correct = 'true';
}

// Populate test questions
function populateTestQuestions(questions) {
    const testQuestions = document.getElementById('test-questions');
    testQuestions.innerHTML = '';
    
    questions.forEach((question, index) => {
        addTestQuestion();
        const questionElement = testQuestions.children[index];
        
        questionElement.querySelector('.question-text').value = question.question;
        questionElement.querySelector('.question-type').value = question.type || 'multiple-choice';
        
        const optionsList = questionElement.querySelector('.options-list');
        optionsList.innerHTML = '';
        
        question.options.forEach((option, optionIndex) => {
            const isCorrect = optionIndex === question.correct_answer;
            const optionHTML = `
                <div class="option-item">
                    <input type="text" class="option-input" value="${option}">
                    <button type="button" class="correct-indicator" onclick="toggleCorrectAnswer(this)" 
                            style="background: ${isCorrect ? 'var(--admin-success)' : '#ccc'}"
                            data-correct="${isCorrect}" title="Mark as correct">✓</button>
                    <button type="button" onclick="removeOption(this)" class="btn-remove">×</button>
                </div>
            `;
            optionsList.insertAdjacentHTML('beforeend', optionHTML);
        });
    });
}

// Save chapter
async function saveChapter() {
    const courseId = document.getElementById('course-id').value;
    if (!courseId) {
        showMessage('Please save the course first', 'error');
        return;
    }
    
    // Collect chapter data
    const chapterData = {
        title: document.getElementById('chapter-title').value,
        chapter_number: parseInt(document.getElementById('chapter-number').value),
        estimated_duration: parseInt(document.getElementById('chapter-duration').value),
        difficulty: document.getElementById('chapter-difficulty').value,
        learning_objectives: collectLearningObjectives(),
        content: richEditor ? richEditor.root.innerHTML : '',
        has_test: document.getElementById('has-test').checked,
        has_practical: document.getElementById('has-practical').checked,
        test_questions: collectTestQuestions(),
        practical_exercises: collectPracticalExercises()
    };
    
    // Validate required fields
    if (!chapterData.title) {
        showMessage('Chapter title is required', 'error');
        return;
    }
    
    await saveChapterData(chapterData);
}

// Save chapter data to server
async function saveChapterData(chapterData) {
    const courseId = document.getElementById('course-id').value;
    const isEditing = currentChapter && currentChapter.id;
    
    try {
        const url = isEditing 
            ? `/api/admin/courses/${courseId}/chapters/${currentChapter.id}`
            : `/api/admin/courses/${courseId}/chapters`;
        const method = isEditing ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(chapterData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Chapter saved successfully', 'success');
            closeChapterModal();
            await loadChapters();
        } else {
            showMessage(data.error || 'Failed to save chapter', 'error');
        }
    } catch (error) {
        showMessage('Error saving chapter: ' + error.message, 'error');
    }
}

// Collect learning objectives
function collectLearningObjectives() {
    const objectiveInputs = document.querySelectorAll('.objective-input');
    return Array.from(objectiveInputs)
        .map(input => input.value.trim())
        .filter(objective => objective);
}

// Collect test questions
function collectTestQuestions() {
    if (!document.getElementById('has-test').checked) {
        return [];
    }
    
    const questions = [];
    const questionElements = document.querySelectorAll('.test-question');
    
    questionElements.forEach(questionElement => {
        const questionText = questionElement.querySelector('.question-text').value.trim();
        if (!questionText) return;
        
        const questionType = questionElement.querySelector('.question-type').value;
        const options = [];
        let correctAnswer = 0;
        
        const optionElements = questionElement.querySelectorAll('.option-item');
        optionElements.forEach((optionElement, index) => {
            const optionText = optionElement.querySelector('.option-input').value.trim();
            if (optionText) {
                options.push(optionText);
                
                const correctIndicator = optionElement.querySelector('.correct-indicator');
                if (correctIndicator.dataset.correct === 'true') {
                    correctAnswer = index;
                }
            }
        });
        
        if (options.length >= 2) {
            questions.push({
                question: questionText,
                type: questionType,
                options: options,
                correct_answer: correctAnswer
            });
        }
    });
    
    return questions;
}

// Collect practical exercises
function collectPracticalExercises() {
    if (!document.getElementById('has-practical').checked) {
        return [];
    }
    
    const exercises = [];
    const exerciseElements = document.querySelectorAll('.practical-exercise-item');
    
    exerciseElements.forEach((exerciseElement, index) => {
        const exerciseNumber = index + 1;
        
        const instructionsField = exerciseElement.querySelector(`textarea[id^="practical-instructions-"]`);
        const starterCodeField = exerciseElement.querySelector(`textarea[id^="practical-starter-code-"]`);
        const criteriaField = exerciseElement.querySelector(`textarea[id^="practical-evaluation-criteria-"]`);
        
        const instructions = instructionsField ? instructionsField.value.trim() : '';
        const starterCode = starterCodeField ? starterCodeField.value.trim() : '';
        const evaluationCriteria = criteriaField ? criteriaField.value.trim() : '';
        
        // Only include exercises that have at least instructions
        if (instructions) {
            exercises.push({
                instructions: instructions,
                starter_code: starterCode,
                evaluation_criteria: evaluationCriteria
            });
        }
    });
    
    return exercises;
}

// Update chapter order after drag and drop
async function updateChapterOrder() {
    const courseId = document.getElementById('course-id').value;
    if (!courseId) return;
    
    const chapterItems = document.querySelectorAll('.chapter-item');
    const chapterOrder = Array.from(chapterItems).map(item => 
        parseInt(item.dataset.chapterId)
    );
    
    try {
        const response = await fetch(`/api/admin/courses/${courseId}/chapters/reorder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chapter_order: chapterOrder
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Chapter order updated', 'success');
            await loadChapters();
        } else {
            showMessage(data.error || 'Failed to update chapter order', 'error');
        }
    } catch (error) {
        showMessage('Error updating chapter order: ' + error.message, 'error');
    }
}

// Panel toggle functionality
function togglePanel(button) {
    const panel = button.closest('.editor-panel');
    const content = panel.querySelector('.panel-content');
    
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        button.textContent = '−';
    } else {
        content.classList.add('collapsed');
        button.textContent = '+';
    }
}

// Rich editor toolbar functions
function insertYouTube() {
    const url = prompt('Enter YouTube video URL:');
    if (url && richEditor) {
        const videoId = extractYouTubeId(url);
        if (videoId) {
            const embedHTML = `<div class="video-embed"><iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
            richEditor.clipboard.dangerouslyPasteHTML(embedHTML);
        }
    }
}

function insertCodeBlock() {
    if (richEditor) {
        const selection = richEditor.getSelection();
        richEditor.insertText(selection.index, '\n');
        richEditor.formatLine(selection.index + 1, 1, 'code-block', true);
        richEditor.setSelection(selection.index + 1, 0);
    }
}

function insertCallout() {
    if (richEditor) {
        const selection = richEditor.getSelection();
        const calloutHTML = '<div class="callout"><strong>💡 Tip:</strong> Add your callout text here</div>';
        richEditor.clipboard.dangerouslyPasteHTML(calloutHTML);
    }
}

// Extract YouTube video ID from URL
function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// AI Content Generation
async function generateAIContent(contentType, inputElement) {
    // Handle special case for objectives where inputElement might be null
    let generateBtn;
    let originalText;
    
    if (contentType === 'chapter_objectives') {
        generateBtn = document.querySelector('.ai-generate-objectives');
        originalText = generateBtn ? generateBtn.textContent : 'Generate';
    } else {
        // Look for the button in the parent form-group-with-ai container
        const formGroupWithAI = inputElement.closest('.form-group-with-ai');
        if (formGroupWithAI) {
            generateBtn = formGroupWithAI.querySelector('.ai-generate-btn');
        } else {
            // Fallback: look in parent element
            generateBtn = inputElement.parentElement.querySelector('.ai-generate-btn');
        }
        originalText = generateBtn ? generateBtn.textContent : 'Generate';
    }
    
    if (!generateBtn) {
        console.error('Generate button not found for content type:', contentType);
        console.error('InputElement:', inputElement);
        console.error('Parent elements:', inputElement.parentElement, inputElement.closest('.form-group-with-ai'));
        return;
    }
    
    // Show loading state
    generateBtn.disabled = true;
    generateBtn.textContent = '🤖 Generating...';
    generateBtn.style.opacity = '0.6';
    
    try {
        // Collect context from form
        const context = collectFormContext(contentType);
        const currentText = inputElement ? inputElement.value : '';
        
        const response = await fetch('/api/admin/generate-content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: contentType,
                context: context,
                current_text: currentText
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Handle different content types
            if (contentType === 'chapter_objectives') {
                // Parse JSON array for objectives
                try {
                    const objectives = JSON.parse(data.content);
                    populateObjectives(objectives);
                } catch (e) {
                    // Fallback: if parsing fails, treat as regular text and add as single objective
                    populateObjectives([data.content]);
                }
            } else if (inputElement) {
                inputElement.value = data.content;
            }
            
            showMessage('AI content generated successfully!', 'success');
        } else {
            showMessage('Failed to generate content: ' + (data.error || 'Unknown error'), 'error');
        }
        
    } catch (error) {
        showMessage('Error generating content: ' + error.message, 'error');
    } finally {
        // Restore button state
        generateBtn.disabled = false;
        generateBtn.textContent = originalText;
        generateBtn.style.opacity = '1';
    }
}

function collectFormContext(contentType) {
    const context = {};
    
    // Course context
    const courseTitle = document.getElementById('course-title');
    const courseSubtitle = document.getElementById('course-subtitle');
    const courseDifficulty = document.getElementById('course-difficulty');
    const courseDuration = document.getElementById('course-duration');
    
    if (courseTitle) context.title = courseTitle.value;
    if (courseSubtitle) context.subtitle = courseSubtitle.value;
    if (courseDifficulty) context.difficulty = courseDifficulty.value;
    if (courseDuration) context.estimated_duration = parseInt(courseDuration.value) || 8;
    
    // Chapter context (if in chapter modal)
    const chapterTitle = document.getElementById('chapter-title');
    const chapterNumber = document.getElementById('chapter-number');
    const practicalInstructions = document.getElementById('practical-instructions');
    
    if (chapterTitle) {
        context.chapter_title = chapterTitle.value;
        context.course_title = context.title; // Use course title as well
    }
    if (chapterNumber) context.chapter_number = parseInt(chapterNumber.value) || 1;
    if (practicalInstructions) context.practical_instructions = practicalInstructions.value;
    
    // Learning objectives context
    if (contentType === 'practical_instructions' || contentType === 'practical_evaluation_criteria') {
        const objectives = collectLearningObjectives();
        context.learning_objectives = objectives;
    }
    
    return context;
}

function populateObjectives(objectives) {
    const objectivesList = document.getElementById('objectives-list');
    objectivesList.innerHTML = '';
    
    objectives.forEach((objective, index) => {
        const objectiveItem = document.createElement('div');
        objectiveItem.className = 'objective-item';
        objectiveItem.innerHTML = `
            <input type="text" value="${objective}" class="objective-input">
            <button type="button" onclick="removeObjective(this)" class="btn-remove">×</button>
        `;
        objectivesList.appendChild(objectiveItem);
    });
    
    // Add one empty objective if none exist
    if (objectives.length === 0) {
        addObjective();
    }
}

// Show message notification
function showMessage(message, type = 'success') {
    const messageContainer = document.getElementById('message-container');
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    
    messageContainer.appendChild(messageElement);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        messageElement.remove();
    }, 5000);
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('chapter-modal');
    if (event.target === modal) {
        closeChapterModal();
    }
});

// Handle escape key to close modal
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('chapter-modal');
        if (modal.style.display === 'flex') {
            closeChapterModal();
        }
    }
});

// Generate chapter content using AI
async function generateChapterContent() {
    if (!richEditor) {
        showMessage('Rich editor not initialized', 'error');
        return;
    }
    
    // Find the generate button and show loading state
    const generateBtn = document.querySelector('button[onclick="generateChapterContent()"]');
    if (!generateBtn) {
        showMessage('Generate button not found', 'error');
        return;
    }
    
    const originalText = generateBtn.textContent;
    generateBtn.disabled = true;
    generateBtn.textContent = '🤖 Generating...';
    generateBtn.style.opacity = '0.6';
    
    try {
        // Collect context from form
        const context = collectFormContext('chapter_content');
        const currentContent = richEditor.root.innerHTML;
        
        const response = await fetch('/api/admin/generate-content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'chapter_content',
                context: context,
                current_text: currentContent
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Set the generated content in the rich editor
            richEditor.root.innerHTML = data.content;
            showMessage('Chapter content generated successfully!', 'success');
        } else {
            showMessage('Failed to generate content: ' + (data.error || 'Unknown error'), 'error');
        }
        
    } catch (error) {
        showMessage('Error generating content: ' + error.message, 'error');
    } finally {
        // Restore button state
        generateBtn.disabled = false;
        generateBtn.textContent = originalText;
        generateBtn.style.opacity = '1';
    }
}