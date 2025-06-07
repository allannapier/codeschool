// Initialize Monaco Editor
let editor;

require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.45.0/min/vs' } });
require(['vs/editor/editor.main'], function () {
    editor = monaco.editor.create(document.getElementById('editor'), {
        value: `# Welcome to Codebotiks!
# Write your Python code here and get AI-powered feedback

def greet(name):
    """A simple greeting function"""
    return f"Hello, {name}!"

# Try calling the function
result = greet("World")
print(result)`,
        language: 'python',
        theme: 'vs-light',
        automaticLayout: true,
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        lineNumbers: 'on',
        roundedSelection: false,
        scrollbar: {
            vertical: 'auto',
            horizontal: 'auto'
        }
    });

    // Update editor language when dropdown changes
    document.getElementById('language').addEventListener('change', function() {
        const language = this.value;
        let monacoLang = language;
        
        // Map our language values to Monaco language IDs
        const languageMap = {
            'python': 'python',
            'javascript': 'javascript',
            'typescript': 'typescript', 
            'java': 'java',
            'cpp': 'cpp',
            'go': 'go'
        };
        
        monacoLang = languageMap[language] || 'python';
        monaco.editor.setModelLanguage(editor.getModel(), monacoLang);
        
        // Set sample code based on language
        setSampleCode(language);
    });
});

function setSampleCode(language) {
    const sampleCodes = {
        python: `# Welcome to Codebotiks!
# Write your Python code here and get AI-powered feedback

def greet(name):
    """A simple greeting function"""
    return f"Hello, {name}!"

# Try calling the function
result = greet("World")
print(result)`,
        
        javascript: `// Welcome to Codebotiks!
// Write your JavaScript code here and get AI-powered feedback

function greet(name) {
    // A simple greeting function
    return \`Hello, \${name}!\`;
}

// Try calling the function
const result = greet("World");
console.log(result);`,

        typescript: `// Welcome to Codebotiks!
// Write your TypeScript code here and get AI-powered feedback

function greet(name: string): string {
    // A simple greeting function with type annotations
    return \`Hello, \${name}!\`;
}

// Try calling the function
const result: string = greet("World");
console.log(result);`,

        java: `// Welcome to Codebotiks!
// Write your Java code here and get AI-powered feedback

public class HelloWorld {
    public static void main(String[] args) {
        String result = greet("World");
        System.out.println(result);
    }
    
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
}`,

        cpp: `// Welcome to Codebotiks!
// Write your C++ code here and get AI-powered feedback

#include <iostream>
#include <string>

std::string greet(const std::string& name) {
    return "Hello, " + name + "!";
}

int main() {
    std::string result = greet("World");
    std::cout << result << std::endl;
    return 0;
}`,

        go: `// Welcome to Codebotiks!
// Write your Go code here and get AI-powered feedback

package main

import "fmt"

func greet(name string) string {
    return fmt.Sprintf("Hello, %s!", name)
}

func main() {
    result := greet("World")
    fmt.Println(result)
}`
    };
    
    editor.setValue(sampleCodes[language] || sampleCodes.python);
}

// DOM elements - will be initialized on DOM load
let analyzeBtn, explainBtn, clearBtn, submitChallengeBtn;
let languageSelect, skillLevelSelect, challengesSelect;
let resultsDiv, loadingDiv;

// Challenge data
let challengesData = [];
let currentChallenge = null;

// Event listeners will be added in DOMContentLoaded

async function analyzeCode() {
    const code = editor.getValue().trim();
    
    if (!code) {
        showError('Please enter some code to analyze.');
        return;
    }

    const language = languageSelect.value;
    const skillLevel = skillLevelSelect.value;

    showLoading(true);
    disableButtons(true);

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: code,
                language: language,
                skill_level: skillLevel
            })
        });

        const data = await response.json();

        if (data.success) {
            showResults('📊 Code Analysis', data.analysis);
        } else {
            showError(data.error || 'Failed to analyze code');
        }
    } catch (error) {
        showError('Network error. Please try again.');
        console.error('Analysis error:', error);
    } finally {
        showLoading(false);
        disableButtons(false);
    }
}

