# AI Resume Analyser 🚀

An AI-powered interview preparation platform. Upload your resume and a job description to get an explainable match score, your skill gaps, likely interview questions and a preparation plan. Then practise with an **AI mock interviewer** that grades your typed or spoken answers, follow personalised learning roadmaps for missing skills, and learn from interview experiences shared by the community.

Built with the **MERN stack** and **Google Gemini**, with automated tests (Jest) and AI-output evaluation (DeepEval).

---

## ✨ Features

### 📄 Resume ↔ Job Description Analysis
- Upload your **resume as a PDF** (max 3 MB) and/or write a short self-description.
- **Paste the job description** or **upload it as a PDF**.
- **Explainable match score.** The score comes from a weighted skill-matching engine rather than a black-box AI guess:
  - A catalogue of **68 skills**, each with aliases (for example `node`, `nodejs` and `node.js` all count as Node.js).
  - The job description is split into *required* and *preferred* sections. Required skills carry more weight.
  - The score is the share of weighted required skills that your resume covers.
- **Evidence checklist.** For every skill, the report shows whether it was found, with the matching line from your resume, or the line from the job description that asks for it.
- **Skill gaps** ranked by severity (high, medium, low).

### 🤖 AI Interview Report (Gemini)
- Likely **technical questions** and **behavioral questions**. Each one includes the interviewer's intention and a recommended answer.
- A **day-by-day preparation plan** for the role.
- A **fallback report** is generated if Gemini is not configured or fails, so the app keeps working.

### 🎙️ AI Mock Interview
Practise a real interview using the questions from your report.
- Choose **Mixed, Technical or Behavioral**, **3, 5, 8 or 10 questions**, and an optional **timer per question** (1, 2 or 3 minutes).
- The AI interviewer asks **one question at a time**. You can:
  - **type your answer**, or
  - **speak it**: voice is turned into editable text using the browser's Web Speech API (Chrome and Edge).
- Questions can be **read aloud** by the interviewer (text-to-speech).
- Every answer is **graded from 0 to 10** on four criteria: **relevance, depth, structure (STAR for behavioral questions) and communication**. You also get:
  - written feedback,
  - an improved version of your answer,
  - the points a strong answer should cover.
- If an answer is vague, the interviewer asks a **follow-up question** (up to 2 per session).
- At the end, a **scorecard** shows your overall score, strengths, improvement areas and weak skills. Each weak skill links to a learning roadmap. The time taken per answer is also shown.
- **Attempt history** for each report, and unfinished sessions can be resumed.
- Spoken answers are not penalised for missing punctuation. The model answer stays hidden until you have answered. If Gemini is unavailable, a rule-based grader is used instead.

### 🗺️ Skill-Gap Learning Roadmaps
- Generate a **Gemini-built roadmap for any missing skill**. It contains ordered topics, estimated hours and learning resources (documentation, articles, videos).
- Tasks are scheduled across your chosen **duration and daily study hours**.
- **Track progress**: mark tasks as done, log the time you spend, and see overall progress.
- **Regenerate**, rename or delete roadmaps.

### 📈 Resume Versions & Report History
- **Re-upload an improved resume** against the same job description. Every version is kept, and the report shows how your match score changed (for example `v1 55% → v3 82%`).
- A saved **report history** with pagination, plus rename and delete. Deleting a report also removes its roadmaps.

### 🌐 Community Interview Experiences
- Share your interview experience for a company and role.
- **Gemini structures each post** into rounds, and labels every item as a question, activity or statement with topic tags. The prompt tells it not to invent or remove information, and an *integrity summary* is stored with each post.
- Browse the community feed (with pagination) and open individual posts. Browsing is public; posting requires an account.

### 🔐 Authentication
- Register and log in with email and password. Passwords are hashed with **bcrypt**.
- **JWT stored in an HTTP-only cookie**, valid for 1 day.
- **Logout with token blacklisting**, and protected API and frontend routes.
- Every report, mock interview and roadmap can only be accessed by its owner.

---

## 🚧 Current Limitations

These are partly built or planned, and are **not** available in the UI yet:

