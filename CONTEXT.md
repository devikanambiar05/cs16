# CONTEXT.md - FAQ App (cs16)

> **⚠️ READ THIS BEFORE EVERY SESSION**
> This file is the single source of truth for the project's current state.
> Update it immediately after any significant change - bug fix, feature, decision, regression.

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
| RAG | Ollama (local) - vector search for FAQ chat widget |
| Charts | chart.js + react-chartjs-2 |
| Package manager | npm |

---

## How to Run

```bash
# Start backend (from cs16 root)
npm run dev:server

# Start frontend separately (if Vite OOM on Windows, use increased memory):
cd client
set NODE_OPTIONS=--max-old-space-size=4096
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

### ✅ Recently Fixed (DO NOT UNDO - committed to main)

| Commit | What was fixed |
|--------|---------------|
| `e174723` | Admin dashboard blank screen: added `chart.js` + `react-chartjs-2`, registered chart.js components, fixed API response mapping, fixed AuthContext (`api.defaults.headers` removal) |
| `058299e` | Excluded admin users from leaderboard query (`role: { $ne: 'admin' }` in `getLeaderboard`) |
| `a13097f` | **RAG fallback**: `isOllamaAvailable()` check before validating 118 FAQs. If Ollama unreachable, skips LLM validation and includes all FAQs directly. |
| `a13097f` | **EADDRINUSE fix**: `server.js` graceful shutdown (SIGINT/SIGTERM), `server.close()`, port fallback 5000→5002. |
| `a13097f` | **HMR fix**: Added `import.meta.hot.decline()` to AuthContext - full page reload is correct behavior. |
| `a13097f` | **FAQ.txt path**: `resolveFaqPath()` searches env var → project root → legacy path, throws clear error with all searched paths if missing. |
| `ee4953b` | FAQsPage blank — `CommunityBoard` returned `null` when no pins; now loads all FAQs on mount via `loadAllFAQs()` |
| `b6d005f` | FAQsPage JSX parse error — ternary else had empty `<> </>` fragment after CommunityBoard removal; replaced with two independent `&&` conditionals |
| `caea29d` | Removed top search bar from FAQsPage — search lives in Topics sidebar only |
| `e04e5a9` | Moved search bar inside Topics sidebar, above "Topics" heading |
| `caea29d` | FAQsPage category pills now smaller (`px-2 py-1 text-xs`) at top of page |
| `36bb2f2` | FAQsPage layout overhaul — removed "Knowledge Base" heading + subheading, no hero section |
| `0bfd153` | **Dev Database Protection**: centally override `MONGO_URI` inside `jest.config.js` to `faqapp_test`, preventing tests from wiping the active local database |
| `0bfd153` | **User model toObject Fix**: removed conflicting `toObject` override from `User.js` that broke login password validation |
| `0bfd153` | **Register Link Routing**: added `state={{ wantsSignup: true }}` to the Register button inside `Layout.jsx` so it opens the signup card |
| `0bfd153` | **FAQsPage Search Layout**: refactored the layout so that topics sidebar and search box remain visible during searches, and added paginated search results |
| **Theme Fixes** | **Community Board dark mode**: configured custom dark gradient backgrounds, border settings, and footer borders so posts blend with the dark theme |
| **Theme Fixes** | **RAG Chat Widget dark mode**: fully styled overlay dialogue panels, message bubbles, source lists, textareas, inputs, and persistent launcher bars |
| **Theme & UI** | **Community Board Card Cleanup**: removed redundant top-right corner emojis from post cards, keeping only the clean top-left type badges |
| **Theme & UI** | **Sleek Floating Chat Inputs**: transformed all RAG Chat input fields (dialog & launcher bar) into sleek, glassmorphic, floating panels with embedded send buttons exactly like ChatGPT |
| **Theme & UI** | **Standard Send Icon**: replaced the non-standard `+` send button with a highly polished standard arrow icon pointing right |
| **Git Config** | **Git Author rewrite**: replaced college ID (`21f3002068`) with personal ID (`Vaibhav satish9@gmail.com`) for all 29 commits, and set global Git defaults |

### 🟡 Partially Built Features

| Feature | Issue | Status |
|---------|-------|--------|
| Pins Admin UI | #4 | Built — full CRUD UI in admin + pin/unpin in FAQsPage + Manage FAQs tab |
| WikiPage | #5 | Removed — redundant with FAQsPage after it gained category pills |
| RAG Chat History | #7 | API accepts `sessionId`, widget doesn't track it - every message is isolated |
| Promote/Demote Role UI | #8 | Admin can ban/unban users, but cannot change role. Only MongoDB direct update works. |

---

## GitHub Issues

| # | Title | Status |
|---|-------|--------|
| #2 | Fix: RAG system indexes 0 FAQs despite 118 in database | Fixed in `a13097f` |
| #3 | Fix: Backend server crashes repeatedly with EADDRINUSE on port 5000 | Fixed in `a13097f` |
| #4 | Enhancement: Build Pins management UI in Admin Dashboard | ✅ Closed (commits `604c77f` + `8f46454` + `ba1cd41` + `b6d005f` + `ee4953b`) |
| #5 | Enhancement: Implement WikiPage — removed (redundant with FAQsPage) | ✅ Closed — WikiPage nuked (`f9d14c7`) |
| #6 | Fix: HMR breaks useAuth causing full page reload | Fixed in `a13097f` |
| #7 | Enhancement: RAG Chat widget has no conversation history | Open |
| #8 | Enhancement: Add ability to promote/demote user role | Open |
| #9 | Fix: FAQ.txt path is fragile and causes silent seed failures | Fixed in `a13097f` |

---

## Project Structure

```
cs16/
├── server/
│   ├── server.js          # Express entry point, port 5000 (graceful shutdown + port fallback)
│   ├── app.js             # Main app, middleware setup
│   ├── seed.js            # DB seeder - parses FAQ.txt, inserts FAQs + admin user
│   ├── parseFaqTxt.js     # Parses FAQ.txt with resolveFaqPath()
│   ├── routes/
│   │   ├── authRoutes.js      # /api/auth/*
│   │   ├── adminRoutes.js     # /api/admin/*  (protected by adminOnly)
│   │   ├── userRoutes.js      # /api/users/*
│   │   ├── faqRoutes.js       # /api/faqs/*
│   │   ├── queryRoutes.js     # /api/queries/*
│   │   ├── ragRoutes.js       # /api/rag/*
│   │   └── faqRequestRoutes.js # /api/faq-requests/*
│   ├── controllers/
│   │   ├── adminController.js # getAnalytics, getAdminFaqs, patchFaq, etc.
│   │   ├── authController.js  # login, register, getMe
│   │   ├── ragController.js   # buildRagIndex (with Ollama availability check)
│   │   └── faqRequestController.js
│   └── models/
│       └── User.js, FAQ.js, Query.js, Answer.js, Pin.js
├── client/
│   ├── src/
│   │   ├── App.jsx           # Routes: /, /community, /admin, /login, /leaderboard, /ask
│   │   ├── main.jsx
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx   # Tabs: Overview, Queries, Users, FAQ Requests, Manage FAQs, Pins
│   │   │   ├── FAQsPage.jsx         # Public FAQ listing + search in sidebar + category pills
│   │   │   ├── CommunityPage.jsx    # Query board
│   │   │   ├── LeaderboardPage.jsx  # Reputation-based ranking
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── RAGChatWidget.jsx    # AI chat
│   │   │   ├── Layout.jsx           # Navbar + routing
│   │   │   ├── ProtectedRoute.jsx   # Auth guard
│   │   │   └── CommunityBoard.jsx   # Pinned FAQs/announcements (used in WikiPage only)
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Auth state - HMR suppressed via import.meta.hot.decline()
│   │   └── services/
│   │       └── api.js               # All API calls - uses x-auth-token header
│   └── vite.config.js              # Proxies /api → localhost:5000
├── FAQ.txt                          # Seed data source (project root: cs16/FAQ.txt)
└── docs/
    └── TEAM_ISSUES.md               # Team issue tracker
