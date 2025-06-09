from flask import Flask, request, jsonify, render_template, redirect
from flask_cors import CORS
import openai
import os
import json
import glob
from datetime import datetime
from dotenv import load_dotenv
import jwt
from functools import wraps
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import markdown

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

@app.route('/blog')
def blog():
    # Pass Supabase credentials to frontend
    supabase_url = os.getenv('SUPABASE_URL', '')
    supabase_anon_key = os.getenv('SUPABASE_ANON_KEY', '')
    
    return render_template('blog.html', 
                         supabase_url=supabase_url,
                         supabase_anon_key=supabase_anon_key)

@app.route('/robots.txt')
def robots():
    from flask import send_from_directory
    return send_from_directory('.', 'robots.txt', mimetype='text/plain')

@app.route('/ads.txt')
def ads():
    from flask import send_from_directory
    return send_from_directory('.', 'ads.txt', mimetype='text/plain')

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

@app.route('/api/execute-code', methods=['POST'])
def execute_code():
    """Execute code and return the output"""
    try:
        data = request.get_json()
        code = data.get('code', '')
        language = data.get('language', 'python')
        
        if not code.strip():
            return jsonify({'error': 'No code provided'}), 400
        
        # For security and simplicity, we'll use a basic execution simulation
        # In a production environment, you'd use a sandboxed execution environment
        
        if language == 'python':
            # Basic Python execution simulation
            # This is a simplified version - in production you'd use docker or similar
            try:
                import subprocess
                import tempfile
                import os
                
                # Create a temporary file
                with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                    f.write(code)
                    temp_file = f.name
                
                # Execute the code with timeout
                result = subprocess.run(
                    ['python3', temp_file],
                    capture_output=True,
                    text=True,
                    timeout=10  # 10 second timeout
                )
                
                # Clean up
                os.unlink(temp_file)
                
                output = result.stdout
                error = result.stderr
                
                if result.returncode == 0:
                    return jsonify({
                        'success': True,
                        'output': output or '(no output)',
                        'error': None
                    })
                else:
                    return jsonify({
                        'success': False,
                        'output': output,
                        'error': error
                    })
                    
            except subprocess.TimeoutExpired:
                return jsonify({
                    'success': False,
                    'error': 'Code execution timed out (10 seconds limit)'
                })
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': f'Execution error: {str(e)}'
                })
        
        elif language == 'javascript':
            # JavaScript execution using Node.js
            try:
                import subprocess
                import tempfile
                import os
                
                # Create a temporary file
                with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
                    f.write(code)
                    temp_file = f.name
                
                # Execute the code with timeout
                result = subprocess.run(
                    ['node', temp_file],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                # Clean up
                os.unlink(temp_file)
                
                output = result.stdout
                error = result.stderr
                
                if result.returncode == 0:
                    return jsonify({
                        'success': True,
                        'output': output or '(no output)',
                        'error': None
                    })
                else:
                    return jsonify({
                        'success': False,
                        'output': output,
                        'error': error
                    })
                    
            except subprocess.TimeoutExpired:
                return jsonify({
                    'success': False,
                    'error': 'Code execution timed out (10 seconds limit)'
                })
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': f'Execution error: {str(e)}'
                })
        
        else:
            # For other languages, return a simulated output
            return jsonify({
                'success': True,
                'output': f'Code execution simulation for {language}:\n\n{code}\n\n(This is a simulated output - actual execution not implemented for {language})',
                'error': None
            })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

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

@app.route('/api/blog-posts', methods=['GET'])
def get_blog_posts():
    """
    Load all blog posts from the blog_posts directory
    """
    try:
        blog_posts = []
        # Ensure the blog_posts directory exists
        if not os.path.exists('blog_posts'):
            return jsonify({
                'success': True,
                'posts': []
            })
        
        post_files = glob.glob('blog_posts/*.json')
        
        for file_path in post_files:
            try:
                with open(file_path, 'r') as file:
                    post_data = json.load(file)
                    # Add filename for reference
                    post_data['filename'] = os.path.basename(file_path)
                    blog_posts.append(post_data)
            except Exception as e:
                print(f"Error loading blog post {file_path}: {str(e)}")
                continue
        
        # Sort by created_date (newest first)
        blog_posts.sort(key=lambda x: x.get('created_date', ''), reverse=True)
        
        return jsonify({
            'success': True,
            'posts': blog_posts
        })
        
    except Exception as e:
        print(f"Error loading blog posts: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to load blog posts'
        }), 500