async function explainCode() {
    const code = editor.getValue().trim();
    
    if (!code) {
        showError('Please enter some code to explain.');
        return;
    }

    const language = languageSelect.value;
    const skillLevel = skillLevelSelect.value;

    showLoading(true);
    disableButtons(true);

    try {
        const response = await fetch('/api/explain', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: code,
                language: language,
                skill_level: skillLevel
            })
        });

        const data = await response.json();

        if (data.success) {
            showResults('📚 Code Explanation', data.explanation);
        } else {
            showError(data.error || 'Failed to explain code');
        }
    } catch (error) {
        showError('Network error. Please try again.');
        console.error('Explanation error:', error);
    } finally {
        showLoading(false);
        disableButtons(false);
    }
}

function clearEditor() {
    const language = languageSelect.value;
    setSampleCode(language);
    resultsDiv.innerHTML = '<p class="placeholder">Enter your code and click "Analyze Code" or "Explain Code" to get AI-powered feedback.</p>';
}

function showResults(title, content) {
    // Format the content better
    const formattedContent = formatAIResponse(content);
    
    resultsDiv.innerHTML = `
        <h4>${title}</h4>
        <div class="content">${formattedContent}</div>
    `;
    resultsDiv.scrollTop = 0;
}

function formatAIResponse(content) {
    // Simple formatting to make AI responses look better
    return content
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code>$1</code>');
}

function showError(message) {
    resultsDiv.innerHTML = `
        <div class="error">
            <strong>❌ Error:</strong> ${message}
        </div>
    `;
}

function showLoading(show) {
    if (show) {
        loadingDiv.classList.add('active');
    } else {
        loadingDiv.classList.remove('active');
    }
}

function disableButtons(disable) {
    analyzeBtn.disabled = disable;
    explainBtn.disabled = disable;
    clearBtn.disabled = disable;
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Enter') {
            e.preventDefault();
            analyzeCode();
        } else if (e.key === 'e') {
            e.preventDefault();
            explainCode();
        }
    }
});

// Load challenges from API
async function loadChallenges() {
    try {
        console.log('Loading challenges...');
        const response = await fetch('/api/challenges');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Challenges data:', data);
        
        challengesData = data.challenges || [];
        console.log('Parsed challenges:', challengesData.length, 'challenges found');
        
        populateChallengesDropdown();
    } catch (error) {
        console.error('Failed to load challenges:', error);
        // Show error in dropdown
        challengesSelect.innerHTML = '<option value="">Error loading challenges</option>';
    }
}

function populateChallengesDropdown() {
    console.log('Populating challenges dropdown...');
    console.log('challengesData:', challengesData);
    
    // Clear existing options except the first one
    challengesSelect.innerHTML = '<option value="">Select a Challenge</option>';
    
    if (!challengesData || challengesData.length === 0) {
        challengesSelect.innerHTML = '<option value="">No challenges available</option>';
        return;
    }
    
    // Group challenges by level
    const groupedChallenges = {
        beginner: [],
        intermediate: [],
        advanced: []
    };
    
    challengesData.forEach((challenge, index) => {
        console.log(`Processing challenge ${index}:`, challenge.title, challenge.level);
        if (groupedChallenges[challenge.level]) {
            groupedChallenges[challenge.level].push({ ...challenge, index });
        }
    });
    
    console.log('Grouped challenges:', groupedChallenges);
    
    // Add optgroups for each level
    Object.entries(groupedChallenges).forEach(([level, challenges]) => {
        console.log(`Adding ${level} group with ${challenges.length} challenges`);
        if (challenges.length > 0) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = level.charAt(0).toUpperCase() + level.slice(1);
            
            challenges.forEach(challenge => {
                const option = document.createElement('option');
                option.value = challenge.index;
                option.textContent = challenge.title;
                optgroup.appendChild(option);
            });
            
            challengesSelect.appendChild(optgroup);
        }
    });
    
    console.log('Dropdown populated with', challengesSelect.children.length - 1, 'challenge groups');
}