```

---

## Key Decisions & History

### Why RAG was indexing 0 FAQs
The `buildRagIndex()` called `validateAnswer()` for all 118 FAQs via Ollama. Each call had a 15s timeout. If Ollama was slow/unavailable, all 118 calls timed out → all returned `false` → 0 FAQs passed. Fix (`a13097f`): check `isOllamaAvailable()` first; if unreachable, skip validation entirely and include all FAQs directly.

### Why EADDRINUSE happened on every file change
Nodemon spawned a new `node server.js` process on every file change without closing the previous one. All processes tried to bind to port 5000 simultaneously. Fix (`a13097f`): graceful SIGINT/SIGTERM handlers call `server.close()`, and the server tries ports 5000→5002 if EADDRINUSE.

### Why AuthContext triggered HMR incompatibility
`useAuth` was a named export that changed on every module reload. React Fast Refresh can't safely update hooks in-place. Fix (`a13097f`): `import.meta.hot.decline()` tells Vite to do a full page reload - correct behavior for context files.

### FAQ.txt path resolution
`parseFaqTxt.js` uses `resolveFaqPath()`: env `FAQ_TXT_PATH` → project root → legacy `../../FAQ.txt`. Throws clear error listing all searched paths if file not found. Canonical location is now `cs16/FAQ.txt`.

### Why FAQsPage was blank
`CommunityBoard` returns `null` when no pins exist. The default view (no category selected, no pins) had no content to show. Fix (`ee4953b`): load all FAQs on mount via `loadAllFAQs()` and display in left panel by default.

---

## RAG System Notes

- RAG pre-warming runs at server startup in `server/server.js`
- `buildRagIndex()` checks Ollama availability first (5s timeout to `GET /api/tags`)
- If Ollama unreachable: logs `RAG validation: Ollama not available - including all X FAQs without LLM validation`
- If Ollama running: validates each FAQ (10s timeout, 8 concurrent), logs `RAG validation: passed=N of 118`
- Widget is functional once index has > 0 FAQs

---

## Dev Notes

- **Vite OOM on Node 22 + Windows**: crashes with `Fatal process out of memory: Zone`. Workaround: set `NODE_OPTIONS=--max-old-space-size=4096` before running Vite, or run client separately with increased memory.
- **Kill stale processes**: `Get-NetTCPConnection -LocalPort 5000,5173 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`
- **FAQ.txt canonical location**: `cs16/FAQ.txt` (project root, next to `package.json`)

---

### ✅ FAQ Requests Tab Fix (commit `bd1234b`)

| Bug | Fix |
|-----|-----|
| Tab showed blank screen | `loadFAQRequests` used `res.data` — but API returns `{ requests, pagination }` — now uses `res.data?.requests` |
| No requests ever appeared | UI read `req.title`/`req.description` which don't exist on `FAQRequest` model — now reads `proposedQuestion`, `proposedAnswer`, `proposedTags`, `status`, `submittedBy.name`, `queryId.title` |
| Approve/Reject shown for non-pending | Buttons now only render when `status === 'pending'` |

---

### ✅ Nuke WikiPage (commit `f9d14c7`)

WikiPage was redundant with FAQsPage after FAQsPage gained category pills + grouped display. Removed:

- Deleted `WikiPage.jsx`
- Removed `/wiki` route from `App.jsx`
- Removed `Wiki` link from `Layout.jsx` navbar and footer
- FAQsPage is now the single canonical FAQ listing page

---

### ✅ Pins Admin UI (commits `604c77f` + `8f46454` + `ba1cd41` + `b6d005f` + `ee4953b`)

| Feature | Details |
|---------|---------|
| **Pins tab UI** | Full CRUD in Admin Dashboard → Pins tab: list cards, create/edit modal, remove with confirm |
| **Pin/Unpin FAQ** | `pinFaq(id)` API + `handleTogglePin` in Manage FAQs tab; Pin/Unpin button per row; amber badge on pinned FAQs |
| **FAQsPage public listing** | Admins see a bookmark icon on each FAQ; pinned FAQs show a 📌 indicator next to the title |
| **FAQsPage category pills** | Category filter pills at top of FAQsPage (`px-2 py-1 text-xs`), active = `bg-primary-600 text-white`, inactive = `bg-slate-100` |

---

### ✅ FAQsPage Layout Overhaul

| What | Details |
|------|---------|
| Search bar | Lives inside Topics sidebar (not in the main header row) |
| Category pills | `px-2 py-1 text-xs` at very top of page; clicking a pill sets category and loads filtered FAQs |
| "Knowledge Base" heading | Removed — no hero section |
| Default content | Left panel shows all FAQs on mount (via `loadAllFAQs()`) |
| CommunityBoard | Not shown in FAQsPage default view (WikiPage-only) |

---

## Last Updated

`2026-05-30 18:20` — Vee / Antigravity