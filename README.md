
<div align="center">
  <img src="./client/src/assets/grantha.png" alt="Granth Logo" width="100%" />
    A Crowd-Sourced FAQ & Knowledge Base
    <br><br>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-6366f1?style=for-the-badge" alt="Version 1.0.0" />
  <img src="https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge" alt="License MIT" />
  <img src="https://img.shields.io/badge/Build-Passing-success?style=for-the-badge" alt="Build Status" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=20232A" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/MongoDB-7-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
</p>

---

## 📖 Introduction

**Granth** is a crowd-sourced MERN stack FAQ management and community learning platform. Designed with sleek visuals, dark mode compatibility, and high interactivity, Granth allows community members to search for FAQs, raise peer-to-peer queries, upvote answers, and unlock gamified reputation scores. 

Granth also features a state-of-the-art **RAG (Retrieval-Augmented Generation) Chat Widget** that queries the local database and streams semantic FAQ answers directly to users in real-time, accompanied by a custom fading bottom mask for smooth scrolling physics.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies & Implementations |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, CSS Canvas Transitions, Dynamic Dark/Light Mode. |
| **Backend** | Express.js REST API, Node.js, JWT Authentication (`x-auth-token` headers), Express Rate Limiting. |
| **Database** | MongoDB & Mongoose schemas with custom collection indexing. |
| **AI (RAG)** | Custom Chunk-level text similarity search + stream-buffer response. |
| **Search Engine**| Advanced case-insensitive regex-based partial and substring matching query pipeline. |

---

## ✨ Key Features

### For Members
* **Instant Substring Search**: Instantly look up FAQs with smart, partial-word search that matches titles, answers, and tags.
* **Community Forum**: Ask open questions, submit answers, and mark verified solutions.
* **Reputation System**: Earn reputation points (+10 on accepted answers, +2 per upvote) displayed on a global leaderboard.
* **AI FAQ Assistant**: Floating RAG-based AI chat bot with ChatGPT-style streaming text blocks and modern fading viewport masks.
* **Duplicate Prevention**: Detects similar queries before submission using a hybrid similarity algorithm.

### For Administrators
* **Moderation Console**: Verify answers, ban bad actors, and resolve pending query logs.
* **Hero Spotlights**: Pin Announcements, system Overviews, or high-value FAQs to the home landing board.
* **Audit Trails**: Complete historical version tracking (`FAQHistory`) for edited FAQs to capture prior revisions and reasons.
* **Response Breaches**: Automated systems to detect, track, and close stale, unfulfilled query claims.

---

## 🚀 Quick Start

### Local Setup (Concurrency Mode)
```bash
npm run setup   # Install dependencies & configure .env (first-time only)
npm run dev     # Run both Server & Client concurrently
```
* **Frontend:** [http://localhost:5173](http://localhost:5173)
* **API Server:** [http://localhost:5000](http://localhost:5000)

---

### Docker Setup (Containerized Mode)
```bash
npm run docker:dev    # Build & run Client, Server, & MongoDB stack
npm run docker:down   # Stop all running containers
```

---

### Admin Credentials (Auto-Seeded)
* **Email:** `admin@faqapp.com`
* **Password:** `admin123`

---


## 📌 Directory Structure

```
cs16/
├── client/
│   └── src/
│       ├── components/
│       │   ├── Layout.jsx          # Header, footer, & platform branding
│       │   ├── CommunityBoard.jsx  # Pinned announcements carousel
│       │   ├── RAGChatWidget.jsx   # AI assistant with viewport gradient mask
│       │   ├── RichTextEditor.jsx  # Markdown editor with image clipboard support
│       │   └── TagInput.jsx        # Chip-style tag selector
│       └── pages/
│           ├── FAQsPage.jsx        # FAQ search and topic browser
│           ├── CommunityPage.jsx   # Q&A board
│           ├── LeaderboardPage.jsx # Gamified rankings
│           └── AdminDashboard.jsx  # Moderation analytics and pins
└── server/
    ├── controllers/            # Auth, FAQ, Query, Search & RAG logic
    ├── models/                 # Mongoose Schemas (FAQ, User, Query, Answer, FAQHistory)
    ├── seed.js                 # Database seeder script
    └── tests/                  # Jest tests
```

---

## 👥 Cohort Team Members

The **Grantha** platform was designed, built, and optimized by the following cohort members under the **Vicharanashala Lab for Education Design** at the **Indian Institute of Technology Ropar**:

| Name | Email ID |
| :--- | :--- |
| **Vaibhav Satish (Lead)** | vaibhavsatish9@gmail.com |
| **Hasti Lakhani** | hastilakhani569@gmail.com |
| **Rohit Rathia** | rohitrathia2@gmail.com |
| **Rekha Sree** | rekhasree4545@gmail.com |
| **Sri Lakshmi** | ksrilakshmi459@gmail.com |
| **Nishita Rajpurohit** | rajpurohitnishita33@gmail.com |
| **Devika Nambiar** | devikanambiar05@gmail.com |
| **Tanishka Sharma** | tanishka130506@gmail.com |
| **Kratika Varshney** | kratikavarshney1607@gmail.com |
| **Bithika Jain** | bithika.jainn@gmail.com |
| **Laxmi Parmanandani** | lajjakhatri@gmail.com |

---

## 🛡️ License
Granth is licensed under the [MIT License](LICENSE). Built with ❤️ by Vicharanashala.