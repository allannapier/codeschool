from flask import Flask, request, jsonify, render_template, redirect, session
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

# Set Flask secret key for sessions
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'your-secret-key-change-in-production')

# Configure OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

# Configure Supabase
supabase_url = os.getenv('SUPABASE_URL')
supabase_service_key = os.getenv('SUPABASE_SERVICE_KEY')  # Service role key for admin operations
supabase_anon_key = os.getenv('SUPABASE_ANON_KEY')

# Configure Supabase
if supabase_url and supabase_service_key:
    from supabase import create_client, Client
    supabase: Client = create_client(supabase_url, supabase_service_key)
    print("Supabase client initialized successfully")
else:
    print("ERROR: Supabase credentials missing. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.")
    supabase = None

# Optional: Add user context to API calls (requires Supabase JWT verification)
def get_user_from_token():
    """Extract user info from Supabase JWT token"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    try:
        token = auth_header.split(' ')[1]
        
        # Skip if it's a placeholder token
        if token == 'placeholder-token':
            return None
            
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

@app.route('/api/debug-progress', methods=['GET'])
def debug_progress():
    """
    Debug endpoint to test progress tracking system
    """
    try:
        debug_info = {
            'supabase_configured': supabase is not None,
            'supabase_url': os.getenv('SUPABASE_URL', 'Not set')[:50] + '...' if os.getenv('SUPABASE_URL') else 'Not set',
        }
        
        if supabase:
            try:
                # Test basic connection
                response = supabase.table('courses').select('id, title').limit(1).execute()
                debug_info['courses_accessible'] = True
                debug_info['sample_course'] = response.data[0] if response.data else None
            except Exception as e:
                debug_info['courses_accessible'] = False
                debug_info['courses_error'] = str(e)
            
            try:
                # Test user_progress table structure
                response = supabase.table('user_progress').select('*').limit(1).execute()
                debug_info['user_progress_accessible'] = True
                debug_info['user_progress_sample'] = response.data[0] if response.data else 'Table exists but empty'
            except Exception as e:
                debug_info['user_progress_accessible'] = False
                debug_info['user_progress_error'] = str(e)
            
            # Test a dummy save operation
            try:
                import uuid
                test_user_id = str(uuid.uuid4())
                test_data = {
                    'user_id': test_user_id,
                    'course_id': 1,
                    'chapter_id': 1,
                    'completed_at': datetime.now().isoformat(),
                    'test_score': 85,
                    'practical_passed': True
                }
                
                # Try to insert test data
                response = supabase.table('user_progress').insert(test_data).execute()
                if response.data:
                    debug_info['test_insert'] = 'Success'
                    # Clean up test data
                    supabase.table('user_progress').delete().eq('user_id', test_user_id).execute()
                else:
                    debug_info['test_insert'] = f'Failed: {response}'
                    
            except Exception as e:
                debug_info['test_insert'] = f'Error: {str(e)}'
        else:
            debug_info['error'] = 'Supabase not configured'
        
        return jsonify(debug_info)
        
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
    try:
        # Load course data
        course_data = load_course_data(course_id)
        if not course_data:
            return "Course not found", 404
            
        # Load all chapters for this course
        all_chapters = load_all_chapters(course_id)
        
        # If course has chapters, redirect to the appropriate chapter based on progress
        if all_chapters and len(all_chapters) > 0:
            # Sort chapters by chapter_number
            sorted_chapters = sorted(all_chapters, key=lambda x: x.get('chapter_number', 1))
            
            # Get user ID and check progress
            user_id = get_user_from_token() or get_user_from_session()
            if user_id:
                # Get completed chapters for this user and course
                completed_chapters = get_user_completed_chapters(user_id, course_id)
                print(f"DEBUG: User {user_id} completed chapters: {completed_chapters}")
                
                # Find the first incomplete chapter
                for chapter in sorted_chapters:
                    if chapter['id'] not in completed_chapters:
                        print(f"DEBUG: Redirecting to next incomplete chapter: {chapter['id']}")
                        return redirect(f'/tutorials/course/{course_id}/chapter/{chapter["id"]}')
                
                # If all chapters are completed, go to the last chapter
                last_chapter = sorted_chapters[-1]
                print(f"DEBUG: All chapters completed, going to last chapter: {last_chapter['id']}")
                return redirect(f'/tutorials/course/{course_id}/chapter/{last_chapter["id"]}')
            else:
                # No user session, start from beginning
                first_chapter = sorted_chapters[0]
                print(f"DEBUG: No user session, starting from first chapter: {first_chapter['id']}")
                return redirect(f'/tutorials/course/{course_id}/chapter/{first_chapter["id"]}')
        
        # If no chapters, show course overview page
        supabase_url = os.getenv('SUPABASE_URL', '')
        supabase_anon_key = os.getenv('SUPABASE_ANON_KEY', '')
        
        return render_template('course_overview.html',
                             course=course_data,
                             chapters=all_chapters,
                             supabase_url=supabase_url,
                             supabase_anon_key=supabase_anon_key)
                             
    except Exception as e:
        print(f"Error loading course overview: {str(e)}")
        return "Error loading course", 500

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
        
        # Load chapter content from database
        chapter_content = chapter_data.get('content', '') if chapter_data else ''
        
        # Load test questions from database
        test_questions = chapter_data.get('test_questions', []) if chapter_data else []
        
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
        # Get user ID from token
        user_id = get_user_from_token() or get_user_from_session()
        
        if not user_id:
            return jsonify({
                'success': True,
                'progress': {}  # Return empty if not logged in
            })
        
        # Load user progress from database
        progress = load_user_progress(user_id)
        
        return jsonify({
            'success': True,
            'progress': progress
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
        
        # Load test questions from database
        chapter_data = load_chapter_data(course_id, chapter_id)
        test_questions = chapter_data.get('test_questions', []) if chapter_data else []
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
        chapter_number = chapter_data.get('chapter_number', chapter_id)
        practical_instructions = chapter_data.get('practical_instructions', 'Complete the coding exercise.')
        
        prompt = f"""
        Evaluate this {language} code for the practical exercise in Chapter {chapter_number}: "{chapter_data.get('title', 'Unknown')}".
        
        Exercise Requirements:
        {practical_instructions}
        
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
        test_score = data.get('test_score')
        practical_passed = data.get('practical_passed')
        
        # Get user ID from token (implement proper auth)
        user_id = get_user_from_token() or get_user_from_session()
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'User not authenticated'
            }), 401
        
        # Save progress to database with test score and practical status
        success = save_user_progress(user_id, course_id, chapter_id, test_score, practical_passed)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Failed to save progress'
            }), 500
        
        response_data = {
            'success': True,
            'message': 'Chapter marked as complete'
        }
        
        # Check if course is completed
        course_completion = check_course_completion(course_id, user_id)
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
        
        # For direct page access, we'll render the template with placeholder data
        # The actual user data will be loaded via JavaScript
        certificate_data = {
            'student_name': 'Loading...',  # Will be replaced by JavaScript
            'course_title': course_data.get('title', 'Unknown Course'),
            'course_description': course_data.get('description', ''),
            'course_duration': course_data.get('estimated_duration', 8),
            'total_chapters': 0,  # Will be loaded by JavaScript
            'chapters_completed': 0,  # Will be loaded by JavaScript
            'completion_date': datetime.now().strftime('%B %d, %Y'),
            'certificate_id': f"CB-{course_id}-LOADING",  # Will be replaced
            'average_score': 85,
            'back_url': f'/tutorials/course/{course_id}/chapter/1',
            'course_id': course_id,  # Pass course_id to template for JavaScript
            'supabase_url': os.getenv('SUPABASE_URL', ''),
            'supabase_anon_key': os.getenv('SUPABASE_ANON_KEY', '')
        }
        
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
        
        # Get user ID for personalized certificate
        user_id = get_user_from_token() or get_user_from_session()
        certificate_data = generate_certificate_data(course_id, course_data, user_id)
        
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
    """Load all available courses from Supabase"""
    try:
        if not supabase:
            raise Exception("Supabase not configured")
        
        response = supabase.table('courses').select('*').order('created_at', desc=True).execute()
        return response.data if response.data else []
    except Exception as e:
        print(f"Error loading courses from Supabase: {str(e)}")
        raise

