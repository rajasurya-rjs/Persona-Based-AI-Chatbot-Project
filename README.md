# Persona-Based AI Chatbot (Scaler Assignment 01)

A working persona-based AI chatbot that lets users have real conversations with three Scaler/InterviewBit personalities. Every concept taught in prompt engineering is applied inside this single application.

**This is not a theoretical exercise.** Real system prompts are written, a real LLM API is called, and a working product is shipped.

---

## Live Links
- **Frontend (Vercel):** https://persona-based-ai-chatbot-project.vercel.app/
- **Backend (Render):**  https://persona-based-ai-chatbot-project.onrender.com

---

## Assignment Overview

### The Three Personas
The chatbot maintains three separate, well-researched system prompts for:

1. **Anshuman Singh** — Co-founder of Scaler Academy, instructor, and DSA expert
2. **Abhimanyu Saxena** — Co-founder of InterviewBit, product builder, and problem solver
3. **Kshitij Mishra** — Teaching lead, mentor, and educator at Scaler

Each persona is based on extensive research — watching talks, reading LinkedIn posts, and studying their communication style to ensure authenticity.

---

## Features

✅ **Persona Switcher** — Three distinct personalities available as tabs/buttons  
✅ **Conversation Reset** — Switching personas automatically clears chat history  
✅ **Active Persona Display** — Always visible in the UI  
✅ **Suggestion Chips** — Persona-specific quick-start questions  
✅ **Typing Indicator** — Real-time feedback while API processes response  
✅ **Error Handling** — Graceful failures with user-friendly retry options  
✅ **Responsive Design** — Works seamlessly on mobile and desktop  
✅ **Real LLM Integration** — GitHub Models API (models.github.ai)

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | React + Vite (JavaScript) |
| **Backend** | Node.js + Express (JavaScript) |
| **LLM Integration** | GitHub Models REST API |
| **Frontend Deployment** | Vercel |
| **Backend Deployment** | Render |

---

## Project Structure

```text
.
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx          # Main chat UI component
│   │   ├── App.css          # Styling
│   │   ├── api/
│   │   │   └── chat.js      # Frontend API client
│   │   ├── personas.js      # Persona configuration
│   │   └── main.jsx         # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                  # Express backend
│   ├── src/
│   │   ├── app.js           # Express app setup
│   │   ├── index.js         # Server entry point
│   │   ├── llmClient.js     # GitHub Models API client
│   │   ├── personas.js      # System prompts & persona logic
│   │   └── test/
│   │       └── chat.test.js # Backend tests
│   ├── package.json
│   └── render.yaml          # Render deployment config
│
├── docs/
│   └── screenshots/         # UI screenshots
│
├── prompts.md               # All three system prompts with annotations
├── reflection.md            # 300–500 word reflection
├── .env.example             # Environment variable template
├── README.md                # This file
└── package.json             # Root package (npm run install:all, npm run dev)
```

---

## System Prompt Requirements

Each persona's system prompt includes:

1. **Persona Description** — Background, values, communication style (researched and authentic)
2. **Few-Shot Examples** — Minimum 3 Q&A examples embedded in the prompt to guide behavior
3. **Chain-of-Thought Instruction** — Explicit instruction to reason step-by-step internally
4. **Output Format** — Specified length, style, and structure (e.g., 4–5 sentences, end with a question)
5. **Constraints** — Clear guidance on what the persona should NOT do

All three prompts are documented in [prompts.md](prompts.md) with inline comments explaining design decisions.

---

## Environment Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- GitHub Personal Access Token (with `models` scope for GitHub Models API)

### Steps

1. **Clone and install:**
   ```bash
   git clone <repo-url>
   cd Persona-Based-AI-Chatbot-Project
   npm run install:all
   ```

2. **Set up environment variables:**
   ```bash
   cp server/.env.example server/.env
   ```

3. **Configure `.env` in server folder:**
   ```bash
   GITHUB_TOKEN=your_github_pat_with_models_scope
   LLM_API_KEY=
   LLM_BASE_URL=https://models.github.ai/inference
   LLM_MODEL=openai/gpt-4.1
   GITHUB_API_VERSION=2022-11-28
   PORT=8080
   CORS_ORIGIN=http://localhost:5173
   ```

   **Notes:**
   - `GITHUB_TOKEN` is used by default for model calls; `LLM_API_KEY` is optional
   - For fine-grained PATs, ensure `models: read` access is enabled
   - **Never commit real tokens** — use `.env` and `.gitignore`

