# AI Resume Analyser

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

AI Resume Analyser is a full-stack career-preparation application. A signed-in user can compare a PDF resume or written profile against a target job description, receive a deterministic skill-match score and an AI-assisted interview-preparation report, track resume versions, and create learning roadmaps for identified skill gaps. It also includes a community feed where users can share interview experiences that are organized into rounds and topic tags.

## Project overview

The application pairs a React/Vite client with an Express/MongoDB API. Resume and job-description PDFs are parsed in memory; extracted text is persisted with the resulting report. The match score is calculated locally from a curated skill catalogue, while Google Gemini is used when configured to produce tailored interview questions, preparation content, resume PDFs, roadmaps, and structured community posts. Several AI workflows provide code-defined fallback output when the Google API key is not configured or an AI request fails.

> The application analyses only the material supplied by the user. AI output is guidance, not a hiring decision or a guarantee of interview outcomes.

## Key features

- **Resume-to-job matching:** accepts a resume PDF and/or a self-description together with a pasted or PDF job description. The server extracts PDF text and calculates a weighted match score, requirement evidence, and missing-skill severity.
- **Interview-preparation report:** saves role-specific technical questions, behavioral questions, skill gaps, and a day-by-day preparation plan. Reports can be renamed, deleted, and listed with cursor pagination.
- **Resume iteration history:** re-uploading a resume against an existing report preserves the original job description and creates a numbered version in the same resume group.
- **Tailored PDF resume:** generates an A4 resume PDF using only stored resume/profile facts and the target job description.
- **Learning roadmaps:** generates per-skill or report-based schedules, exposes study resources when catalogued content exists, records task status and hours, calculates progress, and supports metadata edits, regeneration, and deletion.
- **Community interview experiences:** authenticated users can publish a company, role, and written experience. Anyone who can access the app can browse the feed and individual posts; the server optionally organizes the original content into interview rounds and tags without presenting those tags as new facts.
- **Cookie-based authentication:** supports local username/password registration and Google OAuth. JWTs are held in HTTP-only cookies; logged-out tokens are stored in a blacklist.

## Tech stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, React Router, Vite, Axios, Sass, Lucide React |
| Backend | Node.js, Express 5, CommonJS |
| Data | MongoDB with Mongoose |
| AI | `@google/genai` (Gemini), Zod and `zod-to-json-schema` for structured AI output |
| Document handling | Multer (in-memory PDF upload), `pdf-parse`, Puppeteer PDF rendering |
| Authentication | bcryptjs, JSON Web Tokens, Passport Google OAuth 2.0, cookie-parser |
| Testing | Jest, Supertest; optional DeepEval scripts under `Evaluation/` |
| Deployment configuration | Vercel SPA rewrite configuration for the frontend |

## Architecture

```text
React + Vite client
  ├─ Auth, interview, roadmap, and experience feature modules
  └─ Axios requests with credentials
             │
             ▼
Express API (/api/*)
  ├─ routes → controllers → services → Mongoose models
  ├─ JWT cookie middleware and Passport Google OAuth
  ├─ Multer + pdf-parse for PDF input
  └─ Gemini / deterministic fallback services
             │
             ▼
MongoDB
  ├─ users, blacklistTokens, InterviewReport
  ├─ InterviewExperience
  └─ Analysis, SkillGap, Roadmap, RoadmapProgress and learning-content collections
```

The frontend sends cross-origin requests with `withCredentials: true`. The backend therefore allows only `FRONTEND_URL` as its CORS origin. In production, the authentication cookie is marked `Secure` and `SameSite=None`; local development uses `SameSite=Lax`.

## Repository structure

```text
AI-Resume-analyser/
├── Backend/
│   ├── server.js                 # Loads environment, connects MongoDB, starts Express
│   ├── src/
│   │   ├── app.js                # Middleware and API mounting
│   │   ├── config/               # MongoDB and Google Passport setup
│   │   ├── controllers/          # Request handlers
│   │   ├── middlewares/          # JWT auth and in-memory PDF upload handling
│   │   ├── models/               # Mongoose schemas
│   │   ├── routes/               # Auth, interview, experience, and roadmap routes
│   │   └── services/             # AI, matching, and roadmap logic
│   ├── scripts/rescore-reports.js
│   └── test/                     # Jest/Supertest tests
├── Frontend/
│   ├── src/
│   │   ├── features/auth/        # Login, registration, protected route, API client
│   │   ├── features/interview/   # Report, resume versioning, and roadmap UI
│   │   ├── features/experiences/ # Community-feed UI
│   │   ├── Layout/ and Component/
│   │   └── app.routes.jsx
│   ├── public/
│   └── vercel.json
├── Evaluation/                   # Optional DeepEval scenarios, metrics, and fixtures
├── Backend/.env.example
└── Frontend/.env.example
```

