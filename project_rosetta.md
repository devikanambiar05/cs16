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
* **🎨 Visual Wireframe & Layout**: Clean, standard console-driven folder structures with dedicated `client/` and `server/` directories, keeping workspace boundaries decoupled.
* **🧠 Team Thinking & Rationale**: A clean monorepo setup ensures that database schemas, utility helper functions, and build scripts can be easily maintained and shared between teams in the future.
* **💬 Discussions & Decisions**: Evaluated standard `npm workspaces` vs heavy orchestrators like `Lerna`. We opted for a simple, lean project structure utilizing parallelized `package.json` concurrent launch scripts to avoid configuration bloat.
* **⚠️ Errors & Roadblocks Faced**: Deencountered syntax warnings and workspace mapping failures due to a missing root-level `package.json` workspaces list.
* **🛡️ Edge Cases Tested**: Verified that executing `npm install` from the root directory installs all client/server node modules seamlessly without path traversals.

### 🔌 v0.05: Express API connection & local Vite link
* **Release Date**: May 28, 2026 - 15:00
* **Details**: Establish local REST networking endpoints between node server and client.
* **🎨 Visual Wireframe & Layout**: A minimalist placeholder webpage showing an absolute golden indicator lamp: `"API Connection: CONNECTED"`.
* **🧠 Team Thinking & Rationale**: Validating the connection path over CORS early protects the team from discovering late-stage communication mismatches.
* **💬 Discussions & Decisions**: Debated configuring Vite's dev proxy vs absolute environment variables. Decided to utilize direct environment variables to prevent local build caching issues.
* **⚠️ Errors & Roadblocks Faced**: CORS preflight options requests were initially blocked because standard preflight headers were omitted from early Express routers.
* **🛡️ Edge Cases Tested**: Checked fallback responses when the backend server goes offline, ensuring the client UI fails gracefully with a user-facing timeout message.

