from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import openai
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze_code():
    try:
        data = request.get_json()
        code = data.get('code', '')
        language = data.get('language', 'python')
        skill_level = data.get('skill_level', 'beginner')
        
        if not code.strip():
            return jsonify({'error': 'No code provided'}), 400
        
        # Enhanced prompt for better analysis
        prompt = f"""
        You are an expert {language} programmer and code reviewer. Analyze this {language} code for a {skill_level} programmer:
        
        ```{language}
        {code}
        ```
        
        Provide a comprehensive analysis including:
        
        **Code Quality & Structure:**
        - Overall code quality assessment
        - Code organization and readability
        
        **Best Practices:**
        - Adherence to {language} best practices
        - Naming conventions
        - Code structure improvements
        
        **Potential Issues:**
        - Logic errors or bugs
        - Performance considerations
        - Security concerns (if any)
        
        **Suggestions:**
        - Specific improvements you'd recommend
        - Alternative approaches or patterns
        
        **Learning Points:**
        - Key concepts demonstrated in the code
        - Areas for the programmer to study further
        
        Tailor your explanations to be appropriate for a {skill_level} level programmer.
        """
        
        response = openai.Completion.create(
            engine="gpt-3.5-turbo-instruct",
            prompt=prompt,
            max_tokens=700,
            temperature=0.7
        )
        
        return jsonify({
            'analysis': response.choices[0].text.strip(),
            'success': True
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/explain', methods=['POST'])
def explain_code():
    try:
        data = request.get_json()
        code = data.get('code', '')
        language = data.get('language', 'python')
        skill_level = data.get('skill_level', 'beginner')
        
        if not code.strip():
            return jsonify({'error': 'No code provided'}), 400
        
        # Enhanced prompt for better explanations
        prompt = f"""
        You are an expert {language} programming instructor. Explain this {language} code step by step for a {skill_level} level programmer:
        
        ```{language}
        {code}
        ```
        
        Provide a clear, educational explanation that includes:
        
        **Code Walkthrough:**
        - Line-by-line or section-by-section breakdown
        - What each part does and why
        
        **Concepts Explained:**
        - Programming concepts used (variables, functions, loops, etc.)
        - {language}-specific features and syntax
        
        **How It Works:**
        - The flow of execution
        - How different parts work together
        - Expected output or behavior
        
        **Key Takeaways:**
        - Important programming principles demonstrated
        - Vocabulary and terminology to remember
        
        Use simple, clear language appropriate for a {skill_level} level programmer. Include examples where helpful.
        """
        
        response = openai.Completion.create(
            engine="gpt-3.5-turbo-instruct",
            prompt=prompt,
            max_tokens=600,
            temperature=0.5
        )
        
        return jsonify({
            'explanation': response.choices[0].text.strip(),
            'success': True
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)