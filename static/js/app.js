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

// Initialize with default language
document.addEventListener('DOMContentLoaded', function() {
    // Set default sample code
    setSampleCode('python');
});