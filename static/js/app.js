// Initialize Monaco Editor
let editor;
let editorSettings = {
    fontSize: 14,
    theme: 'vs-light',
    minimapEnabled: false,
    wordWrap: 'on'
};

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
        theme: editorSettings.theme,
        automaticLayout: true,
        fontSize: editorSettings.fontSize,
        minimap: { 
            enabled: editorSettings.minimapEnabled,
            side: 'right',
            showSlider: 'mouseover',
            renderCharacters: true,
            maxColumn: 120
        },
        scrollBeyondLastLine: false,
        wordWrap: editorSettings.wordWrap,
        lineNumbers: 'on',
        lineNumbersMinChars: 3,
        renderLineHighlight: 'all',
        renderWhitespace: 'selection',
        roundedSelection: false,
        cursorBlinking: 'blink',
        cursorStyle: 'line',
        folding: true,
        foldingStrategy: 'auto',
        foldingHighlight: true,
        showFoldingControls: 'mouseover',
        matchBrackets: 'always',
        bracketPairColorization: {
            enabled: true
        },
        autoIndent: 'full',
        formatOnPaste: true,
        formatOnType: true,
        suggest: {
            showMethods: true,
            showFunctions: true,
            showConstructors: true,
            showFields: true,
            showVariables: true,
            showClasses: true,
            showStructs: true,
            showInterfaces: true,
            showModules: true,
            showProperties: true,
            showEvents: true,
            showOperators: true,
            showUnits: true,
            showValues: true,
            showConstants: true,
            showEnums: true,
            showEnumMembers: true,
            showKeywords: true,
            showWords: true,
            showColors: true,
            showFiles: true,
            showReferences: true,
            showFolders: true,
            showTypeParameters: true,
            showSnippets: true
        },
        scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            useShadows: false,
            verticalHasArrows: true,
            horizontalHasArrows: true,
            verticalScrollbarSize: 14,
            horizontalScrollbarSize: 14
        }
    });

    // Set initial sample code
    setSampleCode('python');
    
    // Initialize editor toolbar
    initializeEditorToolbar();
});

// Piston API configuration and language mapping
const PISTON_API_URL = 'https://emkc.org/api/v2/piston';

const LANGUAGE_MAP = {
    'python': 'python',
    'javascript': 'javascript',
    'typescript': 'typescript',
    'java': 'java',
    'cpp': 'cpp',
    'go': 'go'
};

const LANGUAGE_VERSIONS = {
    'python': '3.10.0',
    'javascript': '18.15.0',
    'typescript': '5.0.3',
    'java': '15.0.2',
    'cpp': '10.2.0',
    'go': '1.16.2'
};

// Editor toolbar functionality
function initializeEditorToolbar() {
    const fontDecreaseBtn = document.getElementById('font-decrease');
    const fontIncreaseBtn = document.getElementById('font-increase');
    const fontSizeDisplay = document.getElementById('font-size-display');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const minimapToggleBtn = document.getElementById('minimap-toggle');
    const wrapToggleBtn = document.getElementById('wrap-toggle');
    const runCodeBtn = document.getElementById('run-code');
    const foldAllBtn = document.getElementById('fold-all');
    const unfoldAllBtn = document.getElementById('unfold-all');
    
    // Font size controls
    fontDecreaseBtn.addEventListener('click', () => {
        if (editorSettings.fontSize > 8) {
            editorSettings.fontSize -= 1;
            updateEditorSettings();
            updateFontSizeDisplay();
        }
    });
    
    fontIncreaseBtn.addEventListener('click', () => {
        if (editorSettings.fontSize < 32) {
            editorSettings.fontSize += 1;
            updateEditorSettings();
            updateFontSizeDisplay();
        }
    });
    
    // Theme toggle
    themeToggleBtn.addEventListener('click', () => {
        editorSettings.theme = editorSettings.theme === 'vs-light' ? 'vs-dark' : 'vs-light';
        updateEditorSettings();
        updateThemeButton();
    });
    
    // Minimap toggle
    minimapToggleBtn.addEventListener('click', () => {
        editorSettings.minimapEnabled = !editorSettings.minimapEnabled;
        updateEditorSettings();
        updateMinimapButton();
    });
    
    // Word wrap toggle
    wrapToggleBtn.addEventListener('click', () => {
        editorSettings.wordWrap = editorSettings.wordWrap === 'on' ? 'off' : 'on';
        updateEditorSettings();
        updateWrapButton();
    });
    
    // Run code
    runCodeBtn.addEventListener('click', () => {
        executeCode();
    });
    
    
    
    // Fold all
    foldAllBtn.addEventListener('click', () => {
        if (editor) {
            editor.trigger('editor', 'editor.foldAll');
        }
    });
    
    // Unfold all
    unfoldAllBtn.addEventListener('click', () => {
        if (editor) {
            editor.trigger('editor', 'editor.unfoldAll');
        }
    });
    
    // Initialize button states
    updateFontSizeDisplay();
    updateThemeButton();
    updateMinimapButton();
    updateWrapButton();
}

