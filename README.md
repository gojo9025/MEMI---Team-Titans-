# 🧠 Meme-to-Knowledge Engine (TITANS Framework)

A highly advanced, NotebookLM-style Gen-Z learning engine that natively converts boring academic documents (PDFs, PPTXs, DOCs) and Live Web Pages into highly engaging, dynamic meme formats and TikTok-ready Video Chapters.

This application runs **100% Locally & Offline**, powered by a localized instance of Ollama to bypass API tracking, internet requirements, and rate limits during demonstrations.

## ✨ Core Features

*   **📚 NotebookLM-Style Architecture**: Clean "Sources Sidebar" where you can actively bulk upload multiple PDFs, PowerPoints, DOCX files, TXTs, or Images into an active conversational context!
*   **🌐 Live Knowledge Scraper**: Just paste a URL directly into the knowledge base. A custom Cheerio-powered backend connects to the web, strips out ads, extracts the core content body, and injects it into Ollama's active virtual context.
*   **📱 Native TikTok/StudyTok Exporter**: Instantly distill massive articles or syllabuses into a feed of multiple sequential memes ("StudyTok Chapters"), and click Export to watch the app render a fully animated 1080p WebM/MP4 `.mp4` camera-panning reel natively inside the browser via the Canvas API!
*   **🌍 Multilingual Native Output**: Generate contextual memes fully translated into Hindi, Tamil, Telugu, Spanish, French, natively by the LLM (without third-party translate services).
*   **🎭 Custom Template Integration**: Readily maps text onto 30+ custom local templates, complete with dynamic coordinate text-wrapping mathematical bounding logic that shrinks text if it overflows perfectly! Includes support for Animated GIF Overlays.

---

## 🚀 Setup Instructions

### 1. Requirements
*   **Node.js 18+**
*   **Ollama Installed locally**

### 2. Local AI Configuration
Because this engine relies on a local language model keeping everything completely private, you must first ensure Ollama is running.

1. Open your terminal and install the specific model required to match the configured prompting framework:
   ```bash
   ollama run qwen3:8b
   ```
2. Leave the Ollama application running silently in the background (or system tray). Next.js requires it listening on `http://127.0.0.1:11434`.

### 3. Running the App
1. Clone this repository.
2. Install the necessary Next.js packages:
   ```bash
   npm install
   ```
3. Start the Turbopack dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) with your browser to experience the engine!

---

## 💻 Tech Stack
- Frontend: `Next.js 14`, `React`, `HTML Canvas API`, `MediaRecorder API`
- Backend: `Next.js App Server`, `Cheerio` (Web Scraping) 
- Parser Pipeline: `pdf-parse`, `mammoth`, `officeparser`
- AI/Inference Engine: `Ollama Native (qwen3:8b)`

*A game-changing architecture blending educational content absorption with Gen-Z consumption speeds.*
