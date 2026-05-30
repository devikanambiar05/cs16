# CONTEXT.md — FAQ App (cs16)

> **⚠️ READ THIS BEFORE EVERY SESSION**  
> This file is the single source of truth for the project's current state.
> Update it immediately after any significant change — bug fix, feature, decision, regression.

---

## Repository & Team

- **Repo:** https://github.com/vicharanashala/cs16
- **Live at:** `C:\Users\vaibh\Downloads\opensourcefaq\cs16`
- **Owner:** Vee (Vaibhav)
- **Email:** admin@faqapp.com (admin account)

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + TailwindCSS + React Router v6 |
| Backend | Node.js + Express + MongoDB (Mongoose) |
| Auth | JWT (jsonwebtoken) |
| RAG | Ollama (local) — vector search for FAQ chat widget |
| Charts | chart.js + react-chartjs-2 |
| Package manager | npm |

---

## How to Run

```bash
# Start everything (from cs16 root)
npm run dev

# Seed/reset database (from cs16 root)
$env:RESET_DB='true'; npm run seed

# Backend URL:  http://localhost:5000
# Frontend URL: http://localhost:5173
```

---

## Admin Credentials

- **Email:** admin@faqapp.com
- **Password:** admin123

---

## Current Known State (2026-05-30)

### ✅ Recently Fixed (DO NOT UNDO — committed to main)

| Commit | What was fixed |
|--------|---------------|
| `e174723` | Admin dashboard blank screen: added `chart.js` + `react-chartjs-2` to package.json, registered chart.js components in AdminDashboard, fixed API response mapping (stats were nested under `totals.*` not top-level), fixed AuthContext (removed broken `api.defaults.headers` line) |
| `058299e` | Excluded admin users from leaderboard query (`role: { $ne: 'admin' }` in `getLeaderboard`) |
| `871d187` | Created `docs/TEAM_ISSUES.md` with team issues list |

### 🔴 Known Bugs — NOT YET FIXED

| Issue | Location | Description |
|-------|---------|-------------|
| RAG index empty | server logs | `RAG validation: passed=0 of 118` — despite 118 FAQs in DB, RAG vectorizes 0. RAG chat widget has nothing to query. |
| Backend EADDRINUSE | `server/server.js` | Nodemon crashes with port 5000 in use on every file change/HMR. Multiple node processes fighting for port. |
| HMR breaks useAuth | `client/src/context/AuthContext.jsx` | Fast Refresh incompatible — any change to AuthContext forces full page reload for all users |
| FAQ.txt path fragile | `server/parseFaqTxt.js` | Hardcoded relative path resolves to `opensourcefaq/FAQ.txt` (parent of cs16). Silent failure if file missing. |

### 🟡 Partially Built Features

| Feature | Issue | Status |
|---------|-------|--------|
| Pins Admin UI | #4 | API routes + `getAdminPins`/`createPin` exist, UI tab shows "coming soon" placeholder |
| WikiPage | #5 | Route exists in App.jsx, `WikiPage.jsx` is empty/placeholder |
| RAG Chat History | #7 | API accepts `sessionId`, widget doesn't track it — every message is isolated |
| Promote/Demote Role UI | #8 | Admin can ban/unban users, but cannot change role. Only MongoDB direct update works. |

---

## Project Structure