| Item | Status |
|---|---|
| Tailored resume PDF | A backend endpoint generates it with Puppeteer (`POST /api/interview/resume/pdf/:id`), but there is no download button in the UI yet. |
| Google sign-in | Backend OAuth routes exist, but the button on the login page is disabled. The backend still requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to start. |
| Community posts | Posts cannot yet be edited, deleted, reported or moderated. |
| API hardening | No rate limiting, security headers (Helmet) or central request validation yet. |
| Tests | Backend tests connect to the configured MongoDB, so use a separate test database. |

---

## 🏗️ Architecture

```text
┌────────────────────────┐        REST (JSON, cookies)        ┌──────────────────────────┐
│  React + Vite frontend │ ─────────────────────────────────▶ │  Node.js + Express API   │
│  Web Speech API (voice)│                                    │                          │
└────────────────────────┘                                    │  • Skill-matching engine │
                                                              │  • Mock interview engine │
                                                              │  • Roadmap scheduler     │
                                                              └─────┬──────────┬─────────┘
                                                                    │          │
                                                          ┌─────────▼──┐   ┌───▼──────────────┐
                                                          │  MongoDB   │   │  Google Gemini   │
                                                          │ (Mongoose) │   │ (structured JSON)│
                                                          └────────────┘   └──────────────────┘
```

All Gemini calls use **structured JSON output** validated with **Zod**. AI features fall back to rule-based logic where possible.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite, React Router, Axios, SCSS, lucide-react, Web Speech API |
| Backend | Node.js, Express 5, Multer, pdf-parse, Passport, JSON Web Tokens, bcrypt |
| Database | MongoDB, Mongoose |
| AI | Google Gemini (`@google/genai`), Zod schemas |
| PDF | Puppeteer |
| Testing | Jest, Supertest |
| AI evaluation | Python, DeepEval (G-Eval metrics) |
| Deployment | Vercel (frontend) |

---

## 📂 Project Structure

```text
AI-Resume-analyser/
├── Backend/
│   ├── server.js
│   ├── scripts/                 # maintenance scripts (e.g. re-score old reports)
│   ├── src/
│   │   ├── app.js               # Express app and route mounting
│   │   ├── config/              # database, passport
│   │   ├── controllers/         # auth, interview, mock-interview, roadmap, experience
│   │   ├── middlewares/         # auth (JWT), file upload (PDF only)
│   │   ├── models/              # Mongoose schemas
│   │   ├── routes/
│   │   └── services/            # ai, skill-matching, mock-interview, roadmap
│   └── test/                    # Jest test suites
├── Frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/            # login, register, auth context
│   │   │   ├── interview/       # home, report, mock interview, roadmaps
│   │   │   └── experiences/     # community feed
│   │   ├── Layout/
│   │   └── app.routes.jsx
│   ├── vercel.json
│   └── vite.config.js
├── Evaluation/
│   ├── dataset/                 # test_case.json, test_resume.pdf
│   ├── metrics/                 # DeepEval metric scripts
│   └── test_resume_anslyser.py
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 20 or newer
- A MongoDB connection string (local MongoDB or Atlas)
- A Google Gemini API key (optional, but needed for AI questions, roadmaps and AI grading)
- Google OAuth client credentials. The backend will not start without them, even though the Google sign-in button is disabled.

### 1. Clone and install

```bash
git clone https://github.com/Anushka-coder1/AI-Resume-analyser.git
cd AI-Resume-analyser

cd Backend && npm install
cd ../Frontend && npm install
```

> **Puppeteer install error** ("Failed to set up chrome … executable is missing")? A previous browser download was interrupted. Delete `%USERPROFILE%\.cache\puppeteer\chrome` (or `~/.cache/puppeteer/chrome` on Mac and Linux) and run `npm install` again.

### 2. Environment variables

**`Backend/.env`**

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=a_long_random_secret
GOOGLE_GENAI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

**`Frontend/.env`**

```env
VITE_BACKEND_URL=http://localhost:3000
```

> Never commit `.env` files. `FRONTEND_URL` must exactly match the address the frontend runs on, otherwise the browser blocks requests (CORS).

### 3. Run

```bash
# terminal 1
cd Backend
npm run dev          # http://localhost:3000