function updateEditorSettings() {
    if (editor) {
        editor.updateOptions({
            fontSize: editorSettings.fontSize,
            theme: editorSettings.theme,
            minimap: { 
                enabled: editorSettings.minimapEnabled,
                side: 'right',
                showSlider: 'mouseover',
                renderCharacters: true,
                maxColumn: 120
            },
            wordWrap: editorSettings.wordWrap
        });
    }
}

function updateFontSizeDisplay() {
    const fontSizeDisplay = document.getElementById('font-size-display');
    if (fontSizeDisplay) {
        fontSizeDisplay.textContent = `${editorSettings.fontSize}px`;
    }
}

function updateThemeButton() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        const isDark = editorSettings.theme === 'vs-dark';
        themeToggleBtn.textContent = isDark ? '☀️ Light' : '🌙 Dark';
        themeToggleBtn.classList.toggle('active', isDark);
    }
}

function updateMinimapButton() {
    const minimapToggleBtn = document.getElementById('minimap-toggle');
    if (minimapToggleBtn) {
        minimapToggleBtn.classList.toggle('active', editorSettings.minimapEnabled);
        minimapToggleBtn.textContent = editorSettings.minimapEnabled ? '🗺️ Hide Map' : '🗺️ Show Map';
    }
}

function updateWrapButton() {
    const wrapToggleBtn = document.getElementById('wrap-toggle');
    if (wrapToggleBtn) {
        const isWrapped = editorSettings.wordWrap === 'on';
        wrapToggleBtn.classList.toggle('active', isWrapped);
        wrapToggleBtn.textContent = isWrapped ? '↩️ No Wrap' : '↩️ Wrap';
    }
}

// Code execution functions
async function executeCode() {
    if (!editor) {
        showError('Editor not initialized');
        return;
    }

    const code = editor.getValue().trim();
    if (!code) {
        showError('Please enter some code to execute');
        return;
    }

    const language = languageSelect.value;
    const pistonLanguage = LANGUAGE_MAP[language];
    const languageVersion = LANGUAGE_VERSIONS[language];

    if (!pistonLanguage) {
        showError(`Language "${language}" is not supported for execution`);
        return;
    }

    // Update run button state
    const runBtn = document.getElementById('run-code');
    runBtn.disabled = true;
    runBtn.textContent = '⏳ Running...';

    try {
        // Switch to code output tab
        switchTab('code-output');
        clearExecutionOutput();
        
        const startTime = Date.now();
        const result = await callPistonAPI(pistonLanguage, languageVersion, code);
        const executionTime = Date.now() - startTime;
        
        displayExecutionResult(result, executionTime);
        
    } catch (error) {
        console.error('Code execution error:', error);
        displayExecutionError(error.message || 'Failed to execute code');
    } finally {
        // Restore run button
        runBtn.disabled = false;
        runBtn.textContent = '▶️ Run Code';
    }
}

