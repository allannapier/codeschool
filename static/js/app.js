// Initialize Monaco Editor
let editor;

require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.45.0/min/vs' } });
require(['vs/editor/editor.main'], function () {
    editor = monaco.editor.create(document.getElementById('editor'), {
        value: `# Welcome to Code Tutor!
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
        wordWrap: 'on'
    });

    // Update editor language when dropdown changes
    document.getElementById('language').addEventListener('change', function() {
        const language = this.value;
        monaco.editor.setModelLanguage(editor.getModel(), language);
        
        // Set sample code based on language
        if (language === 'javascript') {
            editor.setValue(`// Welcome to Code Tutor!
// Write your JavaScript code here and get AI-powered feedback

function greet(name) {
    // A simple greeting function
    return \`Hello, \${name}!\`;
}

// Try calling the function
const result = greet("World");
console.log(result);`);
        } else {
            editor.setValue(`# Welcome to Code Tutor!
# Write your Python code here and get AI-powered feedback

def greet(name):
    """A simple greeting function"""
    return f"Hello, {name}!"

# Try calling the function
result = greet("World")
print(result)`);
        }
    });
});

// DOM elements
const analyzeBtn = document.getElementById('analyze-btn');
const explainBtn = document.getElementById('explain-btn');
const clearBtn = document.getElementById('clear-btn');
const languageSelect = document.getElementById('language');
const skillLevelSelect = document.getElementById('skill-level');
const resultsDiv = document.getElementById('results');
const loadingDiv = document.getElementById('loading');

// Event listeners
analyzeBtn.addEventListener('click', analyzeCode);
explainBtn.addEventListener('click', explainCode);
clearBtn.addEventListener('click', clearEditor);

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
            showResults('Code Analysis', data.analysis);
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
            showResults('Code Explanation', data.explanation);
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
    
    if (language === 'javascript') {
        editor.setValue('// Write your JavaScript code here...\n\n');
    } else {
        editor.setValue('# Write your Python code here...\n\n');
    }
    
    resultsDiv.innerHTML = '<p class="placeholder">Enter your code and click "Analyze Code" or "Explain Code" to get AI-powered feedback.</p>';
}

function showResults(title, content) {
    resultsDiv.innerHTML = `
        <h4>${title}</h4>
        <div class="content">${content}</div>
    `;
    resultsDiv.scrollTop = 0;
}

function showError(message) {
    resultsDiv.innerHTML = `
        <div class="error">
            <strong>Error:</strong> ${message}
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