4. The dashboard displays match evidence, skill gaps, question sets, and the preparation plan. A new resume can be analysed as another version of the same job-target group.
5. Selecting a skill gap creates a roadmap. Tasks can be marked pending, in progress, completed, or skipped, and logged hours update progress.
6. A signed-in user may share an interview experience; the original post is retained and an AI-organized view is saved alongside it when possible.

## Prerequisites

- Node.js compatible with the dependencies in the committed lockfiles (use a current Node.js LTS release).
- A MongoDB deployment or local MongoDB instance.
- A Google Gemini API key for generated AI content. Without it, report and some structuring/roadmap flows use built-in fallback behavior; Google sign-in also requires its own OAuth credentials.
- Chromium dependencies suitable for Puppeteer if you use the resume-PDF endpoint.

## Installation and setup

Clone the repository and install each application separately:

```bash
git clone https://github.com/Anushka-coder1/AI-Resume-analyser.git
cd AI-Resume-analyser

cd Backend
npm ci

cd ../Frontend
npm ci
```

`npm ci` uses the committed lockfiles. Use `npm install` only if you intentionally need to update dependencies.

### Environment variables

Copy the supplied templates before starting either process:

```powershell
Copy-Item Backend/.env.example Backend/.env
Copy-Item Frontend/.env.example Frontend/.env
```

Set the values for your environment. Do not commit either `.env` file.

`Backend/.env.example`

```dotenv
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/ai_resume_analyser
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

# Optional for Gemini-generated content. Fallback content is used if omitted.
GOOGLE_GENAI_API_KEY=your_google_gemini_api_key

# Required only to enable Google OAuth.
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

`Frontend/.env.example`

```dotenv
VITE_BACKEND_URL=http://localhost:3000
VITE_API_URL=http://localhost:3000
```

`VITE_BACKEND_URL` is used by Axios API clients. `VITE_API_URL` is used to start the browser redirect for Google OAuth; in local development both should be the backend origin. Google OAuth's authorized redirect URI must match `${BACKEND_URL}/api/auth/google/callback`.


## Run locally

Start the API in one terminal:

```bash
cd Backend
npm run dev
```

The backend listens on `PORT` (the template uses `3000`). Start the frontend in another terminal:

```bash
cd Frontend
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). The repository has no backend production-start script; deployment platforms should invoke `node server.js` after installing production dependencies.

### Frontend checks and production build

```bash
cd Frontend
npm run lint
npm run build
npm run preview
```

## API documentation

All paths below are relative to `VITE_BACKEND_URL`. Endpoints marked **Auth** require the `token` HTTP-only cookie; browser clients must send credentials. Object IDs below are MongoDB ObjectIds. Error responses normally have the form `{"message":"…"}`.

### Authentication

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | No | Creates a local account and sets the JWT cookie. |
| POST | `/api/auth/login` | No | Authenticates a local account and sets the JWT cookie. |
| POST | `/api/auth/logout` | No | Clears the cookie and blacklists it when present. |
| GET | `/api/auth/get-me` | Yes | Returns the current user. |
| GET | `/api/auth/google` | No | Begins Google OAuth. |
| GET | `/api/auth/google/callback` | No | OAuth callback; sets cookie and redirects to `FRONTEND_URL`. |

Register request:

```json
{
  "username": "ada",
  "email": "ada@example.com",
  "password": "a-strong-password"
}
```

Successful registration response (`201`):

```json
{
  "message": "User created successfully",
  "user": { "id": "<userId>", "username": "ada", "email": "ada@example.com" }
}
```

