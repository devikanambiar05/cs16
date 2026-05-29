# Contributing to FAQ App

Thank you for your interest in contributing! This document covers how to set up, develop, and submit changes to the project.

---

## Development Setup

### 1. Fork and Clone

```bash
git clone https://github.com/vicharanashala/cs16.git
cd cs16
```

### 2. Install Dependencies

```bash
npm run install:all
```

### 3. Configure Environment

```bash
cp server/.env.example server/.env
# Edit server/.env and set:
#   MONGO_URI=mongodb://localhost:27017/faqapp
#   JWT_SECRET=<your-secret>
#   RESET_DB=false
```

### 4. Seed the Database

```bash
npm run seed
# Creates admin user: admin@faqapp.com / admin123
```

### 5. Run Development Servers

```bash
npm run dev
# Client: http://localhost:5173
# Server: http://localhost:5000
```

---

## Workflow

### Branch Naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/<short-description>` | `feat/add-oauth-login` |
| Bug fix | `fix/<issue-description>` | `fix/query-claim-race` |
| Refactor | `refactor/<area>` | `refactor/answer-controller` |
| Test | `test/<area>` | `test/add-property-tests` |
| Docs | `docs/<area>` | `docs/update-api-ref` |

### Making Changes

```bash
git checkout -b feat/my-new-feature
# ... make changes ...
git add .
git commit -m "feat: add something useful"
git push origin feat/my-new-feature
```

### Commit Message Format

```
<type>: <short summary>

[optional body — explain WHY, not just WHAT]
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`

Examples:
```
fix: prevent race condition in query claim endpoint
feat: add FAQ history audit trail for admin edits
docs: update API reference for SLA stale-claims route
```

### Opening a Pull Request

1. Push your branch to origin
2. Open a PR against `main`
3. Fill in the PR template (if present)
4. Link any related issues

---

## Code Standards

### Backend (Node.js / Express)

- **Async errors** — always use `try/catch` in async controllers; never let rejected promises propagate uncaught
- **Meaningful errors** — return descriptive error messages: `{ error: 'Query not found' }` not just `err`
- **No `console.log`** in production paths — use a logger or structured error reporting
- **Guard dangerous operations** — `findOneAndUpdate` / `deleteMany` / `deleteOne` should have explicit filters, never empty `{}` that could wipe data
- **Soft deletes first** — prefer setting `deletedAt` over hard deletes where possible
- **Atomic operations** — use `findOneAndUpdate` with conditions for race-sensitive operations (e.g. query claims)

### Frontend (React)

- **No `api.defaults.headers`** — the `api` helper is not Axios; it reads the token from `localStorage` per-request via `getHeaders()`
- **Error boundaries** — wrap new components that access remote data in error boundaries for graceful degradation
- **Prop drilling** — use React Context for shared state (auth, theme), not manual prop chains
- **No `alert()`** — use the `ToastProvider` / `useToast()` hook for user feedback
- **URL parameters for deep links** — use `?highlight=:id` on FAQ page for linking to specific FAQs, not `/wiki`

### Database (MongoDB)

- **Indexes** — add compound indexes for frequent co-occurring filters (e.g. `{ status: 1, deletedAt: 1 }` on Query)
- **No N+1 queries** — use `$lookup` aggregation stages instead of `Promise.all` with `find()` inside loops
- **Transactions** — if two writes must succeed or fail together, use a MongoDB transaction

---

## Testing

### Run All Tests

```bash
cd server && npm test
```

### Adding Tests

- **API tests** — add to `server/tests/api.test.js`
- **Property-based tests** — add to `server/tests/gamification.test.js`
- **New test file** — import `request` from `supertest` and the Express `app`

### Pattern for API Tests

```javascript
it('should do something', async () => {
  const res = await request(app)
    .METHOD('/api/path')
    .set('Authorization', `Bearer ${token}`)
    .send({ field: 'value' });

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('key');
});
```

### Pattern for Property Tests

```javascript
it('rep invariant: deleting answer reverses upvote rep', async () => {
  const q = await Query.create({ title: 'prop test', status: 'open', expiresAt: new Date() });
  const a = await Answer.create({ queryId: q._id, userId: user._id, content: 'test', upvotes: 5 });
  const authorBefore = await User.findById(user._id);
  await deleteAnswer(a._id, { user: adminUser });
  const authorAfter = await User.findById(user._id);
  expect(authorAfter.reputation).toBe(authorBefore.reputation - 10); // 5 upvotes × 2
});
```

---

## File Conventions

| File | Convention |
|---|---|
| Server controllers | `exports.functionName` (named exports) |
| Server routes | `router.METHOD('/path', protect, adminOnly, controller.functionName)` |
| API service functions | `camelCase` named exports: `getFAQs`, `patchFaq`, `updatePin` |
| React components | PascalCase, one per file, file name matches component name |
| Models | Singular, capitalized: `FAQ.js`, `Query.js` |

---

## Security Notes

- **JWT secret** — never commit `.env`; use `.env.example` for defaults only
- **CORS** — `FRONTEND_URL` must match the client origin exactly; wildcard `*` is never used in production
- **Rate limiting** — upvote rate-limiting is enforced server-side via `UpvoteLog`; do not rely solely on UI
- **Admin routes** — always use `adminOnly` middleware; never trust `role` from client payload
- **No eval** — never use `eval()` or dynamic `Function()` with user input

---

## Seed Data Guidelines

- `FAQ.txt` uses a specific format: `===` separates TOC from Q&A, question IDs must match exactly
- The `RESET_DB` env var must be `true` to perform a destructive reseed; without it, seed only creates the admin user
- Do not run `npm run seed` in shared dev environments without `RESET_DB=true`

---

## Questions?

Open an issue on GitHub or reach out to the maintainers.