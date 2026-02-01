NeuroStudy - Open Source AI Study CompanionNeuroStudy is a React-based application that uses Google's Gemini AI to generate study guides, flashcards, and quizzes from your notes.🚀 Deployment GuidePrerequisitesNode.js 18+ (for local development)Docker & Docker Compose (for deployment)Google Gemini API Key🔑 Getting a Gemini API KeyGo to Google AI Studio.Click "Get API key".Create a key in a new or existing Google Cloud project.Security Warning: Do not commit this key to GitHub.🛠️ Setting up the Project (Scaffolding)Since neuro_study_app.jsx is a single-file component, you need to scaffold a React environment around it.Initialize Vite Project:npm create vite@latest neurostudy -- --template react
cd neurostudy
npm install lucide-react # Install required icon library
Install the App:Delete src/App.jsx and src/App.css.Place neuro_study_app.jsx in src/.Rename it to src/App.jsx.Important: Enable Runtime ConfigEdit your index.html file in the root directory.Add this script tag inside the <head> section, before the main script:<script src="/env-config.js"></script>
(Note: This file doesn't exist yet; it is generated automatically by Docker at runtime).🐳 Docker DeploymentAdd Configuration Files:Place the Dockerfile, docker-compose.yml, and entrypoint.sh files provided in this repository into the root of your project folder.Run with Docker Compose:You can pass your API key directly via the command line or use a .env file.Option A: Command Line (One-off)export GEMINI_API_KEY="your_actual_api_key_here"
docker-compose up -d --build
Option B: Using .env (Recommended)Create a file named .env in the root:GEMINI_API_KEY=your_actual_api_key_here
Then run:docker-compose up -d --build
Access the App:Open your browser to http://localhost:5105.🔄 Updating from GitHubTo update your deployment with the latest code:# 1. Pull changes
git pull origin main

# 2. Rebuild the container
docker-compose up -d --build
🛡️ Security NoteThis application is a Client-Side SPA (Single Page Application).Even though we inject the API key via environment variables to keep it out of the source code, the key is technically visible in the browser's network tab to any user who has access to the app.For Personal Use: This is acceptable.For Public Hosting: Do not host this publicly without adding backend authentication/proxy, or malicious users could use your API quota.