# 🔴 P0 — RAG System Broken: 0 FAQs Indexed Despite 118 in Database

**Labels:** `bug`, `priority:critical`

## Description

The server logs show:
```
RAG validation: passed=0 of 118
RAG index ready — 0 FAQs indexed
```

Despite 118 FAQs being seeded into MongoDB, the RAG index contains **zero documents**. This means the AI-powered FAQ chat widget is completely non-functional — it has nothing to query.

## Steps to Reproduce

1. Start the app with `npm run dev`
2. Log in as admin
3. Observe server console output

## Expected Behavior

The RAG index should contain all 118 FAQs after seeding, making the RAG chat widget functional.

## Investigation Notes

- `parseFaqTxt.js` reads `FAQ.txt` and returns structured `{ sections, faqs, answerMap }`
- `seed.js` calls `parseFAQtxt()` and inserts into MongoDB
- Something in the RAG pre-warming / indexing pipeline is failing silently
- Check `ragController.js` or wherever the RAG index is built — likely `ollama` / `vectorize` call is failing or returning empty

---

# 🔴 P0 — Backend Server Crashes Repeatedly (EADDRINUSE on Port 5000)

**Labels:** `bug`, `priority:critical`

## Description

When running `npm run dev`, the backend server (`nodemon server.js`) frequently crashes with:

```
Error: listen EADDRINUSE: address already in use :::5000
[nodemon] app crashed - waiting for file changes before starting...
```

This happens on file changes (HMR), on restart attempts, and even on a fresh `npm run dev`. Multiple Node processes are competing for port 5000.

## Root Cause

Nodemon is spawning multiple `node server.js` processes that all try to bind to port 5000 simultaneously, rather than restarting cleanly. The `server.js` lacks a `server.close()` call before restarting.

## Steps to Fix

1. Ensure `server.js` calls `server.close()` in its restart trap
2. Add `--delay 1000ms` to nodemon to prevent rapid restarts
3. Alternatively: make the port configurable via `process.env.PORT` and fall back to `5001` if 5000 is taken

---

# 🟡 P1 — Hot Reload Breaks `useAuth` Export, Forces Full Page Reload

**Labels:** `bug`, `priority:high`

## Description

During development with Vite HMR, editing `AuthContext.jsx` causes:

```
Could not Fast Refresh ("useAuth" export is incompatible). Learn more at https://...
```

This forces a full page reload, destroying the React component tree and auth state. Any change to AuthContext kicks all users off the app during development.

## Root Cause

The `useAuth` hook is exported as a named export (`export function useAuth`) but React's Fast Refresh expects components (not hooks) to be stable across reloads. Hooks shouldn't trigger Fast Refresh at all.

## Suggested Fix

- Ensure `useAuth` is a regular function export, not wrapped in anything that changes
- Move `useAuth` to a separate file if needed for stability
- Alternatively: suppress HMR for context files via `import.meta.hot.decline()`

---

# 🟡 P1 — "Pins" Admin Tab is a Placeholder — Feature Not Implemented

**Labels:** `enhancement`, `priority:high`

## Description

The "Pins" tab in the Admin Dashboard renders:
```jsx
<p className="text-slate-500 dark:text-slate-400">Pins management coming soon.</p>
```

Pin functionality is referenced throughout the codebase:
- `getAdminPins()` and `createPin()` exist in `api.js`
- `GET /api/admin/pins` and `POST /api/admin/pins` routes exist
- Community board likely shows pinned queries

But there's no UI to manage them.

## What Needs to Be Built

- List all pinned items (queries, FAQs, community posts)
- Pin/Unpin toggle from the admin UI
- Pin creation with optional expiry date
- Unpin shortcut from the admin overview

---

# 🟡 P1 — `WikiPage.jsx` is Empty / Placeholder

**Labels:** `enhancement`, `priority:medium`

## Description

The `/wiki` route renders an empty or placeholder page. There's no wiki functionality implemented at all despite having a dedicated route.

## Questions to Answer Before Building

1. Is the wiki a static content page (markdown rendered from a file)?
2. Or a user-editable wiki with its own CRUD?
3. What content should it contain?

---

# 🟢 P2 — No Way to Promote a User to Admin via UI

**Labels:** `enhancement`, `priority:medium`

## Description

The admin dashboard's "Users" tab shows all users and can ban/unban them, but there is **no way to change a user's role** from `user` to `admin`.

Currently the only way to make someone an admin is directly in MongoDB:
```js
db.users.updateOne({ email: "user@example.com" }, { $set: { role: "admin" } })
```

## What Needs to Be Built

- Add a "Role" dropdown or toggle in the Users tab per user
- `PATCH /api/admin/users/:id/role` endpoint on the server
- Or: change role inline with a confirmation dialog

---

# 🟢 P2 — FAQ.txt Path is Fragile

**Labels:** `bug`, `priority:low`

## Description

`parseFaqTxt.js` uses a hardcoded relative path:
```js
const raw = fs.readFileSync(path.join(__dirname, '../../FAQ.txt'), 'utf8');
```

This resolves to `opensourcefaq/FAQ.txt` (parent of `cs16/`), which is confusing. If the file is missing, the error message shows the wrong path. The `FAQ.txt` also had to be manually copied from `FAQ-Team23-backup`.

## Suggested Fix

- Add an environment variable: `FAQ_TXT_PATH`
- Add a startup check: if the file doesn't exist, log a clear error with the expected path
- Document the expected file location in `.env.example`

---

# 🟢 P2 — RAG Chat Has No Conversation History

**Labels:** `enhancement`, `priority:low`

## Description

The RAG chat widget sends each message independently. There's no `sessionId` or conversation context being passed between messages, so each query is treated in isolation.

The `ragChat()` API accepts a `sessionId`:
```js
export const ragChat = (message, sessionId) => api.post('/api/rag/chat', { message, sessionId });
```

But the `RAGChatWidget` likely doesn't track or reuse `sessionId` across messages.

## What Needs to Be Done

- `RAGChatWidget` should generate/retrieve a `sessionId` (from `localStorage`)
- Pass it on every message
- Display the conversation history in the widget

---

*Generated: 2026-05-30*
