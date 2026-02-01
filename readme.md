# **NeuroStudy \- Open Source AI Study Companion**

NeuroStudy is a React-based application that uses Google's Gemini AI to generate study guides, flashcards, and quizzes from your notes.

## **🚀 Deployment Guide**

### **Prerequisites**

1. **Node.js 18+** (for local development)  
2. **Docker & Docker Compose** (for deployment)  
3. **Google Gemini API Key**

### **🔑 Getting a Gemini API Key**

1. Go to [Google AI Studio](https://aistudio.google.com/).  
2. Click **"Get API key"**.  
3. Create a key in a new or existing Google Cloud project.  
4. **Security Warning:** Do not commit this key to GitHub.

### **🛠️ Setting up the Project (Scaffolding)**

Since neuro\_study\_app.jsx is a single-file component, you need to scaffold a React environment around it.

1. **Initialize Vite Project:**  
   npm create vite@latest neurostudy \-- \--template react  
   cd neurostudy  
   npm install lucide-react \# Install required icon library

2. **Install the App:**  
   * Delete src/App.jsx and src/App.css.  
   * Place neuro\_study\_app.jsx in src/.  
   * Rename it to src/App.jsx.  
3. **Important: Enable Runtime Config**  
   * Edit your index.html file in the root directory.  
   * Add this script tag inside the \<head\> section, *before* the main script:

\<script src="/env-config.js"\>\</script\>  
*(Note: This file doesn't exist yet; it is generated automatically by Docker at runtime).*

### **🐳 Docker Deployment**

1. **Add Configuration Files:**  
   Place the Dockerfile, docker-compose.yml, and entrypoint.sh files provided in this repository into the root of your project folder.  
2. **Run with Docker Compose:**  
   You can pass your API key directly via the command line or use a .env file.  
   **Option A: Command Line (One-off)**  
   export GEMINI\_API\_KEY="your\_actual\_api\_key\_here"  
   docker-compose up \-d \--build

   **Option B: Using .env (Recommended)**  
   Create a file named .env in the root:  
   GEMINI\_API\_KEY=your\_actual\_api\_key\_here

   Then run:  
   docker-compose up \-d \--build

3. **Access the App:**  
   Open your browser to http://localhost:5105.

### **🔄 Updating from GitHub**

To update your deployment with the latest code:  
\# 1\. Pull changes  
git pull origin main

\# 2\. Rebuild the container  
docker-compose up \-d \--build

### **🛡️ Security Note**

This application is a **Client-Side SPA (Single Page Application)**.  
Even though we inject the API key via environment variables to keep it out of the source code, the key is technically visible in the browser's network tab to any user who has access to the app.

* **For Personal Use:** This is acceptable.  
* **For Public Hosting:** Do not host this publicly without adding backend authentication/proxy, or malicious users could use your API quota.