from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import openai
import os
import json
from dotenv import load_dotenv
import jwt
from functools import wraps
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

# Optional: Add user context to API calls (requires Supabase JWT verification)
def get_user_from_token():
    """Extract user info from Supabase JWT token (optional)"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    try:
        token = auth_header.split(' ')[1]
        # In production, you'd verify this JWT with Supabase
        # For now, we'll just decode without verification for user context
        decoded = jwt.decode(token, options={"verify_signature": False})
        return decoded.get('sub')  # User ID
    except:
        return None

@app.route('/')
def index():
    # Pass Supabase credentials to frontend
    supabase_url = os.getenv('SUPABASE_URL', '')
    supabase_anon_key = os.getenv('SUPABASE_ANON_KEY', '')
    
    return render_template('index.html', 
                         supabase_url=supabase_url,
                         supabase_anon_key=supabase_anon_key)

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
        print("Challenges API called")  # Debug log
        with open('challenges.json', 'r') as file:
            challenges = json.load(file)
        print(f"Loaded {len(challenges['challenges'])} challenges")  # Debug log
        return jsonify(challenges)
    except Exception as e:
        print(f"Error loading challenges: {str(e)}")  # Debug log
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
        
        # Optional: Get user context for personalized feedback
        user_id = get_user_from_token()
        user_context = f" (User ID: {user_id})" if user_id else ""
        
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

def send_email(to_email, subject, body, reply_to=None):
    """
    Generic email sending function with debugging
    """
    try:
        # Email configuration (using environment variables)
        smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        smtp_username = os.getenv('SMTP_USERNAME', '')
        smtp_password = os.getenv('SMTP_PASSWORD', '')
        
        print(f"DEBUG: SMTP Config - Server: {smtp_server}, Port: {smtp_port}")
        print(f"DEBUG: Username configured: {'Yes' if smtp_username else 'No'}")
        print(f"DEBUG: Password configured: {'Yes' if smtp_password else 'No'}")
        
        if not smtp_username or not smtp_password:
            print("ERROR: SMTP credentials not configured in environment variables")
            return False, "Email service not configured. Please set SMTP_USERNAME and SMTP_PASSWORD environment variables."
        
        # Create email message
        msg = MIMEMultipart()
        msg['From'] = smtp_username
        msg['To'] = to_email
        msg['Subject'] = subject
        
        if reply_to:
            msg['Reply-To'] = reply_to
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email with detailed debugging
        print(f"DEBUG: Attempting to connect to {smtp_server}:{smtp_port}")
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.set_debuglevel(1)  # Enable debug output
        
        print("DEBUG: Starting TLS...")
        server.starttls()
        
        print("DEBUG: Attempting login...")
        server.login(smtp_username, smtp_password)
        
        print(f"DEBUG: Sending email to {to_email}...")
        text = msg.as_string()
        server.sendmail(smtp_username, to_email, text)
        server.quit()
        
        print("DEBUG: Email sent successfully!")
        return True, "Email sent successfully"
        
    except smtplib.SMTPAuthenticationError as e:
        error_msg = f"SMTP Authentication failed: {str(e)}"
        print(f"ERROR: {error_msg}")
        if "BadCredentials" in str(e):
            return False, "Gmail authentication failed. Please ensure you're using an App Password (not your regular Gmail password) and that 2-Step Verification is enabled. Visit: https://support.google.com/accounts/answer/185833"
        return False, "Email authentication failed. Please check email credentials."
        
    except smtplib.SMTPException as e:
        error_msg = f"SMTP Error: {str(e)}"
        print(f"ERROR: {error_msg}")
        return False, "Email service error. Please try again later."
        
    except Exception as e:
        error_msg = f"Email sending error: {str(e)}"
        print(f"ERROR: {error_msg}")
        return False, "Failed to send email. Please try again later."

@app.route('/api/contact', methods=['POST'])
def contact():
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        subject = data.get('subject', '').strip()
        message = data.get('message', '').strip()
        
        if not all([name, email, subject, message]):
            return jsonify({'error': 'All fields are required'}), 400
        
        # Email body
        body = f"""
New contact form submission from Codebotiks:

Name: {name}
Email: {email}
Subject: {subject}

Message:
{message}

---
This email was sent from the Codebotiks contact form.
Reply to: {email}
        """
        
        # Send email
        success, error_message = send_email(
            to_email='allan@codebotiks.com',
            subject=f'Codebotiks Contact Form: {subject}',
            body=body,
            reply_to=email
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Contact form submitted successfully'
            })
        else:
            return jsonify({'error': error_message}), 500
        
    except Exception as e:
        print(f"Contact form error: {str(e)}")
        return jsonify({'error': 'Server error. Please try again later.'}), 500

@app.route('/api/debug-config', methods=['GET'])
def debug_config():
    """
    Debug endpoint to check environment variable configuration
    """
    try:
        config_status = {
            'openai_key': 'Set' if os.getenv('OPENAI_API_KEY') else 'Missing',
            'supabase_url': 'Set' if os.getenv('SUPABASE_URL') else 'Missing',
            'supabase_key': 'Set' if os.getenv('SUPABASE_ANON_KEY') else 'Missing',
            'smtp_server': os.getenv('SMTP_SERVER', 'Not set (defaults to smtp.gmail.com)'),
            'smtp_port': os.getenv('SMTP_PORT', 'Not set (defaults to 587)'),
            'smtp_username': 'Set' if os.getenv('SMTP_USERNAME') else 'Missing',
            'smtp_password': 'Set' if os.getenv('SMTP_PASSWORD') else 'Missing'
        }
        
        return jsonify({
            'config_status': config_status,
            'env_file_exists': os.path.exists('.env'),
            'message': 'Configuration debug information'
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@app.route('/api/test-email', methods=['GET'])
def test_email():
    """
    Test endpoint to debug email configuration
    """
    try:
        success, message = send_email(
            to_email='allan@codebotiks.com',
            subject='Codebotiks Email Test',
            body='This is a test email to verify the email configuration is working.'
        )
        
        return jsonify({
            'success': success,
            'message': message
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)