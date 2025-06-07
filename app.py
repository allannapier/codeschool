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

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        message = data.get('message', '')
        language = data.get('language', 'spanish')
        skill_level = data.get('skill_level', 'beginner')
        lesson_mode = data.get('lesson_mode', 'conversation')
        conversation_history = data.get('conversation_history', [])
        
        if not message.strip():
            return jsonify({'error': 'No message provided'}), 400
        
        # Build conversation context
        context_messages = []
        for msg in conversation_history[-10:]:  # Keep last 10 messages for context
            context_messages.append(f"{msg['role']}: {msg['content']}")
        
        context = "\n".join(context_messages) if context_messages else "Starting new conversation"
        
        # Create prompt based on language and skill level
        language_names = {
            'spanish': 'Spanish', 'french': 'French', 'german': 'German',
            'italian': 'Italian', 'portuguese': 'Portuguese', 
            'mandarin': 'Mandarin Chinese', 'japanese': 'Japanese'
        }
        
        target_language = language_names.get(language, 'Spanish')
        
        if lesson_mode == 'conversation':
            prompt = f"""You are a helpful {target_language} language tutor having a natural conversation with a {skill_level} level student. 

Your role:
- Respond naturally in {target_language} appropriate for {skill_level} level
- Keep responses conversational and encouraging
- Gently correct mistakes when they occur
- Ask follow-up questions to continue the conversation
- Use vocabulary and grammar appropriate for {skill_level} level

Conversation context:
{context}

Student's latest message: {message}

Respond naturally in {target_language}. Keep your response to 2-3 sentences maximum."""
        else:
            prompt = f"""You are a structured {target_language} language tutor providing a focused lesson for a {skill_level} level student.

Your role:
- Provide structured teaching in {target_language}
- Explain grammar concepts when relevant
- Give specific exercises or practice suggestions
- Be encouraging but educational

Conversation context:
{context}

Student's message: {message}

Provide a structured response in {target_language} with brief explanations in English when needed for {skill_level} level understanding."""

        response = openai.Completion.create(
            engine="gpt-3.5-turbo-instruct",
            prompt=prompt,
            max_tokens=200,
            temperature=0.7
        )
        
        tutor_response = response.choices[0].text.strip()
        
        # Generate feedback
        feedback = generate_feedback(message, language, skill_level)
        
        # Generate goals progress (simple simulation)
        goals_progress = []
        if len(message.split()) > 5:  # Longer messages contribute to vocabulary goal
            goals_progress.append({"id": 3, "increment": 2})
        if any(word in message.lower() for word in ['hola', 'bonjour', 'hello', 'hi']):
            goals_progress.append({"id": 1, "increment": 5})
        
        return jsonify({
            'success': True,
            'response': tutor_response,
            'feedback': feedback,
            'goals_progress': goals_progress
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/help', methods=['POST'])
def help_user():
    try:
        data = request.get_json()
        language = data.get('language', 'spanish')
        skill_level = data.get('skill_level', 'beginner')
        conversation_history = data.get('conversation_history', [])
        
        # Get recent context
        recent_messages = conversation_history[-3:] if conversation_history else []
        context = "\n".join([f"{msg['role']}: {msg['content']}" for msg in recent_messages])
        
        language_names = {
            'spanish': 'Spanish', 'french': 'French', 'german': 'German',
            'italian': 'Italian', 'portuguese': 'Portuguese', 
            'mandarin': 'Mandarin Chinese', 'japanese': 'Japanese'
        }
        
        target_language = language_names.get(language, 'Spanish')
        
        prompt = f"""You are a helpful {target_language} tutor. The student needs help continuing the conversation.

Recent conversation:
{context}

Provide helpful suggestions in English for a {skill_level} level student learning {target_language}:
1. What they might say next
2. Useful vocabulary for this context
3. A simple grammar tip if relevant

Keep your help concise and encouraging (2-3 sentences)."""

        response = openai.Completion.create(
            engine="gpt-3.5-turbo-instruct",
            prompt=prompt,
            max_tokens=150,
            temperature=0.5
        )
        
        return jsonify({
            'success': True,
            'help_message': response.choices[0].text.strip()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_feedback(message, language, skill_level):
    """Generate grammar and vocabulary feedback"""
    try:
        # Grammar feedback
        grammar_prompt = f"""Analyze this {language} text for grammar issues appropriate for {skill_level} level:
        
        "{message}"
        
        Provide very brief feedback (1-2 sentences) about grammar. If grammar is good, give encouragement. If there are issues, suggest gentle corrections."""
        
        grammar_response = openai.Completion.create(
            engine="gpt-3.5-turbo-instruct",
            prompt=grammar_prompt,
            max_tokens=80,
            temperature=0.3
        )
        
        # Vocabulary feedback
        vocab_prompt = f"""Analyze this {language} text for vocabulary usage at {skill_level} level:
        
        "{message}"
        
        Provide very brief feedback (1-2 sentences) about vocabulary. Suggest alternative words or praise good word choices."""
        
        vocab_response = openai.Completion.create(
            engine="gpt-3.5-turbo-instruct",
            prompt=vocab_prompt,
            max_tokens=80,
            temperature=0.3
        )
        
        return {
            'grammar': grammar_response.choices[0].text.strip(),
            'vocabulary': vocab_response.choices[0].text.strip()
        }
        
    except Exception as e:
        print(f"Feedback generation error: {e}")
        return {
            'grammar': 'Keep practicing! Your effort is great.',
            'vocabulary': 'Good vocabulary usage!'
        }

if __name__ == '__main__':
    app.run(debug=True)