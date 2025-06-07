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
        
        prompt = f"""
        Analyze this {language} code for a {skill_level} programmer:
        
        {code}
        
        Provide:
        1. Code review and feedback
        2. Suggestions for improvement
        3. Explanation of concepts used
        4. Best practices recommendations
        
        Keep explanations appropriate for {skill_level} level.
        """
        
        response = openai.Completion.create(
            engine="gpt-3.5-turbo-instruct",
            prompt=prompt,
            max_tokens=500,
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
        
        prompt = f"""
        Explain this {language} code step by step for a {skill_level} programmer:
        
        {code}
        
        Break down:
        1. What each part does
        2. How it works together
        3. Key concepts involved
        
        Use simple language appropriate for {skill_level} level.
        """
        
        response = openai.Completion.create(
            engine="gpt-3.5-turbo-instruct",
            prompt=prompt,
            max_tokens=400,
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