# terminal 2
cd Frontend
npm run dev          # http://localhost:5173
```

The frontend is pinned to port **5173**. If another app is already using that port, Vite stops with an error instead of switching ports. Stop the other app and try again.

For voice answers in the mock interview, use **Chrome or Edge** and allow microphone access. Browsers only allow the microphone on `localhost` or HTTPS.

---

## 🔌 API Overview

All routes are under `/api`. 🔒 means the route needs a logged-in user (JWT cookie).

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, 🔒 `GET /auth/get-me` |
| Reports | 🔒 `POST /interview` (multipart: `resume`, `jobDescriptionFile`), 🔒 `GET /interview`, 🔒 `GET/PATCH/DELETE /interview/report/:id`, 🔒 `GET /interview/report/:id/versions`, 🔒 `POST /interview/resume/pdf/:id` |
| Mock interview | 🔒 `POST /mock-interview/start/:reportId`, 🔒 `POST /mock-interview/:id/answer`, 🔒 `POST /mock-interview/:id/finish`, 🔒 `GET/DELETE /mock-interview/:id`, 🔒 `GET /mock-interview/report/:reportId` |
| Roadmaps | 🔒 `POST /roadmaps/generate`, 🔒 `GET /roadmaps`, 🔒 `GET/PATCH/DELETE /roadmaps/:id`, 🔒 `GET /roadmaps/:id/progress`, 🔒 `PATCH /roadmaps/:id/tasks/:taskId`, 🔒 `PATCH /roadmaps/:id/tasks/:taskId/time`, 🔒 `POST /roadmaps/:id/regenerate` |
| Community | `GET /experiences`, `GET /experiences/:id`, 🔒 `POST /experiences` |

---

## 🧪 Testing

```bash
cd Backend
npm test
```

| Suite | What it covers |
|---|---|
| `test/auth/*` | Register, login, logout, get-me |
| `test/app.test.js`, `test/basic.test.js` | App setup and basic routes |
| `test/skill-matching.test.js` | Skill detection, required vs preferred weighting, match score |
| `test/roadmap.service.test.js` | Topic ordering and roadmap scheduling |
| `test/mock-interview.service.test.js` | Question selection, offline grading (including voice transcripts), scoring, timers, hiding answers |

The test setup connects to the MongoDB in `MONGO_URI`, so point it at a test database. The logic-only suites can run without a database:

```bash
npx jest test/mock-interview.service.test.js --config '{"testEnvironment":"node"}'
```

---

## 📊 AI Evaluation (DeepEval)

The `Evaluation/` folder scores the quality of the AI-generated report with DeepEval **G-Eval** metrics:

- match score
- skill gaps
- technical questions
- behavioral questions
- preparation plan
- hallucination

The scripts call the **running backend** with the sample resume in `Evaluation/dataset/`.

```bash
cd Evaluation
python -m venv .venv
.venv\Scripts\activate            # Mac/Linux: source .venv/bin/activate
pip install deepeval requests

# backend must be running on http://localhost:3000
set AUTH_TOKEN=<your JWT cookie value>        # Mac/Linux: export AUTH_TOKEN=...
python metrics/test_match_score.py
```

G-Eval uses an LLM as the judge, so configure DeepEval's model first (by default it needs an OpenAI API key).

---

## 🔒 Security Notes

- Passwords are hashed with bcrypt, and JWTs are stored in HTTP-only cookies (`secure` and `sameSite=none` in production).
- Logged-out tokens are blacklisted.
- Every read and write of reports, mock interviews and roadmaps checks that the logged-in user owns it.
- Uploads are limited to PDF files of at most 3 MB.
- User answers are passed to the AI as data inside clearly marked tags, and the prompt tells the model to ignore any instructions inside them.
- Secrets are read from environment variables.

---

## 🚀 Roadmap

- Download button for the tailored resume PDF
- Re-enable Google sign-in
- Company insights from community posts (most-asked topics per company and role)
- Score-progress chart across mock interview attempts
- Rate limiting, Helmet and request validation
- Isolated test database (in-memory MongoDB)

---

## 👩‍💻 Author

**Anushka**
Master of Computer Applications (MCA), National Institute of Technology, Jamshedpur

---

## 📄 License

This project is intended for educational and portfolio purposes. Add an open-source license (for example MIT) before distributing it publicly.
