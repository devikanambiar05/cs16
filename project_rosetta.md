# 📖 Project Rosetta - Master Development Ledger

Welcome to the **Project Rosetta** master ledger. This document chronicles the version-by-version evolutionary releases of the **Grantha** platform, leading up to our **v0.9 MVP Candidate** launch today. Each milestone records our core feature integrations, architectural advancements, and structural shifts.

---

## 🧭 Release Timeline Summary

| Version | Release Date & Time | Stage | Primary Focus |
| :---: | :--- | :--- | :--- |
| **`v0.01`**| May 28, 2026 - 09:00 | Pre-Alpha | Scaffold initial monorepo structure |
| **`v0.05`**| May 28, 2026 - 15:00 | Pre-Alpha | Express API connection & local Vite link |
| **`v0.1`** | May 28, 2026 - 20:00 | Pre-Alpha | Monorepo Setup & Base Bootstrap Release |
| **`v0.11`**| May 29, 2026 - 09:00 | Pre-Alpha | Initial Mongoose DB schemas design |
| **`v0.12`**| May 29, 2026 - 12:00 | Pre-Alpha | Raw FAQ text seeding script parsing |
| **`v0.13`**| May 29, 2026 - 15:00 | Pre-Alpha | Concurrent database text indexes checks |
| **`v0.2`** | May 29, 2026 - 18:00 | Pre-Alpha | Knowledge Base Schema & Seed Verified |
| **`v0.22`**| May 29, 2026 - 21:00 | Alpha | JWT stateless tokens authentication |
| **`v0.28`**| May 30, 2026 - 09:00 | Alpha | Admin tier authorization middleware checks |
| **`v0.3`** | May 30, 2026 - 12:00 | Alpha | Secure Sessioning & Multi-Role Auth |
| **`v0.35`**| May 30, 2026 - 16:00 | Alpha | Community board lists open queries routes |
| **`v0.4`** | May 30, 2026 - 20:00 | Alpha | Q&A Forum, RichText Editor, & Claim Locks |
| **`v0.45`**| May 31, 2026 - 09:00 | Beta | Vetting triggers & convert answer flow |
| **`v0.5`** | May 31, 2026 - 12:00 | Beta | FAQ Vetting & Admin Moderation Queues |
| **`v0.55`**| May 31, 2026 - 15:00 | Beta | Reputation calculators & level tier metrics |
| **`v0.6`** | May 31, 2026 - 18:00 | Beta | Reputation Levels & Gamified Badges |
| **`v0.612`**|May 31, 2026 - 21:00 | Beta | Granular profiling of reputation milestones |
| **`v0.7`** | June 01, 2026 - 09:00 | Release Candidate | Conversational RAG AI Chatbot Assistant |
| **`v0.75`**| June 01, 2026 - 13:00 | Release Candidate | Stream Abort controller connection listeners |
| **`v0.8`** | June 01, 2026 - 17:00 | Release Candidate | Memory cache caps & relaxed global API limits |
| **`v0.85`**| June 02, 2026 - 09:00 | MVP Candidate | UI/UX Refinements, Visual highlights, & click previews |
| **`v0.9`** | June 02, 2026 - 12:00 | MVP Candidate | MVP Candidate Launch - auto-assign workflows & Admin dashboard |

---

## 📦 Version History logs

### 🎓 v0.01: Scaffold initial monorepo structure
* **Release Date**: May 28, 2026 - 09:00
* **Details**: Scaffold baseline file-trees and initialize repository packages.

### 🔌 v0.05: Express API connection & local Vite link
* **Release Date**: May 28, 2026 - 15:00
* **Details**: Establish local REST networking endpoints between node server and client.

### 📦 v0.1: Monorepo Setup & Base Bootstrap Release
* **Release Date**: May 28, 2026 - 20:00
* **Details**: Baseline pre-alpha release verifying clean monorepo builds.

