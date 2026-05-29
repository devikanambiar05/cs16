# FAQ App — Crowd-Sourced FAQ Management

A MERN stack application where users search FAQs, raise queries, and get community answers.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router
- **Backend:** Express.js, MongoDB (Mongoose), JWT Auth
- **Styling:** Tailwind CSS

## 3 Main Pages

### Page 1: FAQs Page (`/`)
- Full-text search across all FAQs
- Trending FAQs section (most upvoted)
- Sort by recent or popular
- Upvote useful FAQs
- Tag-based filtering

### Page 2: Community Answers (`/community`)
- Browse open/answered queries
- Submit answers to queries
- Upvote answers
- Accept answer (query owner only)

### Page 3: Raise Query (`/ask`)
- Submit new questions
- Similar FAQ detection (while typing)
- Tag support
- Duplicate prevention

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Install Dependencies

```bash
cd FAQ App-faq-app
npm install && cd server && npm install && cd ../client && npm install
```

Or with concurrently:
```bash
npm run install:all
```

### 2. Configure Database

Edit `server/.env`:
```
MONGO_URI=mongodb://localhost:27017/FAQ App
PORT=5000
JWT_SECRET=your-secret-key
```

### 3. Seed Sample Data

```bash
npm run seed
```

This reads `FAQ.txt` from the project root and seeds all FAQs automatically.

### 4. Run Servers

```bash
# In separate terminals:
cd server && npm run dev    # API on :5000
cd client && npm run dev    # UI on :3000

# Or both together:
npm run dev
```

### 5. Open App

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@faqapp.com | admin123 |

## API Endpoints

### Auth
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### FAQs
- `GET /api/faqs` - List FAQs (params: q, sort, tag, page)
- `GET /api/faqs/trending` - Trending FAQs
- `GET /api/faqs/:id` - Single FAQ
- `POST /api/faqs/:id/upvote` - Upvote FAQ
- `POST /api/faqs` - Create FAQ

### Queries
- `GET /api/queries` - List queries (params: status, sort, page)
- `GET /api/queries/:id` - Single query with answers
- `POST /api/queries` - Raise new query
- `PATCH /api/queries/:id/close` - Close query

### Answers
- `POST /api/answers` - Submit answer
- `POST /api/answers/:id/upvote` - Upvote answer
- `POST /api/answers/:id/accept` - Accept answer (owner only)
- `PUT /api/answers/:id` - Edit answer
- `DELETE /api/answers/:id` - Delete answer

### Users
- `GET /api/users/leaderboard` - Top users by reputation
- `GET /api/users/:id` - User profile

## Data Models

- **User:** name, email, password, role (user/admin), reputation
- **FAQ:** title, description, finalAnswer, tags, upvotes, status, createdBy
- **Query:** title, description, tags, status (open/answered/closed), createdBy, answerCount
- **Answer:** content, queryId, userId, upvotes, isAccepted

## Features

- ✅ JWT Authentication
- ✅ Full-text search (MongoDB text indexes)
- ✅ Upvotes with reputation system
- ✅ Accepted answers
- ✅ Similar FAQ detection (on query raise)
- ✅ Tag filtering
- ✅ Responsive Tailwind UI
- ✅ Leaderboard
- ✅ Duplicate detection
- ✅ Community voting

## Project Structure

```
faq-app/
├── client/
│   ├── src/
│   │   ├── components/Layout.jsx
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── FAQsPage.jsx
│   │   │   ├── CommunityPage.jsx
│   │   │   ├── RaiseQueryPage.jsx
│   │   │   └── LoginPage.jsx
│   │   ├── services/api.js
│   │   └── App.jsx
│   └── package.json
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/auth.js
│   ├── seed.js
│   └── server.js
└── package.json
```

---

*FAQ App — Knowledge shared is knowledge multiplied.*