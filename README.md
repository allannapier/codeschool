# Code Tutor

An AI-powered code learning platform that helps users improve their programming skills through intelligent feedback and explanations.

## Features

- Support for Python and JavaScript
- Three skill levels: Beginner, Intermediate, Advanced
- AI-powered code analysis and explanations
- Monaco Editor for code editing
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

1. Select your programming language (Python or JavaScript)
2. Choose your skill level
3. Write or paste your code in the Monaco editor
4. Click "Analyze Code" for feedback and suggestions
5. Click "Explain Code" for step-by-step explanations

## Keyboard Shortcuts

- `Ctrl/Cmd + Enter`: Analyze code
- `Ctrl/Cmd + E`: Explain code

## Tech Stack

- **Backend**: Flask (Python)
- **Frontend**: Vanilla JavaScript, HTML/CSS
- **Code Editor**: Monaco Editor
- **AI**: OpenAI API (GPT-3.5)
- **Hosting**: Vercel

## License

MIT