# Tutorial System Routes

@app.route('/tutorials')
def tutorials():
    # Pass Supabase credentials to frontend
    supabase_url = os.getenv('SUPABASE_URL', '')
    supabase_anon_key = os.getenv('SUPABASE_ANON_KEY', '')
    
    return render_template('tutorials.html', 
                         supabase_url=supabase_url,
                         supabase_anon_key=supabase_anon_key)

@app.route('/tutorials/course/<int:course_id>')
def course_overview(course_id):
    # For now, redirect to first chapter
    return redirect(f'/tutorials/course/{course_id}/chapter/1')

@app.route('/tutorials/course/<int:course_id>/chapter/<int:chapter_id>')
def chapter_view(course_id, chapter_id):
    try:
        # Load course and chapter data
        course_data = load_course_data(course_id)
        if not course_data:
            return "Course not found", 404
            
        chapter_data = load_chapter_data(course_id, chapter_id)
        if not chapter_data:
            return "Chapter not found", 404
            
        # Load all chapters for navigation
        all_chapters = load_all_chapters(course_id)
        
        # Find previous and next chapters
        prev_chapter = None
        next_chapter = None
        
        for i, chapter in enumerate(all_chapters):
            if chapter['id'] == chapter_id:
                if i > 0:
                    prev_chapter = all_chapters[i - 1]
                if i < len(all_chapters) - 1:
                    next_chapter = all_chapters[i + 1]
                break
        
        # Load chapter content (markdown)
        chapter_content = load_chapter_content(course_id, chapter_id)
        
        # Load test questions if available
        test_questions = load_test_questions(course_id, chapter_id)
        
        # Pass Supabase credentials
        supabase_url = os.getenv('SUPABASE_URL', '')
        supabase_anon_key = os.getenv('SUPABASE_ANON_KEY', '')
        
        return render_template('chapter.html',
                             course=course_data,
                             chapter=chapter_data,
                             all_chapters=all_chapters,
                             prev_chapter=prev_chapter,
                             next_chapter=next_chapter,
                             chapter_content=chapter_content,
                             test_questions=test_questions,
                             supabase_url=supabase_url,
                             supabase_anon_key=supabase_anon_key)
                             
    except Exception as e:
        print(f"Error loading chapter: {str(e)}")
        return "Error loading chapter", 500

