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
    const formatCodeBtn = document.getElementById('format-code');
    const foldAllBtn = document.getElementById('fold-all');
    const unfoldAllBtn = document.getElementById('unfold-all');
    const clearOutputBtn = document.getElementById('clear-output');
    
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
    
    // Format code
    formatCodeBtn.addEventListener('click', () => {
        if (editor) {
            editor.trigger('editor', 'editor.action.formatDocument');
        }
    });
    
    // Clear output
    clearOutputBtn.addEventListener('click', () => {
        hideExecutionOutput();
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
        showExecutionOutput();
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

function showExecutionOutput() {
    const outputDiv = document.getElementById('execution-output');
    if (outputDiv) {
        outputDiv.style.display = 'block';
    }
}

function hideExecutionOutput() {
    const outputDiv = document.getElementById('execution-output');
    if (outputDiv) {
        outputDiv.style.display = 'none';
    }
}

function clearExecutionOutput() {
    const stdoutContent = document.getElementById('stdout-content');
    const stderrContent = document.getElementById('stderr-content');
    const stderrSection = document.getElementById('output-stderr');
    const executionTime = document.getElementById('execution-time');
    const executionStatus = document.getElementById('execution-status');

    if (stdoutContent) stdoutContent.textContent = '';
    if (stderrContent) stderrContent.textContent = '';
    if (stderrSection) stderrSection.style.display = 'none';
    if (executionTime) executionTime.textContent = '';
    if (executionStatus) executionStatus.textContent = '';
}

function displayExecutionResult(result, executionTime) {
    const stdoutContent = document.getElementById('stdout-content');
    const stderrContent = document.getElementById('stderr-content');
    const stderrSection = document.getElementById('output-stderr');
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

    if (statusElement) {
        statusElement.textContent = '❌ Execution Error';
        statusElement.className = 'execution-stat error';
    }
}

function setSampleCode(language) {
    const sampleCodes = {
        python: `# Welcome to Codebotiks!
# Write your Python code here and get AI-powered feedback
# Try using the toolbar to change themes, font size, and other editor features!

def calculate_fibonacci(n):
    """
    Calculate the nth Fibonacci number using dynamic programming.
    This function demonstrates code folding, syntax highlighting, and bracket matching.
    """
    if n <= 1:
        return n
    
    # Initialize base cases
    fib_sequence = [0, 1]
    
    # Calculate fibonacci numbers iteratively
    for i in range(2, n + 1):
        next_fib = fib_sequence[i-1] + fib_sequence[i-2]
        fib_sequence.append(next_fib)
    
    return fib_sequence[n]

# Example usage with nested function calls
def main():
    """Main function to demonstrate the Fibonacci calculator"""
    numbers_to_calculate = [5, 10, 15, 20]
    
    print("Fibonacci Calculator Results:")
    print("-" * 30)
    
    for num in numbers_to_calculate:
        result = calculate_fibonacci(num)
        print(f"F({num}) = {result}")

# Call the main function
if __name__ == "__main__":
    main()`,
        
        javascript: `// Welcome to Codebotiks!
// Write your JavaScript code here and get AI-powered feedback
// Try the toolbar features: themes, font size, minimap, and code folding!

class FibonacciCalculator {
    /**
     * A class to demonstrate JavaScript features including:
     * - Class syntax and methods
     * - Arrow functions
     * - Template literals
     * - Array methods and destructuring
     */
    constructor() {
        this.cache = new Map();
    }

    // Memoized Fibonacci calculation
    calculate(n) {
        if (this.cache.has(n)) {
            return this.cache.get(n);
        }

        let result;
        if (n <= 1) {
            result = n;
        } else {
            result = this.calculate(n - 1) + this.calculate(n - 2);
        }

        this.cache.set(n, result);
        return result;
    }

    // Calculate multiple Fibonacci numbers
    calculateMultiple(numbers) {
        return numbers.map(num => ({
            input: num,
            fibonacci: this.calculate(num),
            timeCalculated: new Date().toISOString()
        }));
    }
}

// Example usage with modern JavaScript features
const fibCalculator = new FibonacciCalculator();
const numbersToCalculate = [5, 10, 15, 20, 25];

console.log("🧮 Fibonacci Calculator Results:");
console.log("=" .repeat(40));

const results = fibCalculator.calculateMultiple(numbersToCalculate);

// Destructuring and template literals
results.forEach(({ input, fibonacci, timeCalculated }) => {
    console.log(\`F(\${input}) = \${fibonacci} (calculated at \${timeCalculated})\`);
});`,

        typescript: `// Welcome to Codebotiks!
// Write your TypeScript code here and get AI-powered feedback
// Explore advanced TypeScript features with the enhanced editor!

// Interface and type definitions
interface FibonacciResult {
    input: number;
    fibonacci: number;
    timeCalculated: string;
    cached: boolean;
}

type NumberArray = number[];
type FibonacciCache = Map<number, number>;

// Generic utility type
type CalculationMetrics<T> = {
    data: T;
    executionTime: number;
    cacheHits: number;
};

class TypedFibonacciCalculator {
    private cache: FibonacciCache = new Map();
    private cacheHits: number = 0;

    /**
     * Calculate Fibonacci number with full type safety
     * @param n - The position in the Fibonacci sequence
     * @returns The calculated Fibonacci number
     */
    public calculate(n: number): number {
        if (this.cache.has(n)) {
            this.cacheHits++;
            return this.cache.get(n)!;
        }

        const result: number = n <= 1 ? n : 
            this.calculate(n - 1) + this.calculate(n - 2);

        this.cache.set(n, result);
        return result;
    }

    /**
     * Calculate multiple Fibonacci numbers with detailed results
     */
    public calculateMultiple(numbers: NumberArray): CalculationMetrics<FibonacciResult[]> {
        const startTime = performance.now();
        const initialCacheHits = this.cacheHits;

        const results: FibonacciResult[] = numbers.map((num: number) => ({
            input: num,
            fibonacci: this.calculate(num),
            timeCalculated: new Date().toISOString(),
            cached: this.cache.has(num)
        }));

        const endTime = performance.now();

        return {
            data: results,
            executionTime: endTime - startTime,
            cacheHits: this.cacheHits - initialCacheHits
        };
    }
}

// Usage with strong typing
const calculator = new TypedFibonacciCalculator();
const numbers: NumberArray = [5, 10, 15, 20, 25, 30];

const metrics = calculator.calculateMultiple(numbers);

console.log("📊 TypeScript Fibonacci Analysis");
console.log("================================");
console.log(\`Execution time: \${metrics.executionTime.toFixed(2)}ms\`);
console.log(\`Cache hits: \${metrics.cacheHits}\`);
console.log("\\nResults:");

metrics.data.forEach((result: FibonacciResult) => {
    const cacheStatus = result.cached ? "📋" : "🆕";
    console.log(\`\${cacheStatus} F(\${result.input}) = \${result.fibonacci}\`);
});`,

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
    
    // Only set value if editor is ready
    if (editor && editor.setValue) {
        editor.setValue(sampleCodes[language] || sampleCodes.python);
    }
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
    // Clear existing options except the first one
    challengesSelect.innerHTML = '<option value="">Select a Challenge</option>';
    
    if (!challengesData || challengesData.length === 0) {
        challengesSelect.innerHTML = '<option value="">No challenges available</option>';
        return;
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
            
            challengesSelect.appendChild(optgroup);
        }
    });
}

// Expose function globally for auth system
window.populateChallengesDropdown = populateChallengesDropdown;
window.getChallengesData = () => challengesData;

function selectChallenge() {
    const selectedIndex = challengesSelect.value;
    
    if (selectedIndex === '') {
        currentChallenge = null;
        submitChallengeBtn.style.display = 'none';
        resultsDiv.innerHTML = '<p class="placeholder">Enter your code and click "Analyze Code" or "Explain Code" to get AI-powered feedback.</p>';
        return;
    }
    
    currentChallenge = challengesData[selectedIndex];
    submitChallengeBtn.style.display = 'inline-flex';
    
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
            
            // Save progress if user is logged in and challenge was successful
            if (window.authSystem && window.authSystem.isLoggedIn()) {
                const evaluation = data.evaluation.toLowerCase();
                if (evaluation.includes('✅ pass') || evaluation.includes('pass')) {
                    const challengeIndex = challengesSelect.value;
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
    
    // Add event listeners
    analyzeBtn.addEventListener('click', analyzeCode);
    explainBtn.addEventListener('click', explainCode);
    clearBtn.addEventListener('click', clearEditor);
    submitChallengeBtn.addEventListener('click', submitChallenge);
    challengesSelect.addEventListener('change', selectChallenge);
    
    // Add language change handler
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
    
    // Load challenges
    loadChallenges();
    
    // Set default sample code only if editor is ready, otherwise it will be set by Monaco callback
    if (editor && editor.setValue) {
        setSampleCode('python');
    }
});