### 📐 v0.11: Initial Mongoose DB schemas design
* **Release Date**: May 29, 2026 - 09:00
* **Details**: Design schemas for active models (`User`, `FAQ`, `Query`, `Pin`).

### 📂 v0.12: Raw FAQ text seeding script parsing
* **Release Date**: May 29, 2026 - 12:00
* **Details**: Build parser to migrate raw unstructured text documents to Mongo.

### 🔍 v0.13: Concurrent database text indexes checks
* **Release Date**: May 29, 2026 - 15:00
* **Details**: Sync full-text search indexes on Mongo initialization to prevent searches crash.

### 🗄️ v0.2: Knowledge Base Schema & Seed Verified
* **Release Date**: May 29, 2026 - 18:00
* **Details**: Full pre-alpha release verifying complete DB seeding and search indexes.

### 🔐 v0.22: JWT stateless tokens authentication
* **Release Date**: May 29, 2026 - 21:00
* **Details**: Implement stateless JSON Web Token cookies exchange.

### 🛡️ v0.28: Admin tier authorization middleware checks
* **Release Date**: May 30, 2026 - 09:00
* **Details**: Guard REST routes against unauthorized role manipulations.

### 🔑 v0.3: Secure Sessioning & Multi-Role Auth
* **Release Date**: May 30, 2026 - 12:00
* **Details**: Full Alpha release enabling Guest, Member, and Admin sessioning.

### 📋 v0.35: Community board lists open queries routes
* **Release Date**: May 30, 2026 - 16:00
* **Details**: Construct backend endpoints to retrieve open peer questions feed.

### 🤝 v0.4: Q&A Forum, RichText Editor, & Claim Locks
* **Release Date**: May 30, 2026 - 20:00
* **Details**: Full Alpha release with RichText editor image uploads and Claim locks.

### 🧪 v0.45: Vetting triggers & convert answer flow
* **Release Date**: May 31, 2026 - 09:00
* **Details**: Link accepted community answers to pending FAQ Request conversions.

### 🛡️ v0.5: FAQ Vetting & Admin Moderation Queues
* **Release Date**: May 31, 2026 - 12:00
* **Details**: Full Beta release implementing admin vetting queue and soft-deletes.

### 📊 v0.55: Reputation calculators & level tier metrics
* **Release Date**: May 31, 2026 - 15:00
* **Details**: Formulate reputation tiers and gamified milestones.

### 🏆 v0.6: Reputation Levels & Gamified Badges
* **Release Date**: May 31, 2026 - 18:00
* **Details**: Full Beta release implementing progressive Levels 1-4 and Profile achievement shelves.

### 🌳 v0.612: Granular profiling of reputation milestones
* **Release Date**: May 31, 2026 - 21:00
* **Details**: Elite verification detailing progressive badge limits (Highly granular).

### 💬 v0.7: Conversational RAG AI Chatbot Assistant
* **Release Date**: June 01, 2026 - 09:00
* **Details**: Full RC release integrating floating Ollama LLM conversation streams.

### 🛑 v0.75: Stream Abort controller connection listeners
* **Release Date**: June 01, 2026 - 13:00
* **Details**: Save server memory cycles by instantly terminating Ollama runs on tab close.

### 🔒 v0.8: Memory cache caps & relaxed global API limits
* **Release Date**: June 01, 2026 - 17:00
* **Details**: Full RC release clamping RAG cache sizes and relaxing rate limits (1000reqs).

### 🎨 v0.85: UI/UX Refinements, Visual highlights, & click previews
* **Release Date**: June 02, 2026 - 09:00
* **Details**: visual query card highlights, volunteer analytics success tooltips, and click-to-view markdown image modal zooms.

### 🚀 v0.9: MVP Candidate Launch - auto-assign workflows & Admin dashboard
* **Release Date**: June 02, 2026 - 12:00
* **Details**: Complete MVP Candidate launch introducing auto-assign Actions workflow and premium Obsidian Pins dashboard with Hex ObjectId regex validations.