def load_course_data(course_id):
    """Load specific course data from Supabase"""
    try:
        if not supabase:
            raise Exception("Supabase not configured")
        
        response = supabase.table('courses').select('*').eq('id', course_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Error loading course {course_id} from Supabase: {str(e)}")
        raise

def load_all_chapters(course_id):
    """Load all chapters for a course from Supabase"""
    try:
        if not supabase:
            raise Exception("Supabase not configured")
        
        response = supabase.table('chapters').select('*').eq('course_id', course_id).order('chapter_number').execute()
        return response.data if response.data else []
    except Exception as e:
        print(f"Error loading chapters from Supabase: {str(e)}")
        raise

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

# User Progress Functions

def get_user_from_session():
    """Get user ID from session (fallback for non-Supabase auth)"""
    # This should only be used when there's no proper auth token
    # For page navigation (like certificate access), we need a session-based fallback
    
    # Check if we have a Supabase user ID stored in the session
    # This would be set when user logs in
    if 'supabase_user_id' in session:
        return session['supabase_user_id']
    
    # Fallback to temporary session-based ID for development
    if 'temp_user_id' not in session:
        import uuid
        session['temp_user_id'] = str(uuid.uuid4())
    return session['temp_user_id']

def save_user_progress(user_id, course_id, chapter_id, test_score=None, practical_passed=None):
    """Save user progress to Supabase"""
    try:
        if not supabase:
            return False
        
        # Get chapter title for the challenge_title field
        chapter_data = load_chapter_data(course_id, chapter_id)
        chapter_title = chapter_data.get('title', f'Chapter {chapter_id}') if chapter_data else f'Chapter {chapter_id}'
        
        # First, check if this progress already exists
        existing_response = supabase.table('user_progress').select('*').eq('user_id', user_id).eq('course_id', course_id).eq('chapter_id', chapter_id).execute()
        
        if existing_response.data:
            return True  # Return True because the chapter is indeed completed
        else:
            # Insert new record
            progress_data = {
                'user_id': user_id,
                'course_id': course_id,
                'chapter_id': chapter_id,
                'challenge_id': f'chapter_{course_id}_{chapter_id}',  # Make it more unique
                'challenge_title': chapter_title,
                'completed_at': datetime.now().isoformat(),
                'test_score': test_score,
                'practical_passed': practical_passed,
                'status': 'completed'
            }
            
            response = supabase.table('user_progress').insert(progress_data).execute()
            
            return bool(response.data)
            
    except Exception as e:
        return False

def load_user_progress(user_id):
    """Load user progress from Supabase"""
    try:
        if not supabase:
            print("Supabase not configured")
            return {}
        
        response = supabase.table('user_progress').select('*').eq('user_id', user_id).execute()
        
        if response.data:
            # Convert to the format expected by frontend
            progress = {}
            for record in response.data:
                course_id = record.get('course_id')
                chapter_id = record.get('chapter_id')
                
                # Skip records without course_id or chapter_id (old challenge-based records)
                if not course_id or not chapter_id:
                    continue
                
                if course_id not in progress:
                    progress[course_id] = {}
                
                progress[course_id][chapter_id] = {
                    'completed_at': record['completed_at'],
                    'test_score': record.get('test_score'),
                    'practical_passed': record.get('practical_passed'),
                    'challenge_title': record.get('challenge_title', f'Chapter {chapter_id}')
                }
            
            return progress
        else:
            return {}
            
    except Exception as e:
        print(f"Error loading user progress: {str(e)}")
        return {}

def get_user_completed_chapters(user_id, course_id):
    """Get list of completed chapter IDs for a user and course"""
    try:
        if not supabase:
            return []
        
        response = supabase.table('user_progress').select('chapter_id').eq('user_id', user_id).eq('course_id', course_id).execute()
        
        if response.data:
            # Filter out null chapter_ids
            return [record['chapter_id'] for record in response.data if record.get('chapter_id')]
        else:
            return []
            
    except Exception as e:
        print(f"Error getting completed chapters: {str(e)}")
        return []

# Certificate Generation Functions

def check_course_completion(course_id, user_id=None):
    """Check if a course is completed based on chapter completion"""
    try:
        chapters = load_all_chapters(course_id)
        total_chapters = len(chapters)
        
        if not user_id:
            return {
                'completed': False,
                'total_chapters': total_chapters,
                'completed_chapters': 0,
                'completion_percentage': 0
            }
        
        # Get user's completed chapters for this course
        completed_chapters = get_user_completed_chapters(user_id, course_id)
        completed_count = len(completed_chapters)
        
        completion_percentage = (completed_count / total_chapters) * 100 if total_chapters > 0 else 0
        
        return {
            'completed': completion_percentage >= 100,
            'total_chapters': total_chapters,
            'completed_chapters': completed_count,
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

def generate_certificate_data(course_id, course_data, user_id=None):
    """Generate data for certificate display"""
    try:
        import uuid
        from datetime import datetime
        
        # Get the authenticated user's name
        student_name = 'Student'  # Default fallback
        if user_id:
            try:
                # First, try to get user info from the current request's auth token
                auth_header = request.headers.get('Authorization')
                if auth_header and auth_header.startswith('Bearer '):
                    try:
                        token = auth_header.split(' ')[1]
                        if token != 'placeholder-token':
                            # Decode JWT token to get user metadata
                            import jwt
                            decoded = jwt.decode(token, options={"verify_signature": False})
                            
                            # Check for name in JWT token
                            jwt_names = [
                                decoded.get('user_metadata', {}).get('display_name'),
                                decoded.get('user_metadata', {}).get('full_name'),
                                decoded.get('user_metadata', {}).get('name'),
                                decoded.get('raw_user_meta_data', {}).get('display_name'),
                                decoded.get('raw_user_meta_data', {}).get('full_name'),
                                decoded.get('raw_user_meta_data', {}).get('name'),
                                decoded.get('display_name'),
                                decoded.get('full_name'),
                                decoded.get('name')
                            ]
                            
                            for name_option in jwt_names:
                                if name_option and name_option.strip():
                                    student_name = name_option.strip()
                                    break
                    except Exception:
                        pass
                
                # If no name found in JWT, try Supabase auth admin API
                if student_name == 'Student' and supabase:
                    try:
                        auth_response = supabase.auth.admin.get_user_by_id(user_id)
                        
                        if auth_response and hasattr(auth_response, 'user') and auth_response.user:
                            user = auth_response.user
                            
                            # Handle different ways the user object might be structured
                            user_metadata = {}
                            raw_user_metadata = {}
                            
                            # Try different ways to access user metadata
                            if hasattr(user, 'user_metadata'):
                                user_metadata = user.user_metadata or {}
                            elif hasattr(user, 'user_meta_data'):
                                user_metadata = user.user_meta_data or {}
                            elif isinstance(user, dict) and 'user_metadata' in user:
                                user_metadata = user['user_metadata'] or {}
                            elif isinstance(user, dict) and 'user_meta_data' in user:
                                user_metadata = user['user_meta_data'] or {}
                            
                            if hasattr(user, 'raw_user_meta_data'):
                                raw_user_metadata = user.raw_user_meta_data or {}
                            elif isinstance(user, dict) and 'raw_user_meta_data' in user:
                                raw_user_metadata = user['raw_user_meta_data'] or {}
                            
                            # If user is a dict, try to get metadata from it directly
                            if isinstance(user, dict):
                                # Sometimes metadata is stored directly in the user dict
                                for key in ['full_name', 'display_name', 'name']:
                                    if key in user and user[key]:
                                        user_metadata[key] = user[key]
                            
                            # Check various possible name fields
                            possible_names = [
                                user_metadata.get('display_name'),
                                user_metadata.get('full_name'),
                                user_metadata.get('name'),
                                raw_user_metadata.get('display_name'),
                                raw_user_metadata.get('full_name'),
                                raw_user_metadata.get('name')
                            ]
                            
                            # If user is a dict, also check direct properties
                            if isinstance(user, dict):
                                possible_names.extend([
                                    user.get('display_name'),
                                    user.get('full_name'),
                                    user.get('name')
                                ])
                            
                            # Add email username as fallback
                            email = None
                            if hasattr(user, 'email'):
                                email = user.email
                            elif isinstance(user, dict) and 'email' in user:
                                email = user['email']
                            
                            if email:
                                possible_names.append(email.split('@')[0])
                            
                            for name_option in possible_names:
                                if name_option and name_option.strip():
                                    student_name = name_option.strip()
                                    break
                            else:
                                # Final fallback to email or user ID
                                student_name = getattr(user, 'email', f'User {user_id[:8]}')
                                
                    except Exception:
                        # Try to get user name from users table as fallback
                        try:
                            user_response = supabase.table('users').select('name, email').eq('id', user_id).execute()
                            
                            if user_response.data and len(user_response.data) > 0:
                                user_data = user_response.data[0]
                                student_name = user_data.get('name') or user_data.get('email', f'User {user_id[:8]}')
                            else:
                                student_name = f'User {user_id[:8]}'
                        except Exception:
                            student_name = f'User {user_id[:8]}'
                            
            except Exception:
                student_name = 'Student'
        
        # Get course completion data
        completion_data = check_course_completion(course_id, user_id)
        
        # Calculate average test score from user progress
        average_score = None
        if user_id:
            try:
                progress = load_user_progress(user_id)
                course_progress = progress.get(str(course_id), {})
                
                test_scores = []
                for chapter_id, chapter_progress in course_progress.items():
                    test_score = chapter_progress.get('test_score')
                    if test_score is not None:
                        test_scores.append(test_score)
                
                if test_scores:
                    average_score = round(sum(test_scores) / len(test_scores))
            except Exception:
                pass
        
        # Generate certificate data
        certificate_data = {
            'student_name': student_name,
            'course_title': course_data.get('title', 'Unknown Course'),
            'course_description': course_data.get('description', ''),
            'course_duration': course_data.get('estimated_duration', 8),
            'total_chapters': completion_data['total_chapters'],
            'chapters_completed': completion_data['completed_chapters'],
            'completion_date': datetime.now().strftime('%B %d, %Y'),
            'certificate_id': f"CB-{course_id}-{str(uuid.uuid4())[:8].upper()}",
            'average_score': average_score,  # Calculated from actual test scores
            'back_url': f'/tutorials/course/{course_id}'
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

# Admin Routes

@app.route('/admin')
def admin_dashboard():
    """Admin dashboard"""
    # Check admin authentication
    if not is_admin_authenticated():
        return redirect('/admin/login')
    
    return render_template('admin/dashboard.html', admin_user=get_admin_user())

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    """Admin login"""
    if request.method == 'POST':
        try:
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'error': 'No JSON data received'}), 400
                
            username = data.get('username')
            password = data.get('password')
            
            if not username or not password:
                return jsonify({'success': False, 'error': 'Username and password required'}), 400
            
            # Simple admin authentication (in production, use proper auth)
            # Define admin users - in production, use a proper user management system
            admin_users = {
                'admin': {
                    'password': os.getenv('ADMIN_PASSWORD', 'admin123'),
                    'name': 'Administrator'
                },
                'allan': {
                    'password': os.getenv('ALLAN_PASSWORD', 'allan123'),
                    'name': 'Allan Napier'
                }
                # Add more admin users here as needed
            }
            
            if username in admin_users and password == admin_users[username]['password']:
                # Set admin session
                session['admin_authenticated'] = True
                session['admin_user'] = {
                    'name': admin_users[username]['name'], 
                    'username': username
                }
                return jsonify({'success': True, 'redirect': '/admin'})
            else:
                return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
                
        except Exception as e:
            print(f"Admin login error: {str(e)}")
            return jsonify({'success': False, 'error': 'Server error during login'}), 500
    
    return render_template('admin/login.html')

@app.route('/admin/logout')
def admin_logout():
    """Admin logout"""
    session.pop('admin_authenticated', None)
    session.pop('admin_user', None)
    return redirect('/admin/login')

@app.route('/admin/courses')
def admin_courses():
    """Admin courses list"""
    if not is_admin_authenticated():
        return redirect('/admin/login')
    
    courses = load_all_courses()
    return render_template('admin/courses.html', courses=courses, admin_user=get_admin_user())

@app.route('/admin/courses/new')
def admin_course_new():
    """Create new course"""
    if not is_admin_authenticated():
        return redirect('/admin/login')
    
    return render_template('admin/course_editor.html', course=None, chapters=[], admin_user=get_admin_user())

@app.route('/admin/courses/<int:course_id>/edit')
def admin_course_edit(course_id):
    """Edit existing course"""
    if not is_admin_authenticated():
        return redirect('/admin/login')
    
    course = load_course_data(course_id)
    chapters = load_all_chapters(course_id)
    
    if not course:
        return "Course not found", 404
    
    return render_template('admin/course_editor.html', 
                         course=course, 
                         chapters=chapters, 
                         admin_user=get_admin_user())

@app.route('/admin/users')
def admin_users():
    """Admin users list"""
    if not is_admin_authenticated():
        return redirect('/admin/login')
    
    # For now, show a placeholder page
    # In the future, this could integrate with Supabase auth.users
    return render_template('admin/users.html', admin_user=get_admin_user())

# Admin API Routes

@app.route('/api/admin/generate-content', methods=['POST'])
def api_admin_generate_content():
    """Generate AI content for course/chapter fields"""
    if not is_admin_authenticated():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.get_json()
        content_type = data.get('type')  # 'course_subtitle', 'course_description', etc.
        context = data.get('context', {})  # Existing course/chapter data
        current_text = data.get('current_text', '')  # Existing text in the field
        
        # Generate appropriate prompt based on content type
        prompt = generate_content_prompt(content_type, context, current_text)
        
        if not prompt:
            return jsonify({'success': False, 'error': 'Unknown content type'}), 400
        
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        generated_content = response.choices[0].message.content.strip()
        
        return jsonify({
            'success': True,
            'content': generated_content
        })
        
    except Exception as e:
        print(f"Error generating AI content: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

def generate_content_prompt(content_type, context, current_text):
    """Generate appropriate prompts for different content types"""
    
    title = context.get('title', '')
    difficulty = context.get('difficulty', 'beginner')
    duration = context.get('estimated_duration', 8)
    
    if content_type == 'course_subtitle':
        return f"""
Create a compelling short subtitle (max 100 characters) for a {difficulty} level programming course titled "{title}".
The course is approximately {duration} hours long.

Current subtitle: "{current_text}"

Generate a concise, engaging subtitle that would attract students. Focus on what they'll learn or achieve.
Return only the subtitle text, no quotes or additional formatting.
"""
    
    elif content_type == 'course_description':
        subtitle = context.get('subtitle', '')
        return f"""
Create a comprehensive course description for:
Title: "{title}"
Subtitle: "{subtitle}"
Level: {difficulty}
Duration: {duration} hours

Current description: "{current_text}"

Write a detailed, engaging description (200-400 words) that includes:
- What students will learn
- Prerequisites (if any)
- Who this course is for
- Key outcomes and skills gained
- Why this course is valuable

Make it professional but approachable. Use bullet points where appropriate.
Return only the description text.
"""
    
    elif content_type == 'course_prerequisites':
        return f"""
Suggest appropriate prerequisites for a {difficulty} level course titled "{title}" ({duration} hours).

Current prerequisites: "{current_text}"

Provide a clear, concise list of what students should know before taking this course.
If it's a beginner course, you might suggest "No prior experience required" or basic computer skills.
For intermediate/advanced courses, list specific technologies, concepts, or previous courses.

Return only the prerequisites text, be specific but not overwhelming.
"""
    
    elif content_type == 'chapter_objectives':
        chapter_title = context.get('chapter_title', '')
        course_title = context.get('course_title', title)
        chapter_number = context.get('chapter_number', 1)
        
        return f"""
Create 3-5 specific learning objectives for Chapter {chapter_number}: "{chapter_title}" in the course "{course_title}".

Current objectives: {current_text}

Generate clear, measurable learning objectives that start with action verbs like:
- Understand, Learn, Identify, Explain (for knowledge)
- Apply, Implement, Create, Build (for skills)
- Analyze, Evaluate, Compare (for higher-order thinking)

Make them specific to this chapter topic and appropriate for the course level.
Return as a JSON array of strings, e.g. ["Objective 1", "Objective 2", "Objective 3"]
"""
    
    elif content_type == 'practical_instructions':
        chapter_title = context.get('chapter_title', '')
        course_title = context.get('course_title', title)
        learning_objectives = context.get('learning_objectives', [])
        
        objectives_text = ', '.join(learning_objectives) if learning_objectives else 'the chapter concepts'
        
        return f"""
Create clear instructions for a hands-on practical exercise for Chapter "{chapter_title}" in "{course_title}".

Current instructions: "{current_text}"

The exercise should help students practice: {objectives_text}

Write step-by-step instructions that:
- Clearly explain what the student needs to accomplish
- Break down the task into manageable steps
- Include any specific requirements or constraints
- Mention what they should focus on learning
- Are appropriate for the course difficulty level

Keep it practical and achievable. Return only the instructions text.
"""
    
    elif content_type == 'practical_evaluation_criteria':
        chapter_title = context.get('chapter_title', '')
        practical_instructions = context.get('practical_instructions', '')
        
        return f"""
Create evaluation criteria for AI assessment of a practical exercise.

Chapter: "{chapter_title}"
Exercise Instructions: "{practical_instructions}"
Current criteria: "{current_text}"

Write clear criteria that an AI should use to evaluate student code submissions. Include:
- Key functionality that must be present
- Code quality aspects to check
- Common mistakes to look for
- What constitutes a passing solution

Be specific but concise. This will guide AI evaluation of student work.
Return only the criteria text.
"""
    
    elif content_type == 'chapter_content':
        chapter_title = context.get('chapter_title', '')
        course_title = context.get('course_title', title)
        chapter_number = context.get('chapter_number', 1)
        course_difficulty = context.get('difficulty', difficulty)
        
        return f"""
Create comprehensive educational content for Chapter {chapter_number}: "{chapter_title}" in the course "{course_title}".

Course Level: {course_difficulty}
Current content: "{current_text}"

Generate engaging, educational content that includes:
- Clear explanations of key concepts
- Practical examples with code snippets where appropriate
- Step-by-step instructions or walkthroughs
- Important tips or best practices
- Interactive elements like "Try it yourself" sections

Structure the content with:
- Proper HTML headings (h2, h3)
- Well-formatted paragraphs
- Code blocks using <pre><code> tags
- Lists (ul/ol) for organized information
- Callout boxes using <blockquote> for important notes

Make it engaging and appropriate for {course_difficulty} level students.
Return only HTML content that can be directly inserted into a rich text editor.
"""
    
    return None

@app.route('/api/admin/courses', methods=['GET'])
def api_admin_get_courses():
    """Get all courses for admin"""
    if not is_admin_authenticated():
        return jsonify({'error': 'Unauthorized'}), 401
    
    courses = load_all_courses()
    return jsonify({'success': True, 'courses': courses})

@app.route('/api/admin/courses', methods=['POST'])
def api_admin_create_course():
    """Create new course"""
    if not is_admin_authenticated():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'slug', 'description']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'{field} is required'}), 400
        
        # Create course data (ID will be auto-generated by Supabase)
        course_data = {
            'title': data['title'],
            'slug': data['slug'],
            'subtitle': data.get('subtitle', ''),
            'description': data['description'],
            'difficulty': data.get('difficulty', 'beginner'),
            'estimated_duration': int(data.get('estimated_duration', 8)),
            'thumbnail': data.get('thumbnail', ''),
            'status': data.get('status', 'draft'),
            'featured': data.get('featured', False),
            'tags': data.get('tags', []),
            'prerequisites': data.get('prerequisites', ''),
            'chapter_count': 0,
            'created_date': datetime.now().strftime('%Y-%m-%d'),
            'updated_date': datetime.now().strftime('%Y-%m-%d')
        }
        
        # Save course
        success = save_course_data(course_data)
        
        if success:
            return jsonify({'success': True, 'course': course_data})
        else:
            return jsonify({'success': False, 'error': 'Failed to save course'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/courses/<int:course_id>', methods=['GET'])
def api_admin_get_course(course_id):
    """Get specific course for admin"""
    if not is_admin_authenticated():
        return jsonify({'error': 'Unauthorized'}), 401
    
    course = load_course_data(course_id)
    if not course:
        return jsonify({'success': False, 'error': 'Course not found'}), 404
    
    return jsonify({'success': True, 'course': course})

@app.route('/api/admin/courses/<int:course_id>', methods=['PUT'])
def api_admin_update_course(course_id):
    """Update existing course"""
    if not is_admin_authenticated():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.get_json()
        
        # Load existing course
        course = load_course_data(course_id)
        if not course:
            return jsonify({'success': False, 'error': 'Course not found'}), 404
        
        # Update course data
        course.update({
            'title': data['title'],
            'slug': data['slug'],
            'subtitle': data.get('subtitle', ''),
            'description': data['description'],
            'difficulty': data.get('difficulty', 'beginner'),
            'estimated_duration': int(data.get('estimated_duration', 8)),
            'thumbnail': data.get('thumbnail', ''),
            'status': data.get('status', 'draft'),
            'featured': data.get('featured', False),
            'tags': data.get('tags', []),
            'prerequisites': data.get('prerequisites', ''),
            'updated_date': datetime.now().strftime('%Y-%m-%d')
        })
        
        # Save course
        success = save_course_data(course)
        
        if success:
            return jsonify({'success': True, 'course': course})
        else:
            return jsonify({'success': False, 'error': 'Failed to update course'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/courses/<int:course_id>', methods=['DELETE'])
def api_admin_delete_course(course_id):
    """Delete course"""
    if not is_admin_authenticated():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        success = delete_course_data(course_id)
        
        if success:
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Failed to delete course'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/courses/<int:course_id>/chapters', methods=['GET'])
def api_admin_get_chapters(course_id):
    """Get chapters for course"""
    if not is_admin_authenticated():
        return jsonify({'error': 'Unauthorized'}), 401
    
    chapters = load_all_chapters(course_id)
    return jsonify({'success': True, 'chapters': chapters})

@app.route('/api/admin/courses/<int:course_id>/chapters', methods=['POST'])
def api_admin_create_chapter(course_id):
    """Create new chapter"""
    if not is_admin_authenticated():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.get_json()
        
        # Create chapter data (ID will be auto-generated by Supabase)
        chapter_data = {
            'course_id': course_id,
            'title': data['title'],
            'chapter_number': int(data.get('chapter_number', 1)),
            'estimated_duration': int(data.get('estimated_duration', 45)),
            'difficulty': data.get('difficulty', 'beginner'),
            'learning_objectives': data.get('learning_objectives', []),
            'content': data.get('content', ''),
            'has_test': data.get('has_test', False),
            'has_practical': data.get('has_practical', False),
            'test_questions': data.get('test_questions', []),
            'practical_instructions': data.get('practical_instructions', ''),
            'practical_starter_code': data.get('practical_starter_code', ''),
            'practical_evaluation_criteria': data.get('practical_evaluation_criteria', ''),
            'created_date': datetime.now().strftime('%Y-%m-%d'),
            'updated_date': datetime.now().strftime('%Y-%m-%d')
        }
        
        # Save chapter
        success = save_chapter_data(chapter_data)
        
        if success:
            # Update course chapter count
            update_course_chapter_count(course_id)
            return jsonify({'success': True, 'chapter': chapter_data})
        else:
            return jsonify({'success': False, 'error': 'Failed to save chapter'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/courses/<int:course_id>/chapters/<int:chapter_id>', methods=['PUT'])
def api_admin_update_chapter(course_id, chapter_id):
    """Update existing chapter"""
    if not is_admin_authenticated():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.get_json()
        
        # Load existing chapter
        chapter = load_chapter_data(course_id, chapter_id)
        if not chapter:
            return jsonify({'success': False, 'error': 'Chapter not found'}), 404
        
        # Update chapter data
        chapter.update({
            'title': data['title'],
            'chapter_number': int(data.get('chapter_number', 1)),
            'estimated_duration': int(data.get('estimated_duration', 45)),
            'difficulty': data.get('difficulty', 'beginner'),
            'learning_objectives': data.get('learning_objectives', []),
            'content': data.get('content', ''),
            'has_test': data.get('has_test', False),
            'has_practical': data.get('has_practical', False),
            'test_questions': data.get('test_questions', []),
            'practical_instructions': data.get('practical_instructions', ''),
            'practical_starter_code': data.get('practical_starter_code', ''),
            'practical_evaluation_criteria': data.get('practical_evaluation_criteria', ''),
            'updated_date': datetime.now().strftime('%Y-%m-%d')
        })
        
        # Save chapter
        success = save_chapter_data(chapter)
        
        if success:
            return jsonify({'success': True, 'chapter': chapter})
        else:
            return jsonify({'success': False, 'error': 'Failed to update chapter'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/courses/<int:course_id>/chapters/<int:chapter_id>', methods=['DELETE'])
def api_admin_delete_chapter(course_id, chapter_id):
    """Delete chapter"""
    if not is_admin_authenticated():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        success = delete_chapter_data(course_id, chapter_id)
        
        if success:
            # Update course chapter count
            update_course_chapter_count(course_id)
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Failed to delete chapter'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/courses/<int:course_id>/chapters/reorder', methods=['POST'])
def api_admin_reorder_chapters(course_id):
    """Reorder chapters"""
    if not is_admin_authenticated():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.get_json()
        chapter_order = data.get('chapter_order', [])
        
        success = reorder_chapters(course_id, chapter_order)
        
        if success:
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Failed to reorder chapters'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Admin Helper Functions

def is_admin_authenticated():
    """Check if admin is authenticated"""
    return session.get('admin_authenticated', False)

def get_admin_user():
    """Get admin user data"""
    return session.get('admin_user', {'name': 'Administrator'})

def generate_course_id():
    """Generate unique course ID - not needed for Supabase (auto-increment)"""
    # Supabase uses auto-increment, so we don't need to generate IDs
    return None

def generate_chapter_id(course_id):
    """Generate unique chapter ID - not needed for Supabase (auto-increment)"""
    # Supabase uses auto-increment, so we don't need to generate IDs
    return None

def save_course_data(course_data):
    """Save course data to Supabase"""
    try:
        if not supabase:
            raise Exception("Supabase not configured")
        
        print(f"DEBUG: Saving course data to Supabase: {course_data}")
        
        # Check if this is an update (has ID) or insert (no ID)
        if 'id' in course_data and course_data['id']:
            # Update existing course
            response = supabase.table('courses').update(course_data).eq('id', course_data['id']).execute()
        else:
            # Insert new course (remove None ID)
            if 'id' in course_data:
                del course_data['id']
            response = supabase.table('courses').insert(course_data).execute()
        
        if response.data:
            print(f"DEBUG: Course saved successfully: {response.data}")
            # Update the course_data with the returned data (including ID for new courses)
            if response.data and len(response.data) > 0:
                course_data.update(response.data[0])
            return True
        else:
            print(f"ERROR: Failed to save course: {response}")
            return False
            
    except Exception as e:
        print(f"Error saving course data to Supabase: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def save_chapter_data(chapter_data):
    """Save chapter data to Supabase"""
    try:
        if not supabase:
            raise Exception("Supabase not configured")
        
        print(f"DEBUG: Saving chapter data to Supabase: {chapter_data}")
        
        # Check if this is an update (has ID) or insert (no ID)
        if 'id' in chapter_data and chapter_data['id']:
            # Update existing chapter
            response = supabase.table('chapters').update(chapter_data).eq('id', chapter_data['id']).execute()
        else:
            # Insert new chapter (remove None ID)
            if 'id' in chapter_data:
                del chapter_data['id']
            response = supabase.table('chapters').insert(chapter_data).execute()
        
        if response.data:
            print(f"DEBUG: Chapter saved successfully: {response.data}")
            # Update the chapter_data with the returned data (including ID for new chapters)
            if response.data and len(response.data) > 0:
                chapter_data.update(response.data[0])
            return True
        else:
            print(f"ERROR: Failed to save chapter: {response}")
            return False
            
    except Exception as e:
        print(f"Error saving chapter data to Supabase: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

# Chapter content and test questions are now stored directly in the chapters table in Supabase
# No separate file storage needed

def delete_course_data(course_id):
    """Delete course and all related data from Supabase"""
    try:
        if not supabase:
            raise Exception("Supabase not configured")
        
        # Delete the course (this will cascade delete all chapters due to foreign key)
        response = supabase.table('courses').delete().eq('id', course_id).execute()
        
        if response.data is not None:  # Supabase returns None for successful deletes
            print(f"DEBUG: Course {course_id} deleted successfully")
            return True
        else:
            print(f"ERROR: Failed to delete course {course_id}")
            return False
            
    except Exception as e:
        print(f"Error deleting course data from Supabase: {str(e)}")
        return False

def delete_chapter_data(course_id, chapter_id):
    """Delete chapter data from Supabase"""
    try:
        if not supabase:
            raise Exception("Supabase not configured")
        
        # Delete the chapter
        response = supabase.table('chapters').delete().eq('id', chapter_id).execute()
        
        if response.data is not None:  # Supabase returns None for successful deletes
            print(f"DEBUG: Chapter {chapter_id} deleted successfully")
            return True
        else:
            print(f"ERROR: Failed to delete chapter {chapter_id}")
            return False
            
    except Exception as e:
        print(f"Error deleting chapter data from Supabase: {str(e)}")
        return False

def update_course_chapter_count(course_id):
    """Update chapter count for course - handled automatically by Supabase triggers"""
    # The chapter count is automatically updated by Supabase triggers
    # defined in admin_schema.sql, so we don't need to do anything here
    return True

def reorder_chapters(course_id, chapter_order):
    """Reorder chapters based on provided order in Supabase"""
    try:
        if not supabase:
            raise Exception("Supabase not configured")
        
        # Update chapter numbers based on order
        for i, chapter_id in enumerate(chapter_order):
            new_chapter_number = i + 1
            response = supabase.table('chapters').update({
                'chapter_number': new_chapter_number
            }).eq('id', chapter_id).execute()
            
            if not response.data:
                print(f"ERROR: Failed to update chapter {chapter_id} order")
                return False
        
        print(f"DEBUG: Chapters reordered successfully for course {course_id}")
        return True
    except Exception as e:
        print(f"Error reordering chapters in Supabase: {str(e)}")
        return False

if __name__ == '__main__':
    # Set Flask secret key for sessions
    app.secret_key = os.getenv('FLASK_SECRET_KEY', 'your-secret-key-change-in-production')
    app.run(debug=True)