### Interview reports

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/interview` | Yes | Creates a report from multipart form data. |
| GET | `/api/interview` | Yes | Lists the caller's reports; accepts `limit` (1–25) and opaque `cursor`. |
| GET | `/api/interview/report/:interviewId` | Yes | Gets one caller-owned report. |
| PATCH | `/api/interview/report/:interviewId` | Yes | Renames a report. |
| DELETE | `/api/interview/report/:interviewId` | Yes | Deletes a report and related analysis/roadmap records. |
| GET | `/api/interview/report/:interviewId/versions` | Yes | Lists versions in the same resume group. |
| POST | `/api/interview/resume/pdf/:interviewReportId` | Yes | Downloads an AI-tailored A4 PDF (`application/pdf`). |

`POST /api/interview` consumes `multipart/form-data` with these fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `jobDescription` | text | Conditional | Required unless `jobDescriptionFile` is supplied. |
| `jobDescriptionFile` | PDF | Conditional | PDF only; text is combined with `jobDescription` when both are supplied. |
| `resume` | PDF | Conditional | Required unless `selfDescription` is supplied. Maximum 3 MB. |
| `selfDescription` | text | Conditional | Required unless `resume` is supplied. |
| `previousReportId` | text | No | Re-analysis mode: requires a new `resume`, reuses the existing job description, and creates the next version. |

Example:

```bash
curl -X POST http://localhost:3000/api/interview \
  --cookie "token=<jwt-cookie-value>" \
  -F "jobDescription=Frontend engineer with React and TypeScript experience" \
  -F "resume=@./resume.pdf;type=application/pdf" \
  -F "selfDescription=Built React applications and REST APIs."
```

Successful creation returns `201` with `message` and `interviewReport`. A report includes `title`, `matchScore`, `scoringMethod`, `requirementEvidence`, `skillGaps`, `technicalQuestions`, `behavioralQuestions`, `preparationPlan`, `resumeGroup`, and `version`.

Rename request:

```json
{ "title": "Frontend Engineer — November application" }
```

### Learning roadmaps

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/roadmaps/generate` | Creates a roadmap from an owned report/analysis; optionally targets one active skill gap. |
| GET | `/api/roadmaps` | Lists the caller's roadmaps. |
| GET | `/api/roadmaps/:id` | Returns roadmap, scheduled tasks, and calculated progress. |
| GET | `/api/roadmaps/:id/progress` | Returns only calculated progress. |
| PATCH | `/api/roadmaps/:id` | Updates roadmap title/dates/duration. |
| DELETE | `/api/roadmaps/:id` | Deletes a roadmap and its tasks. |
| PATCH | `/api/roadmaps/:id/tasks/:taskId` | Updates task status. |
| PATCH | `/api/roadmaps/:id/tasks/:taskId/time` | Updates non-negative logged hours. |
| POST | `/api/roadmaps/:id/regenerate` | Keeps completed tasks and recreates pending work. |

Every roadmap endpoint requires authentication. Generate request example:

```json
{
  "reportId": "<interviewReportId>",
  "skillName": "TypeScript",
  "durationInDays": 28,
  "dailyStudyHours": 2,
  "startDate": "2026-11-24"
}
```

`analysisId` may be used in place of `reportId`; `skillName` is optional for a report-wide roadmap. Generation constrains duration to 1–365 days and daily hours to 0.25–16. Update metadata accepts `title`, `startDate`, `targetDate`, and/or `durationInDays`. Task status must be one of `pending`, `in_progress`, `completed`, or `skipped`:

```json
{ "status": "completed" }
```

```json
{ "timeSpent": 1.5 }
```

