# SmartEdu Tracker

**AI-Powered Academic Performance Predictor** — a role-based full-stack academic
early-warning system that analyzes attendance, assessments, assignments, and
performance trends to calculate explainable student risk levels, uses AI to
generate data-grounded academic recommendations, and enables faculty to
simulate improvements and track intervention outcomes.

> SmartEdu Tracker is an **academic early-warning and decision-support
> system**, not an automated system that determines whether a student will
> fail. Risk is an indicator, not a guaranteed outcome — faculty remain
> responsible for final academic decisions. All seed/demo data is fictional.

## Features

- **Explainable risk prediction** — a deterministic, backend-calculated risk
  score (0–100) and Low/Medium/High level, built from attendance, academic
  average, assignment completion and performance trend.
- **AI explanation & recommendations** — OpenRouter generates a plain-language
  explanation and 2–4 actionable recommendations from the *already-computed*
  risk data. The AI never calculates or changes the risk score.
- **What-if simulator** — try hypothetical numbers and preview the resulting
  risk, without touching any stored data. Uses the exact same risk engine as
  real calculations (single source of truth).
- **Intervention tracking** — faculty record an intervention against a
  student's current risk, then close the follow-up to auto-derive an
  IMPROVED / STABLE / WORSENED outcome from the before/after risk scores.
- **Risk history** — every recalculation creates a new record; history is
  never overwritten, and is charted with Recharts.
- **CSV import** — bulk-import student academic data with row-level
  validation; risk is always recalculated server-side (CSV values for
  risk/score are never trusted).
- **Role-based access control** — Student / Faculty / Admin, enforced on the
  backend (not just hidden UI), with students isolated to their own data and
  faculty scoped to their assigned students.
- **New-student onboarding workflow** — Admin creates a login + academic
  profile + (optionally) initial attendance/marks/assignments in one step,
  with risk calculated immediately; a first-login guided tour walks new
  students through the app, and is replayable anytime from Help & Tutorial.
