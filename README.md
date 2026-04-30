# Persona-Based AI Chatbot (Scaler Assignment 01)

A working persona chatbot where users can chat with three Scaler/InterviewBit personalities:
- Anshuman Singh
- Abhimanyu Saxena
- Kshitij Mishra

The app uses persona-specific system prompts, GitHub Models API on the backend, and a responsive chat UI.

## Live Links
- Frontend (Vercel): `ADD_YOUR_VERCEL_URL_HERE`
- Backend (Render): `ADD_YOUR_RENDER_URL_HERE`

## Features
- Persona switcher with 3 distinct personalities
- Active persona clearly visible in the UI
- Conversation resets when persona changes
- Persona-specific quick-start suggestion chips
- Typing indicator while API response is pending
- Graceful API failure handling with retry option
- Mobile + desktop responsive layout

## Tech Stack
- Frontend: React + Vite (JavaScript)
- Backend: Node.js + Express (JavaScript)
- LLM Integration: GitHub Models REST inference endpoint (`models.github.ai`)
- Deployment target: Vercel (frontend) + Render (backend)

## Project Structure
```text
.
├── client/                  # React frontend
├── server/                  # Express backend
├── docs/screenshots/        # Screenshot assets/placeholders
├── prompts.md               # Annotated system prompts
├── reflection.md            # 300–500 word reflection
├── .env.example             # Environment variable template
└── render.yaml              # Render deployment blueprint
```

## Environment Setup
Copy `.env.example` to `.env` (inside `server/` or root depending on your run setup) and set values:

```bash
GITHUB_TOKEN=your_github_pat_with_models_scope
LLM_API_KEY=
LLM_BASE_URL=https://models.github.ai/inference
LLM_MODEL=openai/gpt-4.1
GITHUB_API_VERSION=2022-11-28
PORT=8080
CORS_ORIGIN=http://localhost:5173
```

Notes:
- `GITHUB_TOKEN` is used by default for model calls. `LLM_API_KEY` is an optional override.
- For fine-grained PATs, ensure `models: read` access.
- Never commit real tokens.

For frontend API URL (optional), create `client/.env`:
```bash
VITE_API_BASE_URL=http://localhost:8080
```

## Local Development
From repo root:

```bash
npm run install:all
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

## API Contract
### `POST /api/chat`
Request body:
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

Success response:
```json
{
  "reply": "...",
  "personaId": "anshuman"
}
```

Error response:
```json
{
  "error": "The AI service is unavailable right now. Please retry in a moment.",
  "code": "UPSTREAM_HTTP_ERROR"
}
```

## Testing
```bash
npm run test
```

Coverage includes:
- Backend contract checks (valid request, invalid persona, missing message, upstream error path)
- Frontend behavior checks (active persona, switch reset, typing indicator, graceful error + retry)

## Deployment Notes
### Backend (Render)
1. Create a new Web Service from this repo.
2. Set `rootDir = server`.
3. Build command: `npm install`
4. Start command: `npm run start`
5. Add env vars (`GITHUB_TOKEN`, `LLM_BASE_URL`, `LLM_MODEL`, `GITHUB_API_VERSION`, `CORS_ORIGIN`).

### Frontend (Vercel)
1. Import repo and set root directory to `client`.
2. Framework preset: Vite.
3. Add environment variable: `VITE_API_BASE_URL=<your-render-backend-url>`.
4. Deploy.

## Screenshots
- Desktop placeholder: [docs/screenshots/chat-desktop.svg](docs/screenshots/chat-desktop.svg)
- Mobile placeholder: [docs/screenshots/chat-mobile.svg](docs/screenshots/chat-mobile.svg)

Replace these placeholders with real screenshots from your deployed app before final submission.

## Submission Checklist Mapping
- [x] Public repo structure with setup docs
- [x] `.env.example` present and key-safe
- [x] `prompts.md` with annotated prompts
- [x] `reflection.md` (300–500 words)
- [x] Persona switching resets conversation
- [x] API error handling implemented
- [x] Responsive UI + typing indicator + suggestion chips
- [ ] Live URLs added after deployment