function selectChallenge() {
    const selectedIndex = challengesSelect.value;
    
    if (selectedIndex === '') {
        currentChallenge = null;
        submitChallengeBtn.style.display = 'none';
        resultsDiv.innerHTML = '<p class="placeholder">Enter your code and click "Analyze Code" or "Explain Code" to get AI-powered feedback.</p>';
        return;
    }
    
    currentChallenge = challengesData[selectedIndex];
    submitChallengeBtn.style.display = 'inline-block';
    
    // Display challenge details in results section
    showChallengeDetails(currentChallenge);
}

function showChallengeDetails(challenge) {
    const levelEmoji = {
        beginner: '🟢',
        intermediate: '🟡',
        advanced: '🔴'
    };
    
    resultsDiv.innerHTML = `
        <div class="challenge-details">
            <h4>${levelEmoji[challenge.level]} ${challenge.title}</h4>
            <div class="challenge-level">Level: ${challenge.level.charAt(0).toUpperCase() + challenge.level.slice(1)}</div>
            <div class="challenge-description">
                <h5>Challenge Description:</h5>
                <p>${challenge.description}</p>
            </div>
            <div class="challenge-hint">
                <p><strong>💡 Tip:</strong> Write your solution in the code editor above and click "Submit Challenge" when ready!</p>
            </div>
        </div>
    `;
}

async function submitChallenge() {
    const code = editor.getValue().trim();
    
    if (!code) {
        showError('Please write some code for the challenge.');
        return;
    }
    
    if (!currentChallenge) {
        showError('Please select a challenge first.');
        return;
    }

    const language = languageSelect.value;
    const skillLevel = skillLevelSelect.value;

    showLoading(true);
    disableButtons(true);

    try {
        const response = await fetch('/api/submit-challenge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: code,
                challenge_title: currentChallenge.title,
                challenge_description: currentChallenge.description,
                language: language,
                skill_level: skillLevel
            })
        });

        const data = await response.json();

        if (data.success) {
            showResults('🎯 Challenge Evaluation', data.evaluation);
        } else {
            showError(data.error || 'Failed to evaluate challenge');
        }
    } catch (error) {
        showError('Network error. Please try again.');
        console.error('Challenge submission error:', error);
    } finally {
        showLoading(false);
        disableButtons(false);
    }
}

function disableButtons(disable) {
    analyzeBtn.disabled = disable;
    explainBtn.disabled = disable;
    clearBtn.disabled = disable;
    submitChallengeBtn.disabled = disable;
}

// Initialize with default language and load challenges
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    
    // Initialize DOM elements
    analyzeBtn = document.getElementById('analyze-btn');
    explainBtn = document.getElementById('explain-btn');
    clearBtn = document.getElementById('clear-btn');
    submitChallengeBtn = document.getElementById('submit-challenge-btn');
    languageSelect = document.getElementById('language');
    skillLevelSelect = document.getElementById('skill-level');
    challengesSelect = document.getElementById('challenges');
    resultsDiv = document.getElementById('results');
    loadingDiv = document.getElementById('loading');
    
    console.log('challengesSelect element:', challengesSelect);
    
    // Add event listeners
    analyzeBtn.addEventListener('click', analyzeCode);
    explainBtn.addEventListener('click', explainCode);
    clearBtn.addEventListener('click', clearEditor);
    submitChallengeBtn.addEventListener('click', submitChallenge);
    challengesSelect.addEventListener('change', selectChallenge);
    
    // Set default sample code
    setSampleCode('python');
    // Load challenges
    loadChallenges();
});