# FAQ App — Community FAQ Knowledge Base

![License](https://img.shields.io/github/license/vicharanashala/cs16?style=flat-square&color=6366f1)
![Last Commit](https://img.shields.io/github/last-commit/vicharanashala/cs16/main?style=flat-square&color=6366f1)
![Commits](https://img.shields.io/github/commit-activity/t/vicharanashala/cs16?style=flat-square&color=6366f1)
![Issues](https://img.shields.io/github/issues/vicharanashala/cs16?style=flat-square&color=6366f1)
![Pull Requests](https://img.shields.io/github/issues-pr/vicharanashala/cs16?style=flat-square&color=6366f1)

![Node](https://img.shields.io/badge/node-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/react-18-61DAFB?style=flat-square&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)
![MongoDB](https://img.shields.io/badge/mongodb-7-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/express-5-000000?style=flat-square&logo=express&logoColor=white)

A MERN stack application where users search FAQs, raise queries, and receive community answers. Includes an admin dashboard for content moderation, a RAG-powered chat assistant, and a gamified reputation system.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Express.js, MongoDB (Mongoose), JWT Auth |
| Real-time | RAG Chat Widget (semantic search over FAQ corpus) |
| Auth | bcrypt, JWT (x-auth-token + Bearer header support) |

## Features

### For Users
- Browse and search FAQs grouped by topic
- Raise queries with similar FAQ detection (prevents duplicates)
- Submit, upvote, and accept answers in the community forum
- Upvote FAQs
- Leaderboard ranked by reputation
- RAG chat widget (searches entire FAQ knowledge base)

### For Admins
- Admin Dashboard with analytics overview (query volume, SLA stats, community scores)
- Pin announcements, overview posts, and specific FAQs to the home page
- Soft-delete / restore FAQs and queries
- Edit FAQ final answers with full audit trail (FAQHistory)
- Ban / unban users
- Convert resolved queries to FAQs
- Close stale queries (SLA breach detection)
- Moderation queue for flagged content

### Gamification
- Reputation system: +10 for accepted answers, +2 per FAQ/answer upvote, +20 for accepted answers, -20 on un-acceptance
- Upvote rate-limiting (max 2 upvotes from same user to same author in 24h — anti-collusion via UpvoteLog)
- Escalation tracking on stale claims (escalationCount, escalatedAt)

## Pages

| Route | Page | Auth |
|---|---|---|
| `/` | FAQs (grouped by topic, search, tag filter) | Public |
| `/community` | Community forum (queries + answers) | Public |
| `/leaderboard` | Top users by reputation | Public |
| `/ask` | Raise a query | Protected |
| `/login` | Login / Register | Public |
| `/admin` | Admin Dashboard | Admin only |

## Quick Start

### 1. Install Dependencies

```bash
npm run install:all   # installs client + server deps
```

### 2. Configure Environment

```bash
cp server/.env.example server/.env
# Edit server/.env — defaults:
#   MONGO_URI=mongodb://localhost:27017/faqapp
#   JWT_SECRET=your-secret-key
#   PORT=5000
#   RESET_DB=false   # set true only to wipe and reseed
```

### 3. Seed Data

```bash
npm run seed           # seeds admin user + FAQs from server/FAQ.txt
# Credentials: admin@faqapp.com / admin123
```

### 4. Run

```bash
npm run dev            # starts both client (:5173) and server (:5000) concurrently
# Or separately:
cd server && npm run dev
cd client && npm run dev
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/forgot-password` | Request reset |
| POST | `/api/auth/reset-password` | Reset with token |
| GET | `/api/auth/verify-email` | Verify email token |

### FAQs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/faqs` | List (params: q, tag, page, limit) |
| GET | `/api/faqs/trending` | Most upvoted |
| GET | `/api/faqs/pins` | Pinned FAQs |
| GET | `/api/faqs/:id` | Single FAQ |
| POST | `/api/faqs/:id/upvote` | Upvote |

### Admin FAQs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/faqs` | Paginated list (params: page, limit, status, search, tag) |
| PATCH | `/api/admin/faqs/:id` | Update finalAnswer (creates FAQHistory audit) or soft-delete/restore |
| PATCH | `/api/admin/pins/:id` | Update pin (order, title, content) |
| DELETE | `/api/admin/pins/:id` | Remove pin |

### Queries
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/queries` | List (params: status, sort, page, limit, q) |
| GET | `/api/queries/sla/stats` | SLA breach statistics |
| GET | `/api/queries/community-candidates` | Hot queries by communityScore |
| GET | `/api/queries/:id` | Single query + answers |
| POST | `/api/queries` | Raise query |
| POST | `/api/queries/:id/claim` | Claim (24h SLA; atomic — prevents race conditions) |
| POST | `/api/queries/:id/release` | Release claim |
| PATCH | `/api/queries/:id` | Owner edit (title, description, tags) |
| PATCH | `/api/queries/:id/close` | Close query |
| GET | `/api/admin/sla-stale-claims` | Release all stale claims |

### Answers
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/queries/:id/answers` | Submit answer |
| POST | `/api/answers/:id/upvote` | Upvote (rate-limited) |
| POST | `/api/answers/:id/accept` | Accept (owner only) |
| PATCH | `/api/answers/:id` | Edit answer |
| DELETE | `/api/answers/:id` | Delete (reverses rep) |
| POST | `/api/admin/answers/:id/vet` | Admin verify answer |

### Admin Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/analytics` | Dashboard stats |
| GET | `/api/admin/moderation` | Moderation queue |
| GET | `/api/admin/pins` | All pins |

### Search
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/search/similar` | Similar FAQ detection (BM25 + tag hybrid scoring) |
| GET | `/api/search/detect-tags` | Tag detection from text |
| POST | `/api/rag/chat` | RAG chat (semantic FAQ search) |

## Data Models

### User
```
name, email, password, role (user/admin), reputation,
isVerified, isBanned, acceptedAnswersCount, answersGiven
```

### FAQ
```
title, description, finalAnswer, tags, upvotes,
status (open/resolved/duplicate), createdBy,
mergedFrom, mergedInto, duplicateOf, deletedAt
```

### Query
```
title, description, tags, status (open/claimed/answered/closed),
createdBy, assignedTo, acceptedAnswer, communityScore,
expiresAt, escalationCount, escalatedAt, lastActivityAt
```

### Answer
```
queryId, userId, content, upvotes, upvotedBy,
isAccepted, isVetted, createdAt, updatedAt
```

### FAQHistory (audit trail)
```
faq, editedBy, previousTitle/Description/FinalAnswer/Tags,
newTitle/Description/FinalAnswer/Tags, reason, createdAt
```

### UpvoteLog (anti-collusion)
```
upvoter, targetAuthor, targetType (faq/answer), targetId, createdAt
```

## Project Structure

```
cs16/
├── client/
│   └── src/
│       ├── components/
│       │   ├── Layout.jsx          # Navbar, footer, RAG chat widget
│       │   ├── CommunityBoard.jsx  # Pinned posts on FAQ home
│       │   ├── RAGChatWidget.jsx   # RAG-powered chat assistant
│       │   ├── RichTextEditor.jsx  # Markdown editor with image paste
│       │   ├── TagInput.jsx        # Chip-based tag input
│       │   ├── ToastProvider.jsx   # Toast notification system
│       │   └── ProtectedRoute.jsx  # Auth + role guard
│       ├── context/
│       │   ├── AuthContext.jsx     # User state, login/logout
│       │   └── ThemeContext.jsx    # Dark/light mode
│       ├── pages/
│       │   ├── FAQsPage.jsx        # Merged FAQ + Wiki view
│       │   ├── CommunityPage.jsx   # Query/answer forum
│       │   ├── RaiseQueryPage.jsx   # Query submission
│       │   ├── LoginPage.jsx        # Auth
│       │   ├── LeaderboardPage.jsx  # Reputation ranking
│       │   └── AdminDashboard.jsx   # Admin panel (pins, users, stats)
│       ├── services/api.js          # All API calls
│       └── App.jsx
├── server/
│   ├── controllers/    # Query, FAQ, Answer, User, Auth, Admin, Search, RAG
│   ├── models/          # Mongoose schemas (User, FAQ, Query, Answer, etc.)
│   ├── routes/          # Express routes
│   ├── middleware/      # auth (protect, adminOnly)
│   ├── utils/           # jwtHelper, connectDB
│   ├── seed.js          # Seeds admin + FAQs from FAQ.txt
│   ├── parseFaqTxt.js   # Parser for FAQ.txt format
│   └── tests/           # Jest + property-based tests (api.test.js, gamification.test.js)
└── package.json
```

## Demo Account

| Role | Email | Password |
|---|---|---|
| Admin | admin@faqapp.com | admin123 |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MONGO_URI` | `mongodb://localhost:27017/faqapp` | MongoDB connection |
| `JWT_SECRET` | _(set in .env)_ | JWT signing secret |
| `PORT` | `5000` | Server port |
| `RESET_DB` | `false` | Set `true` to wipe DB and reseed |
| `FRONTEND_URL` | `http://localhost:5173` | CORS origin |