```
cs16/
├── server/
│   ├── server.js          # Express entry point, port 5000
│   ├── app.js             # Main app, middleware setup
│   ├── seed.js            # DB seeder — parses FAQ.txt, inserts FAQs + admin user
│   ├── parseFaqTxt.js     # Parses FAQ.txt into structured { sections, faqs, answerMap }
│   ├── routes/
│   │   ├── authRoutes.js      # /api/auth/*
│   │   ├── adminRoutes.js     # /api/admin/*  (protected by adminOnly)
│   │   ├── userRoutes.js      # /api/users/*
│   │   ├── faqRoutes.js       # /api/faqs/*
│   │   ├── queryRoutes.js     # /api/queries/*
│   │   ├── ragRoutes.js       # /api/rag/*
│   │   └── ...
│   ├── controllers/
│   │   ├── adminController.js # getAnalytics, getAdminFaqs, patchFaq, etc.
│   │   ├── authController.js  # login, register, getMe
│   │   └── ...
│   └── models/
│       ├── User.js, FAQ.js, Query.js, Answer.js
├── client/
│   ├── src/
│   │   ├── App.jsx           # Routes: /, /community, /admin, /login, /wiki, /leaderboard, /ask
│   │   ├── main.jsx
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx   # Tabs: Overview, Queries, Users, FAQ Requests, Manage FAQs, Pins
│   │   │   ├── FAQsPage.jsx         # Public FAQ listing + search
│   │   │   ├── CommunityPage.jsx    # Query board
│   │   │   ├── LeaderboardPage.jsx  # Reputation-based ranking
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── RAGChatWidget.jsx    # AI chat — currently BROKEN (0 FAQs indexed)
│   │   │   ├── Layout.jsx           # Navbar + routing
│   │   │   ├── ProtectedRoute.jsx   # Auth guard
│   │   │   └── ...
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Auth state — ⚠️ HMR issue
│   │   └── services/
│   │       └── api.js               # All API calls — uses x-auth-token header
│   └── vite.config.js              # Proxies /api → localhost:5000
├── FAQ.txt                          # Seed data source (copied here, not inside cs16/)
└── docs/
    └── TEAM_ISSUES.md               # Team issue tracker (markdown copy)
```

---

## GitHub Issues (Created 2026-05-30)

| # | Title | Label |
|---|-------|-------|
| #2 | Fix: RAG system indexes 0 FAQs despite 118 in database | bug |
| #3 | Fix: Backend server crashes repeatedly with EADDRINUSE on port 5000 | bug |
| #4 | Enhancement: Build Pins management UI in Admin Dashboard | enhancement |
| #5 | Enhancement: Implement WikiPage — currently renders nothing | enhancement |
| #6 | Fix: HMR breaks useAuth causing full page reload on any AuthContext change | bug |
| #7 | Enhancement: RAG Chat widget has no conversation history | enhancement |
| #8 | Enhancement: Add ability to promote/demote user role in Admin Dashboard | enhancement |
| #9 | Fix: FAQ.txt path is fragile and causes silent seed failures | bug |

---

## Key Decisions & History

### Why FAQ.txt lives outside cs16/
`parseFaqTxt.js` resolves `../../FAQ.txt` from `server/` which points to `opensourcefaq/FAQ.txt` (parent of cs16). This is confusing. An attempt was made to copy it into cs16 root but the relative path still resolves externally. **Fix tracked in issue #9.**

### Why chart.js was missing
`chart.js` and `react-chartjs-2` were not in `client/package.json`. The AdminDashboard imported `Line` from `react-chartjs-2` without registering chart.js v3+ components. This was fixed in `e174723`.

### Why AuthContext was crashing
`AuthContext.jsx` line 14 tried to set `api.defaults.headers.common['Authorization']` — but `api` exported from `services/api.js` is a plain object with `get/post/patch/...` methods, not an axios instance. No `defaults` property existed. Fixed by removing that line — token is already read from localStorage inside `getHeaders()` on every request.

### Admin in Leaderboard issue
Leaderboard's `getLeaderboard` query filtered `status: 'active'` but never excluded `role: 'admin'`. Admin was appearing on the public leaderboard. Fixed with `role: { $ne: 'admin' }` filter.

---

## RAG System Notes

- RAG pre-warming runs at server startup in `server/server.js`
- Logs show: `RAG validation: passed=0 of 118` and `RAG index ready — 0 FAQs indexed`
- `FAQ.txt` parsing works (118 FAQs seeded) — the failure is in the Ollama vectorization step
- The `RAGChatWidget` is completely non-functional due to empty index
- **Fix tracked in issue #2**

---

## Last Updated

`2026-05-30` — Vee / Larry