@app.route('/api/tutorials/courses', methods=['GET'])
def get_tutorial_courses():
    """Get all available tutorial courses"""
    try:
        courses = load_all_courses()
        return jsonify({
            'success': True,
            'courses': courses
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/tutorials/progress', methods=['GET'])
def get_tutorial_progress():
    """Get user's tutorial progress"""
    try:
        # This would integrate with your user system
        # For now, return empty progress
        return jsonify({
            'success': True,
            'progress': {}
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/tutorials/submit-test', methods=['POST'])
def submit_tutorial_test():
    """Submit answers for a chapter test"""
    try:
        data = request.get_json()
        course_id = data.get('course_id')
        chapter_id = data.get('chapter_id')
        answers = data.get('answers', [])
        
        # Load test questions and correct answers
        test_questions = load_test_questions(course_id, chapter_id)
        if not test_questions:
            return jsonify({
                'success': False,
                'error': 'No test available for this chapter'
            }), 400
        
        # Calculate score
        correct_answers = 0
        total_questions = len(test_questions)
        
        for i, answer in enumerate(answers):
            if i < len(test_questions) and answer == test_questions[i].get('correct_answer', 0):
                correct_answers += 1
        
        score = round((correct_answers / total_questions) * 100)
        passed = score >= 70  # 70% passing threshold
        
        # Generate feedback
        if passed:
            feedback = f"Congratulations! You scored {score}% and passed the test. You can now move on to the next chapter."
        else:
            feedback = f"You scored {score}%. You need at least 70% to pass. Review the chapter content and try again."
        
        return jsonify({
            'success': True,
            'score': score,
            'passed': passed,
            'feedback': feedback
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/tutorials/submit-practical', methods=['POST'])
def submit_tutorial_practical():
    """Submit code for a practical exercise"""
    try:
        data = request.get_json()
        course_id = data.get('course_id')
        chapter_id = data.get('chapter_id')
        code = data.get('code', '')
        language = data.get('language', 'python')
        
        if not code.strip():
            return jsonify({
                'success': False,
                'error': 'No code provided'
            }), 400
        
        # Load chapter data for practical requirements
        chapter_data = load_chapter_data(course_id, chapter_id)
        if not chapter_data:
            return jsonify({
                'success': False,
                'error': 'Chapter not found'
            }), 404
        
        # AI evaluation prompt
        prompt = f"""
        Evaluate this {language} code for the practical exercise in Chapter {chapter_id}.
        
        Chapter Title: {chapter_data.get('title', 'Unknown')}
        
        Exercise Requirements:
        {chapter_data.get('practical_description', 'Complete the coding exercise.')}
        
        Submitted Code:
        ```{language}
        {code}
        ```
        
        Evaluate if the code meets the exercise requirements. Be encouraging and educational.
        
        **Result:** 
        - "✅ PASS" if requirements are met
        - "⚠️ NEEDS IMPROVEMENT" if requirements are partially met
        - "❌ NEEDS WORK" if requirements are not met
        
        **Feedback:**
        - What the code does well
        - What requirements are missing or incorrect (if any)
        - Specific suggestions for improvement
        - Encouragement and next steps
        
        Keep feedback constructive and educational.
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=600,
            temperature=0.5
        )
        
        evaluation = response.choices[0].message.content.strip()
        passed = "✅ PASS" in evaluation
        
        return jsonify({
            'success': True,
            'evaluation': evaluation,
            'passed': passed
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/tutorials/mark-complete', methods=['POST'])
def mark_chapter_complete():
    """Mark a chapter as completed"""
    try:
        data = request.get_json()
        course_id = data.get('course_id')
        chapter_id = data.get('chapter_id')
        
        # This would save to database
        # For now, just return success
        response_data = {
            'success': True,
            'message': 'Chapter marked as complete'
        }
        
        # Check if course is completed
        course_completion = check_course_completion(course_id)
        if course_completion['completed']:
            response_data['course_completed'] = True
            response_data['certificate_url'] = f'/tutorials/certificate/{course_id}'
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/tutorials/certificate/<int:course_id>')
def generate_certificate(course_id):
    """Generate and display certificate for completed course"""
    try:
        # Load course data
        course_data = load_course_data(course_id)
        if not course_data:
            return "Course not found", 404
        
        # Check if course is completed (for now, we'll allow viewing)
        # In production, you'd verify the user has actually completed the course
        
        # Generate certificate data
        certificate_data = generate_certificate_data(course_id, course_data)
        
        return render_template('certificate.html', **certificate_data)
        
    except Exception as e:
        print(f"Error generating certificate: {str(e)}")
        return "Error generating certificate", 500

@app.route('/api/tutorials/certificate/<int:course_id>', methods=['GET'])
def get_certificate_data(course_id):
    """Get certificate data as JSON"""
    try:
        course_data = load_course_data(course_id)
        if not course_data:
            return jsonify({
                'success': False,
                'error': 'Course not found'
            }), 404
        
        certificate_data = generate_certificate_data(course_id, course_data)
        
        return jsonify({
            'success': True,
            'certificate': certificate_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Tutorial Data Loading Functions

def load_all_courses():
    """Load all available courses"""
    try:
        courses_file = os.path.join('tutorials', 'courses.json')
        if os.path.exists(courses_file):
            with open(courses_file, 'r') as f:
                return json.load(f).get('courses', [])
        else:
            # Return sample courses if file doesn't exist
            return get_sample_courses()
    except Exception as e:
        print(f"Error loading courses: {str(e)}")
        return get_sample_courses()

def load_course_data(course_id):
    """Load specific course data"""
    courses = load_all_courses()
    return next((course for course in courses if course['id'] == course_id), None)

def load_all_chapters(course_id):
    """Load all chapters for a course"""
    try:
        chapters_file = os.path.join('tutorials', f'course_{course_id}_chapters.json')
        if os.path.exists(chapters_file):
            with open(chapters_file, 'r') as f:
                return json.load(f).get('chapters', [])
        else:
            # Return sample chapters
            return get_sample_chapters(course_id)
    except Exception as e:
        print(f"Error loading chapters: {str(e)}")
        return get_sample_chapters(course_id)

def load_chapter_data(course_id, chapter_id):
    """Load specific chapter data"""
    chapters = load_all_chapters(course_id)
    return next((chapter for chapter in chapters if chapter['id'] == chapter_id), None)

def load_chapter_content(course_id, chapter_id):
    """Load and render chapter content from markdown"""
    try:
        content_file = os.path.join('tutorials', 'content', f'course_{course_id}_chapter_{chapter_id}.md')
        if os.path.exists(content_file):
            with open(content_file, 'r', encoding='utf-8') as f:
                markdown_content = f.read()
                return markdown.markdown(markdown_content, extensions=['codehilite', 'fenced_code'])
        else:
            return get_sample_chapter_content(course_id, chapter_id)
    except Exception as e:
        print(f"Error loading chapter content: {str(e)}")
        return get_sample_chapter_content(course_id, chapter_id)

def load_test_questions(course_id, chapter_id):
    """Load test questions for a chapter"""
    try:
        test_file = os.path.join('tutorials', 'tests', f'course_{course_id}_chapter_{chapter_id}.json')
        if os.path.exists(test_file):
            with open(test_file, 'r') as f:
                return json.load(f).get('questions', [])
        else:
            return get_sample_test_questions(course_id, chapter_id)
    except Exception as e:
        print(f"Error loading test questions: {str(e)}")
        return []

# Sample Data Functions (for development)

def get_sample_courses():
    """Get sample courses for development"""
    return [
        {
            "id": 1,
            "title": "Python Fundamentals",
            "subtitle": "Learn the basics of Python programming",
            "description": "Master Python fundamentals including variables, functions, loops, and data structures. Perfect for beginners starting their programming journey.",
            "difficulty": "Beginner",
            "estimated_duration": 8,
            "chapter_count": 6,
            "created_date": "2025-01-01"
        },
        {
            "id": 2,
            "title": "Web Development with JavaScript",
            "subtitle": "Build interactive websites",
            "description": "Learn modern JavaScript, DOM manipulation, and web APIs to create dynamic and interactive web applications.",
            "difficulty": "Intermediate",
            "estimated_duration": 12,
            "chapter_count": 8,
            "created_date": "2025-01-01"
        }
    ]

def get_sample_chapters(course_id):
    """Get sample chapters for development"""
    if course_id == 1:  # Python Fundamentals
        return [
            {
                "id": 1,
                "title": "Introduction to Python",
                "chapter_number": 1,
                "estimated_duration": 45,
                "difficulty": "beginner",
                "learning_objectives": [
                    "Understand what Python is and why it's useful",
                    "Set up your Python development environment",
                    "Write and run your first Python program"
                ],
                "has_test": True,
                "has_practical": True,
                "practical_description": "Write a simple Python program that prints a personalized greeting message."
            },
            {
                "id": 2,
                "title": "Variables and Data Types",
                "chapter_number": 2,
                "estimated_duration": 60,
                "difficulty": "beginner",
                "learning_objectives": [
                    "Learn about different data types in Python",
                    "Understand how to create and use variables",
                    "Practice with strings, numbers, and booleans"
                ],
                "has_test": True,
                "has_practical": True,
                "practical_description": "Create a program that stores information about a person and displays it in a formatted way."
            }
        ]
    elif course_id == 2:  # JavaScript
        return [
            {
                "id": 1,
                "title": "JavaScript Basics",
                "chapter_number": 1,
                "estimated_duration": 50,
                "difficulty": "intermediate",
                "learning_objectives": [
                    "Understand JavaScript syntax and structure",
                    "Learn about variables and data types",
                    "Write basic JavaScript functions"
                ],
                "has_test": True,
                "has_practical": True,
                "practical_description": "Create an interactive webpage that responds to user clicks."
            }
        ]
    return []

def get_sample_chapter_content(course_id, chapter_id):
    """Get sample chapter content for development"""
    if course_id == 1 and chapter_id == 1:
        return """
        <h2>Welcome to Python Programming!</h2>
        
        <p>Python is one of the most popular programming languages in the world, and for good reason. It's:</p>
        
        <ul>
            <li><strong>Easy to learn</strong> - Python's syntax is clear and readable</li>
            <li><strong>Versatile</strong> - Used for web development, data science, AI, and more</li>
            <li><strong>Powerful</strong> - Despite being beginner-friendly, Python is used by major companies</li>
        </ul>
        
        <h3>Your First Python Program</h3>
        
        <p>Let's start with the traditional "Hello, World!" program:</p>
        
        <pre><code class="language-python">print("Hello, World!")</code></pre>
        
        <p>That's it! This single line of code will display "Hello, World!" on the screen.</p>
        
        <blockquote>
            <p><strong>Try it yourself:</strong> Type this code into a Python interpreter or file and run it to see the output.</p>
        </blockquote>
        
        <h3>Why Python?</h3>
        
        <p>Python was created by Guido van Rossum in the late 1980s with a focus on code readability and simplicity. Today, it's used by companies like Google, Netflix, Instagram, and many others.</p>
        
        <p>In this course, you'll learn the fundamentals that will prepare you for any Python programming task!</p>
        """
    
    return "<p>Chapter content coming soon...</p>"

def get_sample_test_questions(course_id, chapter_id):
    """Get sample test questions for development"""
    if course_id == 1 and chapter_id == 1:
        return [
            {
                "question": "What is the primary advantage of Python as a programming language?",
                "options": [
                    "It's the fastest programming language",
                    "It has clear, readable syntax that's easy to learn",
                    "It can only be used for web development",
                    "It doesn't require any setup"
                ],
                "correct_answer": 1
            },
            {
                "question": "Which of the following is the correct way to print 'Hello, World!' in Python?",
                "options": [
                    "echo 'Hello, World!'",
                    "console.log('Hello, World!')",
                    "print('Hello, World!')",
                    "printf('Hello, World!')"
                ],
                "correct_answer": 2
            },
            {
                "question": "Who created the Python programming language?",
                "options": [
                    "Linus Torvalds",
                    "Guido van Rossum",
                    "Dennis Ritchie",
                    "Bjarne Stroustrup"
                ],
                "correct_answer": 1
            }
        ]
    
    return []

# Certificate Generation Functions

def check_course_completion(course_id):
    """Check if a course is completed based on chapter completion"""
    try:
        chapters = load_all_chapters(course_id)
        total_chapters = len(chapters)
        
        # For now, we'll simulate completion
        # In production, this would check the user's actual progress from database
        completed_chapters = total_chapters  # Simulate all chapters completed
        
        completion_percentage = (completed_chapters / total_chapters) * 100 if total_chapters > 0 else 0
        
        return {
            'completed': completion_percentage >= 100,
            'total_chapters': total_chapters,
            'completed_chapters': completed_chapters,
            'completion_percentage': completion_percentage
        }
    except Exception as e:
        print(f"Error checking course completion: {str(e)}")
        return {
            'completed': False,
            'total_chapters': 0,
            'completed_chapters': 0,
            'completion_percentage': 0
        }

def generate_certificate_data(course_id, course_data):
    """Generate data for certificate display"""
    try:
        import uuid
        from datetime import datetime
        
        # Get course completion data
        completion_data = check_course_completion(course_id)
        
        # Generate certificate data
        certificate_data = {
            'student_name': 'John Doe',  # In production, get from authenticated user
            'course_title': course_data.get('title', 'Unknown Course'),
            'course_description': course_data.get('description', ''),
            'course_duration': course_data.get('estimated_duration', 8),
            'total_chapters': completion_data['total_chapters'],
            'chapters_completed': completion_data['completed_chapters'],
            'completion_date': datetime.now().strftime('%B %d, %Y'),
            'certificate_id': f"CB-{course_id}-{str(uuid.uuid4())[:8].upper()}",
            'average_score': 85,  # In production, calculate from actual test scores
            'back_url': f'/tutorials/course/{course_id}/chapter/1'
        }
        
        return certificate_data
        
    except Exception as e:
        print(f"Error generating certificate data: {str(e)}")
        return {
            'student_name': 'Student',
            'course_title': 'Course',
            'course_description': '',
            'course_duration': 8,
            'total_chapters': 1,
            'chapters_completed': 1,
            'completion_date': datetime.now().strftime('%B %d, %Y'),
            'certificate_id': 'CB-ERROR',
            'average_score': 0,
            'back_url': '/tutorials'
        }

if __name__ == '__main__':
    app.run(debug=True)