4. **(Optional) Frontend API Base URL:**
   ```bash
   # Create client/.env if backend is on a different URL
   VITE_API_BASE_URL=http://localhost:8080
   ```

---

## Local Development

### Run Everything
```bash
npm run install:all  # Install all dependencies
npm run dev          # Start both frontend and backend
```

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:8080

### Run Individually
```bash
# Terminal 1: Backend
cd server
npm install
npm run start

# Terminal 2: Frontend
cd client
npm install
npm run dev
```

---

## API Contract

### POST `/api/chat`

**Request body:**
```json
{
  "personaId": "anshuman",
  "message": "How do I stay consistent in DSA prep?",
  "history": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello!" }
  ]
}
```

**Success response (200):**
```json
{
  "reply": "Here's how I approach consistency...",
  "personaId": "anshuman"
}
```

**Error response (500):**
```json
{
  "error": "The AI service is unavailable right now. Please retry in a moment.",
  "code": "UPSTREAM_HTTP_ERROR"
}
```

---

## Testing

Run the test suite:
```bash
npm run test
```

**Coverage includes:**
- Backend contract checks (valid request, invalid persona, missing message, upstream error)
- Frontend behavior checks (active persona, reset on switch, typing indicator, graceful error + retry)

---

## Deployment

### Backend (Render)
1. Create a new **Web Service** from this GitHub repo
2. Set **Root Directory** to `server`
3. **Build command:** `npm install`
4. **Start command:** `npm run start`
5. **Environment variables:**
   - `GITHUB_TOKEN`
   - `LLM_BASE_URL`
   - `LLM_MODEL`
   - `GITHUB_API_VERSION`
   - `CORS_ORIGIN` (set to your Vercel frontend URL)

### Frontend (Vercel)
1. Import the GitHub repo
2. Set **Root Directory** to `client`
3. **Framework preset:** Vite
4. **Environment variables:**
   - `VITE_API_BASE_URL=<your-render-backend-url>`
5. Deploy

---

## Screenshots

- Desktop: [docs/screenshots/desktop.png](docs/screenshots/desktop.png)
- Mobile: [docs/screenshots/mobile.png](docs/screenshots/mobile.png)

---

## Submission Checklist

- [x] GitHub repo is public
- [x] README.md with clear setup instructions
- [x] prompts.md with all three system prompts + inline comments
- [x] reflection.md (300–500 words)
- [x] .env.example present; no real API keys committed
- [x] App deployed and live
- [x] All three personas working in production
- [x] Persona switching resets conversation
- [x] API errors handled gracefully
- [x] UI is mobile-responsive
- [x] Typing indicator present
- [x] Suggestion chips per persona
- [x] Live URLs added

---

## Implementation Highlights

✨ **Deep Research & Authenticity** — Each persona is based on extensive research of real communication styles, values, and expertise. System prompts include 3+ few-shot examples, explicit chain-of-thought reasoning, and specific output constraints.

✨ **Production-Ready Backend** — GitHub Models API integration with proper error handling, environment-based configuration, and CORS support for cross-origin requests.

✨ **Responsive Frontend** — React + Vite with real-time typing indicators, persona-specific suggestion chips, graceful error recovery with retry, and mobile-first design.

✨ **Conversation Management** — Automatic chat history reset on persona switch, maintaining separate conversation contexts per persona.

✨ **Security Best Practices** — All API keys stored in environment variables; no credentials committed to repository; `.env.example` provided as safe template.

---

## Documentation

- **[prompts.md](prompts.md)** — All three system prompts with detailed annotations explaining design decisions, few-shot examples, CoT reasoning, output constraints, and limitations
- **[reflection.md](reflection.md)** — 300–500 word reflection on the process, what worked, what the GIGO principle taught, and what you would improve

---

## Support & Resources

- [GitHub Models API Docs](https://docs.github.com/en/github-models)
- [Prompt Engineering Best Practices](https://platform.openai.com/docs/guides/prompt-engineering)
- [System Prompt Design Guide](https://platform.openai.com/docs/guides/system-prompt)

---
