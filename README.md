# Language Tutor

An AI-powered language learning platform that helps users improve their language skills through natural conversation and intelligent feedback.

## Features

- Support for 7 languages: Spanish, French, German, Italian, Portuguese, Mandarin Chinese, Japanese
- Three proficiency levels: Beginner (A1-A2), Intermediate (B1-B2), Advanced (C1-C2)
- Two learning modes: Free Conversation and Structured Lessons
- Real-time grammar and vocabulary feedback
- Personalized learning goals with progress tracking
- Session tracking with time and message counts
- No user accounts required - anonymous usage

## Setup

1. Clone the repository
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Copy the environment file and add your OpenAI API key:
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```

4. Run the development server:
   ```bash
   python app.py
   ```

5. Open http://localhost:5000 in your browser

## Deployment

### Vercel
1. Connect your GitHub repository to Vercel
2. Set the `OPENAI_API_KEY` environment variable in the Vercel dashboard
3. Deploy automatically on push to main branch

## Usage

1. Select your target language (Spanish, French, German, etc.)
2. Choose your proficiency level
3. Select learning mode (Free Conversation or Structured Lesson)
4. Start chatting with your AI tutor in the target language
5. Get real-time feedback on grammar and vocabulary
6. Track your progress with personalized learning goals
7. Use "Need Help?" button for conversation assistance

## Keyboard Shortcuts

- `Enter`: Send message
- `Shift + Enter`: New line in message

## Tech Stack

- **Backend**: Flask (Python)
- **Frontend**: Vanilla JavaScript, HTML/CSS
- **AI**: OpenAI API (GPT-3.5-Turbo-Instruct)
- **Hosting**: Vercel
- **Real-time Features**: Session tracking, progress monitoring
- **Responsive Design**: Mobile-friendly interface

## License

MIT