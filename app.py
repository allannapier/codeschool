from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import openai
import os
import json
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
        
        # Focused prompt for concise problem-focused analysis
        prompt = f"""
        Analyze this {language} code for a {skill_level} programmer. Focus only on problems and improvements - if something is good, just acknowledge it briefly.
        
        ```{language}
        {code}
        ```
        
        Return analysis in this format:
        
        **Issues Found:**
        - List specific problems, bugs, or errors
        - If no issues: "✓ No major issues detected"
        
        **Improvements:**
        - Specific suggestions for better code
        - If code is good: "✓ Code follows good practices"
        
        **Key Learning:**
        - One main concept to focus on (for {skill_level} level)
        - If advanced: "✓ Demonstrates solid understanding"
        
        Be direct and concise. Skip introductory text.
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=700,
            temperature=0.7
        )
        
        return jsonify({
            'analysis': response.choices[0].message.content.strip(),
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
        
        # Focused prompt for concise explanations
        prompt = f"""
        Explain this {language} code for a {skill_level} level programmer. Be concise and focus on the essential parts.
        
        ```{language}
        {code}
        ```
        
        **What it does:**
        - Brief overview of the code's purpose
        
        **Key parts:**
        - Explain only the important/complex sections
        - Skip obvious parts (basic variable assignments, etc.)
        
        **Output:**
        - What the code produces when run
        
        Keep explanations short and {skill_level}-appropriate. Skip introductory phrases.
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=600,
            temperature=0.5
        )
        
        return jsonify({
            'explanation': response.choices[0].message.content.strip(),
            'success': True
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/challenges', methods=['GET'])
def get_challenges():
    try:
        with open('challenges.json', 'r') as file:
            challenges = json.load(file)
        return jsonify(challenges)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/submit-challenge', methods=['POST'])
def submit_challenge():
    try:
        data = request.get_json()
        code = data.get('code', '')
        challenge_title = data.get('challenge_title', '')
        challenge_description = data.get('challenge_description', '')
        language = data.get('language', 'python')
        skill_level = data.get('skill_level', 'beginner')
        
        if not code.strip():
            return jsonify({'error': 'No code provided'}), 400
        
        if not challenge_title or not challenge_description:
            return jsonify({'error': 'Challenge details missing'}), 400
        
        # Challenge evaluation prompt
        prompt = f"""
        Evaluate this {language} code submission for the challenge: "{challenge_title}"
        
        **Challenge Requirements:**
        {challenge_description}
        
        **Submitted Code:**
        ```{language}
        {code}
        ```
        
        Assess if the code meets the challenge requirements. Be encouraging and supportive.
        
        **Result:** 
        - "✅ PASS" if requirements are met
        - "❌ NEEDS WORK" if requirements are not fully met
        
        **Feedback:**
        - What the code does well
        - What requirements are missing (if any)
        - Specific suggestions for improvement
        - Encouragement for the learner
        
        Keep feedback supportive and constructive for a {skill_level} level programmer.
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.5
        )
        
        return jsonify({
            'evaluation': response.choices[0].message.content.strip(),
            'success': True
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)