async function callPistonAPI(language, version, code) {
    const payload = {
        language: language,
        version: version,
        files: [
            {
                name: getFileName(language),
                content: code
            }
        ],
        stdin: "",
        args: [],
        compile_timeout: 10000,
        run_timeout: 3000,
        compile_memory_limit: -1,
        run_memory_limit: -1
    };

    const response = await fetch(`${PISTON_API_URL}/execute`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

function getFileName(language) {
    const extensions = {
        'python': 'main.py',
        'javascript': 'main.js',
        'typescript': 'main.ts',
        'java': 'Main.java',
        'cpp': 'main.cpp',
        'go': 'main.go'
    };
    return extensions[language] || 'main.txt';
}


function clearExecutionOutput() {
    const stdoutContent = document.getElementById('stdout-content');
    const stderrContent = document.getElementById('stderr-content');
    const stderrSection = document.getElementById('output-stderr');
    const executionInfo = document.getElementById('execution-info');
    const executionTime = document.getElementById('execution-time');
    const executionStatus = document.getElementById('execution-status');

    if (stdoutContent) stdoutContent.textContent = 'Running code...';
    if (stderrContent) stderrContent.textContent = '';
    if (stderrSection) stderrSection.style.display = 'none';
    if (executionInfo) executionInfo.style.display = 'none';
    if (executionTime) executionTime.textContent = '';
    if (executionStatus) executionStatus.textContent = '';
}

function displayExecutionResult(result, executionTime) {
    const stdoutContent = document.getElementById('stdout-content');
    const stderrContent = document.getElementById('stderr-content');
    const stderrSection = document.getElementById('output-stderr');
    const executionInfo = document.getElementById('execution-info');
    const timeElement = document.getElementById('execution-time');
    const statusElement = document.getElementById('execution-status');

    // Display stdout
    if (stdoutContent) {
        stdoutContent.textContent = result.run.stdout || '(no output)';
    }

    // Display stderr if present
    if (result.run.stderr && result.run.stderr.trim()) {
        if (stderrContent) {
            stderrContent.textContent = result.run.stderr;
        }
        if (stderrSection) {
            stderrSection.style.display = 'block';
        }
    }

    // Display execution info
    if (executionInfo) {
        executionInfo.style.display = 'flex';
    }
    
    if (timeElement) {
        timeElement.textContent = `⏱️ ${executionTime}ms`;
    }

    if (statusElement) {
        const exitCode = result.run.code;
        if (exitCode === 0) {
            statusElement.textContent = '✅ Success';
            statusElement.className = 'execution-stat success';
        } else {
            statusElement.textContent = `❌ Exit code: ${exitCode}`;
            statusElement.className = 'execution-stat error';
        }
    }
}

function displayExecutionError(errorMessage) {
    const stdoutContent = document.getElementById('stdout-content');
    const stderrContent = document.getElementById('stderr-content');
    const stderrSection = document.getElementById('output-stderr');
    const executionInfo = document.getElementById('execution-info');
    const statusElement = document.getElementById('execution-status');

    if (stdoutContent) {
        stdoutContent.textContent = '(execution failed)';
    }

    if (stderrContent) {
        stderrContent.textContent = errorMessage;
    }

    if (stderrSection) {
        stderrSection.style.display = 'block';
    }

    if (executionInfo) {
        executionInfo.style.display = 'flex';
    }

    if (statusElement) {
        statusElement.textContent = '❌ Execution Error';
        statusElement.className = 'execution-stat error';
    }
}

function setSampleCode(language) {
    const sampleCodes = {
        python: `# Welcome to Codebotiks!
# Write your Python code here and get AI-powered feedback
# Try the Run Code button to execute your code!

def greet(name):
    """A simple greeting function"""
    return f"Hello, {name}!"

# Call the function and print the result
message = greet("World")
print(message)
print("Welcome to Python programming!")`,
        
        javascript: `// Welcome to Codebotiks!
// Write your JavaScript code here and get AI-powered feedback
// Try the Run Code button to execute your code!

function greet(name) {
    return \`Hello, \${name}!\`;
}

// Call the function and log the result
const message = greet("World");
console.log(message);
console.log("Welcome to JavaScript programming!");`,

        typescript: `// Welcome to Codebotiks!
// Write your TypeScript code here and get AI-powered feedback
// Try the Run Code button to execute your code!

function greet(name: string): string {
    return \`Hello, \${name}!\`;
}

// Call the function with type safety
const message: string = greet("World");
console.log(message);
console.log("Welcome to TypeScript programming!");`,

        java: `// Welcome to Codebotiks!
// Write your Java code here and get AI-powered feedback
// Try the Run Code button to execute your code!

public class Main {
    public static void main(String[] args) {
        String message = greet("World");
        System.out.println(message);
        System.out.println("Welcome to Java programming!");
    }
    
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
}`,

        cpp: `// Welcome to Codebotiks!
// Write your C++ code here and get AI-powered feedback
// Try the Run Code button to execute your code!

#include <iostream>
#include <string>

std::string greet(const std::string& name) {
    return "Hello, " + name + "!";
}

int main() {
    std::string message = greet("World");
    std::cout << message << std::endl;
    std::cout << "Welcome to C++ programming!" << std::endl;
    return 0;
}`,

        go: `// Welcome to Codebotiks!
// Write your Go code here and get AI-powered feedback
// Try the Run Code button to execute your code!

package main

import "fmt"

func greet(name string) string {
    return fmt.Sprintf("Hello, %s!", name)
}

func main() {
    message := greet("World")
    fmt.Println(message)
    fmt.Println("Welcome to Go programming!")
}`
    };
    
    // Only set value if editor is ready
    if (editor && editor.setValue) {
        editor.setValue(sampleCodes[language] || sampleCodes.python);
    }
}

// DOM elements - will be initialized on DOM load
let analyzeBtn, explainBtn, clearBtn, submitChallengeBtn;
let languageSelect, skillLevelSelect, challengesSelect;
let menuChallengesSelect, menuSkillLevelSelect, menuSubmitChallengeBtn, menuProgressBtn;
let menuToggle, navMenu;
let resultsDiv, loadingDiv;
let aiFeedbackTab, codeOutputTab, aiFeedbackContent, codeOutputContent;
let disclaimerBtn, contactBtn, disclaimerModal, contactModal;
let closeDisclaimerModal, closeContactModal, contactForm;

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

    const language = languageSelect ? languageSelect.value : 'python';
    const skillLevel = (skillLevelSelect || menuSkillLevelSelect) ? 
        (skillLevelSelect ? skillLevelSelect.value : menuSkillLevelSelect.value) : 'beginner';

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
            switchTab('ai-feedback');
            showResults('📊 Code Analysis', data.analysis);
        } else {
            switchTab('ai-feedback');
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

    const language = languageSelect ? languageSelect.value : 'python';
    const skillLevel = (skillLevelSelect || menuSkillLevelSelect) ? 
        (skillLevelSelect ? skillLevelSelect.value : menuSkillLevelSelect.value) : 'beginner';

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
            switchTab('ai-feedback');
            showResults('📚 Code Explanation', data.explanation);
        } else {
            switchTab('ai-feedback');
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
    const language = languageSelect ? languageSelect.value : 'python';
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

function showSuccess(message) {
    // Create a temporary success notification
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.innerHTML = `<strong>✅ Success:</strong> ${message}`;
    successDiv.style.position = 'fixed';
    successDiv.style.top = '20px';
    successDiv.style.right = '20px';
    successDiv.style.zIndex = '3000';
    successDiv.style.maxWidth = '300px';
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Make showSuccess available globally for auth.js
window.showSuccess = showSuccess;

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
        const response = await fetch('/api/challenges');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        challengesData = data.challenges || [];
        
        await populateChallengesDropdown();
    } catch (error) {
        console.error('Failed to load challenges:', error);
        // Show error in dropdown
        challengesSelect.innerHTML = '<option value="">Error loading challenges</option>';
    }
}

async function populateChallengesDropdown() {
    // Populate both the old challenges dropdown (if it exists) and the menu challenges dropdown
    const dropdowns = [challengesSelect, menuChallengesSelect].filter(Boolean);
    
    for (const dropdown of dropdowns) {
        // Clear existing options except the first one
        const defaultText = dropdown === menuChallengesSelect ? 'Choose a Challenge' : 'Select a Challenge';
        dropdown.innerHTML = `<option value="">${defaultText}</option>`;
        
        if (!challengesData || challengesData.length === 0) {
            dropdown.innerHTML = '<option value="">No challenges available</option>';
            continue;
        }
        
        // Get user progress if logged in
        let userProgress = [];
        if (window.authSystem && window.authSystem.isLoggedIn()) {
            userProgress = await window.authSystem.getUserProgress();
        }
        
        // Group challenges by level
        const groupedChallenges = {
            beginner: [],
            intermediate: [],
            advanced: []
        };
        
        challengesData.forEach((challenge, index) => {
            if (groupedChallenges[challenge.level]) {
                groupedChallenges[challenge.level].push({ ...challenge, index });
            }
        });
        
        // Add optgroups for each level
        Object.entries(groupedChallenges).forEach(([level, challenges]) => {
            if (challenges.length > 0) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = level.charAt(0).toUpperCase() + level.slice(1);
                
                challenges.forEach(challenge => {
                    const option = document.createElement('option');
                    option.value = challenge.index;
                    
                    // Check if challenge is completed
                    const isCompleted = userProgress.some(p => 
                        p.challenge_id === challenge.index.toString() && p.status === 'completed'
                    );
                    
                    option.textContent = isCompleted 
                        ? `✅ ${challenge.title}` 
                        : challenge.title;
                    
                    if (isCompleted) {
                        option.style.color = '#16a34a';
                        option.style.fontWeight = '600';
                    }
                    
                    optgroup.appendChild(option);
                });
                
                dropdown.appendChild(optgroup);
            }
        });
    }
}