### Community experiences

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/experiences` | No | Cursor-paginated public feed; accepts `limit` (1–25) and opaque `cursor`. |
| POST | `/api/experiences` | Yes | Shares an interview experience and requests structured organization. |
| GET | `/api/experiences/:experienceId` | No | Gets one experience with the author's username. |

Create request:

```json
{
  "company": "Example Corp",
  "role": "Backend Engineer",
  "experience": "The process included an online assessment followed by a technical round..."
}
```

The response is `201` and contains `message` plus `interviewExperience`. The saved object contains the original experience and, when generated, `structuredExperience` with rounds, items, unclassified content, and an integrity summary.

## Database models

| Collection / model | Purpose and key fields |
| --- | --- |
| `users` | `username`, `email`, optional password hash, optional `googleId`, timestamps. |
| `blacklistTokens` | Logged-out JWT token and timestamps. |
| `InterviewReport` | Owner, extracted resume/self-description/job description, deterministic match evidence, generated questions/plan, title, resume group, version, timestamps. |
| `InterviewExperience` | Company, role, original experience, owner, optional structured experience, timestamps. |
| `Analysis` | A roadmap-oriented projection of one owned report: target role, job description, overall score, and source report reference. |
| `SkillGap` | Per-analysis skill, optional learning-catalog reference, match/gap status, importance, and reason. |
| `Roadmap` | Owner, analysis, schedule settings/dates, learned skills, status, overall progress, learning-path versions. |
| `RoadmapProgress` | Roadmap task, scheduled date/day, status, estimate, logged time, resources, and optional topic/project references. |
| `Skill`, `SkillAlias`, `LearningPath`, `Topic`, `Resource`, `LearningProject` | Optional learning-content catalogue consumed by roadmap scheduling. |

Relationships are enforced in service queries by the authenticated user ID. Deleting an interview report also deletes its associated analyses, skill gaps, roadmaps, and roadmap-progress records.

## Authentication and authorization

- Local passwords are hashed with bcrypt before storage.
- Successful local or Google sign-in signs a JWT containing the user ID and username; the token expires after one day.
- The server writes the token to an HTTP-only `token` cookie. API authentication reads only that cookie, verifies the signature, and rejects blacklisted tokens.
- Protected resources are scoped to `req.user.id`; a user cannot retrieve, alter, or delete another user's report or roadmap through the documented endpoints.
- Google OAuth is optional. The callback links an existing account with the same email or creates an account using the Google profile display name and email.

## Screenshots and demo

No checked-in screenshots or hosted demo URL were found in the repository. Add project-owned images to this section when available:

```md
![Report dashboard](docs/images/report-dashboard.png)
![Learning roadmap](docs/images/learning-roadmap.png)
```

## Testing

Backend tests use Jest and Supertest and connect using `MONGO_URI` from `Backend/.env`. Use a dedicated, disposable test database because the authentication suites create and delete records.

```bash
cd Backend
npm test
```

The test suite covers basic Express availability, authentication behavior, deterministic skill matching, and roadmap scheduling helpers. It is not a complete end-to-end test suite.

The `Evaluation/` folder contains optional DeepEval scripts and fixtures. It does not include a dependency manifest or a package script. To run it, create/activate its Python environment, install the imports used by the script (`requests`, `deepeval`, and their dependencies), start the backend, and provide `AUTH_TOKEN` in the environment. The evaluator posts to `http://localhost:3000/api/interview` and expects the supplied token to authenticate a valid user.

## Deployment

The frontend can be deployed as a Vite single-page app. `Frontend/vercel.json` rewrites all paths to `index.html`, which supports client-side routing on Vercel.

1. Deploy the backend to a Node.js host that supports MongoDB connectivity and Puppeteer's Chromium requirements.
2. Configure the backend's production environment variables. Set `NODE_ENV=production`, `FRONTEND_URL` to the exact deployed frontend origin, and `BACKEND_URL` to the exact backend origin.
3. Configure the frontend build environment: set both `VITE_BACKEND_URL` and `VITE_API_URL` to the deployed backend origin, then run `npm run build` from `Frontend`.
4. Update the Google OAuth authorized redirect URI to `https://<backend-host>/api/auth/google/callback` if OAuth is enabled.
5. Confirm the frontend and API are served over HTTPS. Production cookies are `Secure` and use `SameSite=None`, so cross-origin requests also require credentialed CORS to exactly match `FRONTEND_URL`.

No container, CI workflow, backend hosting configuration, or database migration tooling is included in this repository.

## Maintenance utility

When the deterministic skill catalogue changes, inspect saved-report score differences without writing data:

```bash
cd Backend
node scripts/rescore-reports.js
```

After reviewing the output, apply the derived-field updates explicitly:

```bash
node scripts/rescore-reports.js --apply
```

This utility uses `MONGO_URI` and changes only `matchScore`, `scoringMethod`, `requirementEvidence`, and `skillGaps` when `--apply` is supplied.

## Future improvements

- Add a health endpoint, request validation schemas at the API boundary, centralized error handling, and rate limiting.
- Provide a reproducible backend production-start script, container configuration, and CI pipeline.
- Add backend integration coverage for upload/report, roadmap, and experience flows, plus frontend component/e2e tests.
- Add an evaluated, documented learning-content seeding workflow for the catalogue-backed roadmap path.
- Publish maintained screenshots, a demo deployment, and API schema documentation (OpenAPI).


## Contributing

1. Fork the repository and create a branch using the `codex/` prefix or a similarly descriptive name.
2. Make a focused change; do not commit `.env` files, credentials, or generated dependency folders.
3. Run relevant checks: `npm test` in `Backend`, and `npm run lint` plus `npm run build` in `Frontend`.
4. Update documentation when behavior, configuration, or APIs change.
5. Open a pull request that explains the change, verification performed, and any configuration implications.

## License

This project declares the [ISC License](https://opensource.org/license/isc-license-txt/) in `Backend/package.json`. No separate `LICENSE` file is currently present in the repository.