- **Notes** — private personal notes for students, and per-student notes for
  faculty (never visible to the student they're about).
- **Notifications** — real, event-driven (risk level changes, high-risk
  alerts to faculty, intervention created/updated) — not scheduled spam.
- **Settings** — light/dark/system theme, display density, and per-category
  notification preferences, persisted server-side per user.
- **Profile & Academic Performance pages**, contextual help tooltips, and a
  responsive, collapsible sidebar for mobile/tablet.

## Update Log (this revision)

This revision extends an existing working build rather than starting over.
Summary of what changed, for anyone comparing against an earlier copy:
- Seed data expanded from 100 to **220 students** across 10 explicit academic
  archetypes (see Database Setup below) — the risk formula itself is
  byte-for-byte unchanged; only the synthetic input ranges were recalibrated
  after an offline Monte Carlo check showed the original ranges produced
  almost no HIGH-risk students.
- New: Notes, Notifications, Settings/theme, Profile page, Academic
  Performance page, first-login tutorial + replayable Help & Tutorial with
  quick guides, contextual `?` help tips, responsive mobile sidebar.
- Admin "Add Student" now accepts optional initial academic data and
  calculates risk immediately, sharing one code path
  (`services/academicRecordService.js`) with CSV import instead of
  duplicating the logic.
- What-if simulator now returns a full current-vs-simulated breakdown with
  per-factor differences, not just two scores.
- Faculty dashboard now shows live "Follow-ups Due" and "Attendance Alerts"
  counts computed from the database, plus semester filtering.
- Fixed a pre-existing bug (present in the uploaded copy this revision built
  on) where `authValidator`'s `role` field was required, which silently
  blocked the frontend's student self-registration form from ever
  succeeding — this fix is preserved from that copy.

## Tech Stack

| Layer     | Technology                                                        |
|-----------|--------------------------------------------------------------------|
| Frontend  | React 18, Vite, React Router, Axios, Recharts, Tailwind CSS        |
| Backend   | Node.js, Express, Mongoose, JWT, bcrypt, multer, csv-parse, express-validator |
| Database  | MongoDB                                                             |
| AI        | OpenRouter API (backend-only, model name from env var)             |

## Architecture

```
React UI  →  Express REST API  →  MongoDB
                    │
                    ├──  Risk Engine (services/riskEngine.js)
                    │     — pure, DB-free, single source of truth
                    │     — used by: real calculation, CSV import,
                    │       what-if simulator, intervention follow-up
                    │
                    ├──  OpenRouter AI (services/aiService.js)
                    │     — explains an ALREADY-calculated risk score
                    │     — never computes or changes the score
                    │
                    └──  Auth + RBAC (JWT + role/ownership middleware)
```

```
Student Academic Data → Risk Engine → Risk Score + Level → Contributing
Factors → OpenRouter AI → Explanation + Recommendations → Faculty
Intervention → Follow-up → New Risk Assessment
```

What-if simulator:

```
Stored Data → Temporary Changes → SAME Risk Engine → Simulated Result
                                                     → NO database write
```

## Folder Structure

```
smartedu-tracker/
├── backend/
│   ├── config/db.js
│   ├── controllers/        # one per resource
│   ├── middleware/         # auth, roles, error handling, csv upload, validate
│   ├── models/             # Mongoose schemas
│   ├── routes/
│   ├── services/           # riskEngine, dashboardService, riskCalculationService,
│   │                       # aiService, csvService, academicRecordService,
│   │                       # auditService, notificationService
│   ├── validators/         # express-validator chains
│   ├── seed/seedData.js    # synthetic demo data generator (220 students)
│   ├── tests/              # jest unit + integration tests
│   ├── app.js / server.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/     # Navbar, Sidebar, RiskCard, RiskBadge, TrendChart,
    │   │                   # StudentTable, AIExplanationPanel, SimulatorPanel,
    │   │                   # InterventionPanel, AcademicRecordForms,
    │   │                   # TutorialModal, HelpTip, AppLayout, ...
    │   ├── pages/           # Login, StudentDashboard, FacultyDashboard,
    │   │                   # StudentDetails, AdminDashboard, *Management,
    │   │                   # ProfilePage, SettingsPage, NotesPage,
    │   │                   # NotificationsPage, HelpTutorialPage,
    │   │                   # StudentAcademics, ...
    │   ├── context/         # AuthContext.jsx, PreferenceContext.jsx
    │   ├── services/api.js
    │   ├── App.jsx / main.jsx
    └── .env.example
```

## Database Setup

You need a running MongoDB instance — either local or [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier works fine).

**Local (recommended for quick testing):**
```bash
# macOS (Homebrew)
brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community

# Ubuntu/Debian — see MongoDB's official install docs for your release:
# https://www.mongodb.com/docs/manual/administration/install-on-linux/

# Or via Docker (simplest):
docker run -d -p 27017:27017 --name smartedu-mongo mongo:7
```

Default connection string for a local instance: `mongodb://127.0.0.1:27017/smartedu_tracker`

**Atlas:** create a free cluster, add a database user, allow your IP, and copy
the connection string into `MONGODB_URI`.

## Environment Variables

### backend/.env
Copy `backend/.env.example` to `backend/.env` and fill in:

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/smartedu_tracker
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openai/gpt-4o-mini
CLIENT_URL=http://localhost:5173
```

- `OPENROUTER_API_KEY` / `OPENROUTER_MODEL` — get a key at
  [openrouter.ai](https://openrouter.ai/keys). Any chat-completion-capable
  model works; pick one available on your account. **If left blank, the app
  still works fully** — the AI explanation panel will show "AI explanation is
  temporarily unavailable," while risk scores, history, simulator, CSV import,
  and interventions continue to work normally (per spec section 41).
- `JWT_SECRET` — any long random string. Generate one with
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

### frontend/.env
Copy `frontend/.env.example` to `frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

**Never commit real `.env` files.** Only `.env.example` is checked in.

## Installation & Running Locally

Open two terminals.

**Terminal 1 — Backend:**
```bash
cd backend
cp .env.example .env      # then edit .env with your MongoDB URI / secrets
npm install
npm run seed               # populates demo data (safe to re-run — wipes & reseeds)
npm run dev                 # starts on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # starts on http://localhost:5173
```

Open **http://localhost:5173** and log in (see Demo Accounts below), or use
the "Quick demo login" buttons on the login screen.

### Running backend tests
```bash
cd backend
npm test
```
This runs the pure risk-engine unit tests (no external dependencies) and an
auth/RBAC integration suite that spins up an in-memory MongoDB via
`mongodb-memory-server` (downloads a small `mongod` binary the first time —
requires normal internet access; not related to your `MONGODB_URI`).

## Seed Data

`npm run seed` (from `backend/`) wipes all collections and creates:
- 1 admin, 14 faculty, 8 subjects
- 220 fictional students, each with 3 "waves" of attendance/assessment/
  assignment history and a resulting risk-history trail, generated through
  the *same* risk engine used at runtime, across 10 explicit academic
  archetypes (high-attendance+high-marks, high-attendance+poor-marks,
  poor-attendance+high-marks, poor-attendance+poor-marks, good-academics
  with incomplete assignments, declining, improving, stable, severe-high-risk,
  and fully mixed) — see `ARCHETYPES` in `seed/seedData.js`
- An intentional Low/Medium/High risk distribution (~41% / 34% / 25%) — not
  everyone is Low Risk
- ~40 sample interventions (some pending, some completed with outcomes)
- A welcome notification per student, and a couple of demo Notes

`npm run seed:destroy` empties the collections without reseeding.

## Demo Accounts

Password is the **same for every demo account**: `Passw0rd!123`

| Role    | Email(s)                                             |
|---------|-------------------------------------------------------|
| Admin   | `admin@smartedu.local`                                 |
| Faculty | `faculty1@smartedu.local` … `faculty14@smartedu.local` |
| Student | `student1@smartedu.local` … `student220@smartedu.local`|

## API Overview

Base URL: `/api`. All routes except `/auth/register` and `/auth/login`
require `Authorization: Bearer <token>`. See `backend/routes/*.js` for the
full list; summary:

```
POST   /api/auth/register          (student self-registration only)
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout

GET    /api/students               (faculty: assigned only; admin: all)
GET    /api/students/:id
POST   /api/students                (admin — creates login + profile together)
PUT    /api/students/:id

GET    /api/faculty  POST /api/faculty  GET/PUT /api/faculty/:id   (admin)

GET    /api/subjects  POST/PUT/DELETE /api/subjects/:id            (admin writes)

POST   /api/attendance   GET /api/attendance/student/:studentId   PUT /api/attendance/:id
POST   /api/assessments  GET /api/assessments/student/:studentId  PUT /api/assessments/:id
POST   /api/assignments  GET /api/assignments/student/:studentId  PUT /api/assignments/:id

POST   /api/risk/calculate/:studentId   (faculty/admin only)
GET    /api/risk/current/:studentId
GET    /api/risk/history/:studentId

POST   /api/ai/explanation/:studentId

POST   /api/interventions              (faculty/admin)
GET    /api/interventions/student/:studentId
PUT    /api/interventions/:id

POST   /api/simulator/risk             (no DB writes, ever)

POST   /api/import/students            (multipart/form-data, field "file")

GET    /api/admin/stats  GET /api/admin/users  PUT /api/admin/users/:id/status  (admin)

PUT    /api/auth/onboarding-complete   (marks the guided tour done)

GET    /api/notes  POST /api/notes  PUT /api/notes/:id  DELETE /api/notes/:id
GET    /api/notifications  PUT /api/notifications/:id/read  PUT /api/notifications/read-all
GET    /api/preferences  PUT /api/preferences  POST /api/preferences/reset
```

Response envelope:
```json
{ "success": true,  "message": "...", "data": { } }
{ "success": false, "message": "...", "errors": [] }
```

## Risk Formula

```
attendanceRisk  = 100 - attendancePercentage
academicRisk    = 100 - academicAverage
assignmentRisk  = 100 - assignmentCompletionPercentage
trendRisk       = clamp(50 - trendDelta * 2, 0, 100)   (50 if < 2 assessments)

totalRiskScore  = attendanceRisk * 0.25
                + academicRisk   * 0.35
                + assignmentRisk * 0.15
                + trendRisk      * 0.25
                (rounded to 2 decimals, clamped 0–100)

riskLevel: score < 40 → LOW · 40 ≤ score < 65 → MEDIUM · score ≥ 65 → HIGH
```

- Attendance is aggregated as **total attended / total classes × 100** across
  subjects — never a simple average of per-subject percentages.
- Trend uses the earliest vs. latest internal-assessment percentage, clamped
  to [-25, +25]; DECLINING ≤ -5, IMPROVING ≥ +5, else STABLE.
- This exact function (`services/riskEngine.js`) is the **only** place the
  formula is implemented — the simulator, CSV import, and intervention
  follow-up all call it, never a re-derived copy.

## AI Configuration

OpenRouter is called **only from the backend** (`services/aiService.js`).
The system prompt instructs the model to: use only the supplied metrics;
never invent facts; never infer health/financial/family/religious/caste
information; never change the provided risk score; avoid guaranteeing
outcomes; and return strict JSON (`summary`, `mainReasons[]`,
`recommendations[]`). If the API key is missing, the request times out, or
the response can't be parsed into that shape, the endpoint returns
`available: false` with a user-facing message — the rest of the app
(risk score, history, simulator, interventions) is unaffected.

## CSV Format

```
student_id,student_name,email,course,semester,section,attendance_pct,internal_1,internal_2,assignments_total,assignments_submitted,previous_semester_avg
S001,Student One,student1@example.com,MCA,3,2MCA1,92,82,86,5,5,78
```

Rows are validated (numeric ranges, required columns, email format,
`assignments_submitted <= assignments_total`); invalid/duplicate rows are
rejected individually and reported in the import summary
(total/successful/failed/duplicate/invalid + per-row error messages). Risk
is always recalculated by the backend after import — any risk-related
columns in a CSV would be ignored, not stored.

**Note:** a student must already have a login account (via self-registration
or Admin → Student Management) before their academic data can be imported,
since every `Student` document is linked to a `User`.

## Testing

- `backend/tests/riskEngine.test.js` — pure unit tests covering the spec's
  Case A/B/C scenarios, the four LOW/MEDIUM/HIGH boundary values (39.99 /
  40.00 / 64.99 / 65.00), trend calculation, and the weighted-attendance
  rule. Run with no external dependencies.
- `backend/tests/auth.test.js` — integration tests (via `supertest` +
  `mongodb-memory-server`) covering registration, login failure modes, RBAC
  (student blocked from admin/faculty routes and other students' data), and
  the simulator.

Manual test checklist (spec section 52 acceptance criteria): log in as each
role; as faculty, open a student, add attendance/assessment/assignment data,
calculate risk, generate an AI explanation, record an intervention, close its
follow-up, and run the what-if simulator; as admin, check `/admin` stats and
management pages; try a CSV import with a deliberately broken row to confirm
partial-failure reporting.

## Known Limitations

- **Two numbers in the source specification are internally inconsistent with
  its own formula**, and this implementation follows the formula (spec
  section 11, explicitly marked "use exactly" / "do not modify") over the
  inconsistent illustrative numbers:
  - Section 6.8's worked example lists `totalRiskScore: 57.65` for
    attendanceRisk=42, academicRisk=55, assignmentRisk=40, trendRisk=74 —
    applying the section 11 weights (0.25/0.35/0.15/0.25) to those exact
    values gives **54.25**, not 57.65.
  - Section 51's "Case B" (Attendance 70, Academic 60, Assignment 65,
    TrendDelta 0) is labeled "Expected: MEDIUM" — the formula gives
    **39.25**, which is **LOW** (just under the 40 cutoff). This is
    documented with the full arithmetic in `tests/riskEngine.test.js`.
- CSV import maps each row to a single synthetic "General (CSV Import)"
  subject, since the CSV format specified is per-student rather than
  per-subject-per-student.
- No MongoDB replica set/transactions — registration creates a `User` then a
  `Student` in two sequential writes rather than one atomic transaction (fine
  for a single standalone `mongod`; on Atlas this could be upgraded to a
  session transaction).
- This is a rule-based weighted risk-scoring engine enhanced with
  AI-generated explanation/recommendations — **not** a trained machine
  learning model. No accuracy percentage is claimed anywhere, per spec
  section 56.
- Audit logging is lightweight (single collection, no retention policy).
- **Dark mode is implemented as a global CSS re-skin** (a fixed set of
  `.dark .text-ink-*` / `.dark .bg-ink-*` overrides in `index.css`) rather
  than a `dark:` Tailwind variant on every individual className across ~30
  components. This keeps dark mode real and consistently applied everywhere
  without a large mechanical rewrite, but it means a genuinely new color
  utility introduced later in a component (e.g. `text-ink-950`) won't
  automatically get a dark counterpart until a matching override line is
  added to `index.css`.
- "Attendance Alerts" and "Follow-ups Due" on the faculty dashboard are
  computed live from the database on each request, not push-notified — this
  avoids a scheduled job/cron dependency for a demo deployment. Notifications
  themselves ARE event-driven (fired at the moment risk changes or an
  intervention is created/updated), not on a timer.
- This revision could not be tested against a live database from the build
  environment (no network path to MongoDB Atlas or OpenRouter from that
  sandbox — same constraint as the original build). Every file was verified
  by syntax-checking the full backend, a clean `app.js` load with every
  route wired in, all 14 risk-engine unit tests passing unchanged, and a
  clean `npm run build` of the frontend after each major change. Please run
  `npm run seed` and click through the checklist in Testing below on your
  machine before a live demo/viva.

## Future Scope

- Real trained ML model as an additional (not replacing) signal, with
  documented training data, evaluation, and accuracy.
- Per-subject risk breakdown, not just an overall student risk.
- Email/SMS notifications to faculty when a student crosses into HIGH risk.
- Bulk faculty→student assignment tooling and CSV export.