// Expose function globally for auth system
window.populateChallengesDropdown = populateChallengesDropdown;
window.getChallengesData = () => challengesData;

function selectChallenge() {
    const selectedIndex = challengesSelect ? challengesSelect.value : '';
    
    if (selectedIndex === '') {
        currentChallenge = null;
        if (submitChallengeBtn) submitChallengeBtn.style.display = 'none';
        if (menuSubmitChallengeBtn) menuSubmitChallengeBtn.style.display = 'none';
        resultsDiv.innerHTML = '<p class="placeholder">Enter your code and click "Analyze Code" or "Explain Code" to get AI-powered feedback.</p>';
        return;
    }
    
    currentChallenge = challengesData[selectedIndex];
    if (submitChallengeBtn) submitChallengeBtn.style.display = 'inline-flex';
    if (menuSubmitChallengeBtn) menuSubmitChallengeBtn.style.display = 'block';
    
    // Display challenge details in results section
    showChallengeDetails(currentChallenge);
    
    // Sync the menu challenges dropdown if it exists
    if (menuChallengesSelect) {
        menuChallengesSelect.value = selectedIndex;
    }
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

    const language = languageSelect ? languageSelect.value : 'python';
    const skillLevel = (skillLevelSelect || menuSkillLevelSelect) ? 
        (skillLevelSelect ? skillLevelSelect.value : menuSkillLevelSelect.value) : 'beginner';

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
            switchTab('ai-feedback');
            showResults('🎯 Challenge Evaluation', data.evaluation);
            
            // Save progress if user is logged in and challenge was successful
            if (window.authSystem && window.authSystem.isLoggedIn()) {
                const evaluation = data.evaluation.toLowerCase();
                if (evaluation.includes('✅ pass') || evaluation.includes('pass')) {
                    const challengeIndex = challengesSelect ? challengesSelect.value : menuChallengesSelect.value;
                    const progressSaved = await window.authSystem.saveProgress(
                        challengeIndex, 
                        currentChallenge.title, 
                        'completed'
                    );
                    
                    if (progressSaved) {
                        showSuccess('Progress saved! 🎉');
                    }
                }
            }
        } else {
            switchTab('ai-feedback');
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

// Menu functionality
function toggleMenu() {
    menuToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
    
    // Sync skill level when opening menu
    if (navMenu.classList.contains('active') && menuSkillLevelSelect && skillLevelSelect) {
        menuSkillLevelSelect.value = skillLevelSelect.value;
    }
}

function closeMenu() {
    menuToggle.classList.remove('active');
    navMenu.classList.remove('active');
}

function selectMenuChallenge() {
    const selectedIndex = menuChallengesSelect.value;
    
    if (selectedIndex === '') {
        currentChallenge = null;
        menuSubmitChallengeBtn.style.display = 'none';
        submitChallengeBtn.style.display = 'none';
        resultsDiv.innerHTML = '<p class="placeholder">Enter your code and click "Analyze Code" or "Explain Code" to get AI-powered feedback.</p>';
        return;
    }
    
    currentChallenge = challengesData[selectedIndex];
    menuSubmitChallengeBtn.style.display = 'block';
    submitChallengeBtn.style.display = 'inline-flex';
    
    // Display challenge details in results section
    showChallengeDetails(currentChallenge);
    
    // Sync the old challenges dropdown if it exists
    if (challengesSelect) {
        challengesSelect.value = selectedIndex;
    }
}

function syncSkillLevel() {
    // Sync the skill level between menu and main form
    if (skillLevelSelect && menuSkillLevelSelect) {
        skillLevelSelect.value = menuSkillLevelSelect.value;
    }
}

// Tab switching functionality
function switchTab(tabName) {
    // Update tab buttons
    if (aiFeedbackTab && codeOutputTab) {
        aiFeedbackTab.classList.toggle('active', tabName === 'ai-feedback');
        codeOutputTab.classList.toggle('active', tabName === 'code-output');
    }
    
    // Update tab content
    if (aiFeedbackContent && codeOutputContent) {
        aiFeedbackContent.classList.toggle('active', tabName === 'ai-feedback');
        codeOutputContent.classList.toggle('active', tabName === 'code-output');
    }
}

function toggleExpandedMode() {
    const mainContainer = document.querySelector('.container');
    const expandToggleBtn = document.getElementById('expand-toggle');
    const resultsSection = document.querySelector('.results-section');
    
    if (!mainContainer || !expandToggleBtn) return;
    
    const isExpanded = mainContainer.classList.contains('expanded');
    
    if (isExpanded) {
        // Collapse - return to normal view
        mainContainer.classList.remove('expanded');
        expandToggleBtn.innerHTML = '↔️';
        expandToggleBtn.title = 'Expand code editor';
    } else {
        // Expand - minimize results panel
        mainContainer.classList.add('expanded');
        expandToggleBtn.innerHTML = '↩️';
        expandToggleBtn.title = 'Restore normal view';
    }
    
    // Trigger Monaco editor resize after transition
    setTimeout(() => {
        if (editor) {
            editor.layout();
        }
    }, 300);
    
    // Make entire results section clickable when collapsed
    if (resultsSection) {
        resultsSection.onclick = isExpanded ? null : () => {
            if (mainContainer.classList.contains('expanded')) {
                toggleExpandedMode();
            }
        };
    }
}

// Footer modal functions
function showDisclaimerModal() {
    if (disclaimerModal) {
        disclaimerModal.style.display = 'flex';
    }
}

function hideDisclaimerModal() {
    if (disclaimerModal) {
        disclaimerModal.style.display = 'none';
    }
}

function showContactModal() {
    if (contactModal) {
        contactModal.style.display = 'flex';
        // Clear any previous messages
        hideContactError();
        hideContactSuccess();
        // Reset form
        if (contactForm) {
            contactForm.reset();
        }
    }
}

function hideContactModal() {
    if (contactModal) {
        contactModal.style.display = 'none';
    }
}

function showContactError(message) {
    const errorDiv = document.getElementById('contact-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function hideContactError() {
    const errorDiv = document.getElementById('contact-error');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

function showContactSuccess(message) {
    const successDiv = document.getElementById('contact-success');
    if (successDiv) {
        successDiv.innerHTML = `<strong>✅ Success:</strong> ${message}`;
        successDiv.style.display = 'block';
    }
}

function hideContactSuccess() {
    const successDiv = document.getElementById('contact-success');
    if (successDiv) {
        successDiv.style.display = 'none';
    }
}

async function handleContactForm(e) {
    e.preventDefault();
    
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const subject = document.getElementById('contact-subject').value.trim();
    const message = document.getElementById('contact-message').value.trim();
    
    if (!name || !email || !subject || !message) {
        showContactError('Please fill in all fields.');
        return;
    }
    
    hideContactError();
    hideContactSuccess();
    
    const submitBtn = document.getElementById('contact-submit');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                email: email,
                subject: subject,
                message: message
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showContactSuccess('Your message has been sent successfully! We\'ll get back to you soon.');
            contactForm.reset();
        } else {
            showContactError(data.error || 'Failed to send message. Please try again.');
        }
    } catch (error) {
        showContactError('Network error. Please try again later.');
        console.error('Contact form error:', error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Initialize with default language and load challenges
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize authentication system first
    if (window.authSystem) {
        await window.authSystem.initAuth();
    }
    
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
    
    // Initialize menu elements
    menuToggle = document.getElementById('menu-toggle');
    navMenu = document.getElementById('nav-menu');
    menuChallengesSelect = document.getElementById('menu-challenges');
    menuSkillLevelSelect = document.getElementById('menu-skill-level');
    menuSubmitChallengeBtn = document.getElementById('menu-submit-challenge');
    menuProgressBtn = document.getElementById('menu-progress');
    
    // Initialize tab elements
    aiFeedbackTab = document.getElementById('ai-feedback-tab');
    codeOutputTab = document.getElementById('code-output-tab');
    aiFeedbackContent = document.getElementById('ai-feedback-content');
    codeOutputContent = document.getElementById('code-output-content');
    
    // Initialize expand toggle
    const expandToggleBtn = document.getElementById('expand-toggle');
    const mainContainer = document.querySelector('.container');
    
    console.log('Expand toggle button found:', !!expandToggleBtn);
    console.log('Main container found:', !!mainContainer);
    
    // Initialize footer elements
    disclaimerBtn = document.getElementById('disclaimer-btn');
    contactBtn = document.getElementById('contact-btn');
    disclaimerModal = document.getElementById('disclaimer-modal');
    contactModal = document.getElementById('contact-modal');
    closeDisclaimerModal = document.getElementById('close-disclaimer-modal');
    closeContactModal = document.getElementById('close-contact-modal');
    contactForm = document.getElementById('contact-form');
    
    // Add event listeners
    analyzeBtn.addEventListener('click', analyzeCode);
    explainBtn.addEventListener('click', explainCode);
    clearBtn.addEventListener('click', clearEditor);
    submitChallengeBtn.addEventListener('click', submitChallenge);
    if (challengesSelect) challengesSelect.addEventListener('change', selectChallenge);
    
    // Add menu event listeners
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navMenu && navMenu.classList.contains('active') && 
            !navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
            closeMenu();
        }
    });
    
    if (menuChallengesSelect) {
        menuChallengesSelect.addEventListener('change', selectMenuChallenge);
    }
    
    if (menuSkillLevelSelect) {
        menuSkillLevelSelect.addEventListener('change', syncSkillLevel);
    }
    
    if (menuSubmitChallengeBtn) {
        menuSubmitChallengeBtn.addEventListener('click', () => {
            closeMenu();
            submitChallenge();
        });
    }
    
    if (menuProgressBtn) {
        menuProgressBtn.addEventListener('click', () => {
            closeMenu();
            if (window.authSystem && window.authSystem.isLoggedIn()) {
                window.authSystem.showProgressModal();
            } else {
                document.getElementById('auth-toggle-btn').click();
            }
        });
    }
    
    // Add tab event listeners
    if (aiFeedbackTab) {
        aiFeedbackTab.addEventListener('click', () => switchTab('ai-feedback'));
    }
    
    if (codeOutputTab) {
        codeOutputTab.addEventListener('click', () => switchTab('code-output'));
    }
    
    // Add expand toggle event listener
    if (expandToggleBtn && mainContainer) {
        expandToggleBtn.addEventListener('click', toggleExpandedMode);
    }
    
    // Add footer event listeners
    if (disclaimerBtn) {
        disclaimerBtn.addEventListener('click', showDisclaimerModal);
    }
    
    if (contactBtn) {
        contactBtn.addEventListener('click', showContactModal);
    }
    
    if (closeDisclaimerModal) {
        closeDisclaimerModal.addEventListener('click', hideDisclaimerModal);
    }
    
    if (closeContactModal) {
        closeContactModal.addEventListener('click', hideContactModal);
    }
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
        
        // Add cancel button handler
        const contactCancel = document.getElementById('contact-cancel');
        if (contactCancel) {
            contactCancel.addEventListener('click', hideContactModal);
        }
    }
    
    // Close modals on outside click
    if (disclaimerModal) {
        disclaimerModal.addEventListener('click', (e) => {
            if (e.target === disclaimerModal) {
                hideDisclaimerModal();
            }
        });
    }
    
    if (contactModal) {
        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) {
                hideContactModal();
            }
        });
    }
    
    // Add language change handler
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
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
            if (editor && editor.getModel) {
                monaco.editor.setModelLanguage(editor.getModel(), monacoLang);
            }
            
            // Set sample code based on language
            setSampleCode(language);
        });
    }
    
    // Load challenges
    loadChallenges();
    
    // Set default sample code only if editor is ready, otherwise it will be set by Monaco callback
    if (editor && editor.setValue) {
        setSampleCode('python');
    }
});