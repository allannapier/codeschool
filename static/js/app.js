// Language Learning App
let sessionStartTime = Date.now();
let messageCount = 0;
let conversationHistory = [];

// DOM elements
const languageSelect = document.getElementById('language');
const skillLevelSelect = document.getElementById('skill-level');
const lessonModeSelect = document.getElementById('lesson-mode');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const helpBtn = document.getElementById('help-btn');
const addGoalBtn = document.getElementById('add-goal-btn');
const goalsList = document.getElementById('goals-list');
const sessionTimeEl = document.getElementById('session-time');
const messageCountEl = document.getElementById('message-count');
const grammarFeedback = document.getElementById('grammar-feedback');
const vocabularyFeedback = document.getElementById('vocabulary-feedback');
const loadingDiv = document.getElementById('loading');

// Learning goals data
let learningGoals = [
    { id: 1, text: "Master basic greetings and introductions", progress: 60 },
    { id: 2, text: "Learn present tense verbs", progress: 30 },
    { id: 3, text: "Build vocabulary for daily activities", progress: 45 }
];

// Language-specific greetings
const languageGreetings = {
    spanish: "¡Hola! I'm your Spanish tutor. Let's start with a simple conversation. How are you today?",
    french: "Bonjour! I'm your French tutor. Let's begin with a friendly conversation. How are you today?",
    german: "Hallo! I'm your German tutor. Let's start with a simple conversation. How are you today?",
    italian: "Ciao! I'm your Italian tutor. Let's begin with a pleasant conversation. How are you today?",
    portuguese: "Olá! I'm your Portuguese tutor. Let's start with a simple conversation. How are you today?",
    mandarin: "你好! I'm your Mandarin tutor. Let's begin with a simple conversation. How are you today?",
    japanese: "こんにちは! I'm your Japanese tutor. Let's start with a simple conversation. How are you today?"
};

// Event listeners
sendBtn.addEventListener('click', sendMessage);
helpBtn.addEventListener('click', requestHelp);
addGoalBtn.addEventListener('click', addLearningGoal);
languageSelect.addEventListener('change', updateLanguage);
userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    updateLanguage();
    renderGoals();
    startTimer();
});

function updateLanguage() {
    const selectedLanguage = languageSelect.value;
    const greeting = languageGreetings[selectedLanguage];
    
    // Clear chat and add new greeting
    chatMessages.innerHTML = '';
    addMessage('tutor', greeting);
    
    // Update placeholder text
    const languageNames = {
        spanish: 'Spanish',
        french: 'French', 
        german: 'German',
        italian: 'Italian',
        portuguese: 'Portuguese',
        mandarin: 'Mandarin',
        japanese: 'Japanese'
    };
    
    userInput.placeholder = `Type your response in ${languageNames[selectedLanguage]}...`;
    
    // Reset conversation history
    conversationHistory = [];
    messageCount = 0;
    updateMessageCount();
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessage('user', message);
    userInput.value = '';
    
    // Update counters
    messageCount++;
    updateMessageCount();
    
    // Add to conversation history
    conversationHistory.push({ role: 'user', content: message });

    // Show loading
    showLoading(true);
    disableInput(true);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                language: languageSelect.value,
                skill_level: skillLevelSelect.value,
                lesson_mode: lessonModeSelect.value,
                conversation_history: conversationHistory
            })
        });

        const data = await response.json();

        if (data.success) {
            // Add tutor response
            addMessage('tutor', data.response);
            conversationHistory.push({ role: 'assistant', content: data.response });
            
            // Update feedback panels
            if (data.feedback) {
                updateFeedback(data.feedback);
            }
            
            // Update goals progress if provided
            if (data.goals_progress) {
                updateGoalsProgress(data.goals_progress);
            }
        } else {
            showError(data.error || 'Failed to send message');
        }
    } catch (error) {
        showError('Network error. Please try again.');
        console.error('Chat error:', error);
    } finally {
        showLoading(false);
        disableInput(false);
        userInput.focus();
    }
}

async function requestHelp() {
    const currentLanguage = languageSelect.value;
    const skillLevel = skillLevelSelect.value;
    
    showLoading(true);
    disableInput(true);

    try {
        const response = await fetch('/api/help', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                language: currentLanguage,
                skill_level: skillLevel,
                conversation_history: conversationHistory
            })
        });

        const data = await response.json();

        if (data.success) {
            addMessage('tutor', data.help_message, 'help');
        } else {
            showError(data.error || 'Failed to get help');
        }
    } catch (error) {
        showError('Network error. Please try again.');
        console.error('Help error:', error);
    } finally {
        showLoading(false);
        disableInput(false);
    }
}

function addMessage(sender, content, type = 'normal') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    if (type === 'help') {
        messageContent.style.background = '#ffa726';
        messageContent.style.color = 'white';
    }
    
    const messageText = document.createElement('p');
    messageText.textContent = content;
    
    messageContent.appendChild(messageText);
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateFeedback(feedback) {
    if (feedback.grammar) {
        grammarFeedback.innerHTML = `<div class="feedback-text">${feedback.grammar}</div>`;
    }
    
    if (feedback.vocabulary) {
        vocabularyFeedback.innerHTML = `<div class="feedback-text">${feedback.vocabulary}</div>`;
    }
}

function updateGoalsProgress(progressUpdates) {
    progressUpdates.forEach(update => {
        const goal = learningGoals.find(g => g.id === update.id);
        if (goal) {
            goal.progress = Math.min(100, goal.progress + update.increment);
        }
    });
    renderGoals();
}

function renderGoals() {
    goalsList.innerHTML = '';
    
    learningGoals.forEach(goal => {
        const goalDiv = document.createElement('div');
        goalDiv.className = 'goal-item';
        
        goalDiv.innerHTML = `
            <span class="goal-text">${goal.text}</span>
            <div class="goal-progress">
                <div class="progress-bar" style="width: ${goal.progress}%"></div>
            </div>
        `;
        
        goalsList.appendChild(goalDiv);
    });
}

function addLearningGoal() {
    const goalText = prompt('Enter a new learning goal:');
    if (goalText && goalText.trim()) {
        const newGoal = {
            id: Date.now(),
            text: goalText.trim(),
            progress: 0
        };
        learningGoals.push(newGoal);
        renderGoals();
    }
}

function startTimer() {
    setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 60000);
        sessionTimeEl.textContent = `${elapsed} min`;
    }, 1000);
}

function updateMessageCount() {
    messageCountEl.textContent = messageCount.toString();
}

function showLoading(show) {
    if (show) {
        loadingDiv.classList.add('active');
    } else {
        loadingDiv.classList.remove('active');
    }
}

function disableInput(disable) {
    sendBtn.disabled = disable;
    helpBtn.disabled = disable;
    userInput.disabled = disable;
}

function showError(message) {
    addMessage('tutor', `Error: ${message}`, 'error');
}

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
});