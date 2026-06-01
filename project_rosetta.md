# 📖 Project Rosetta - Master Development Ledger

Welcome to the **Project Rosetta** master ledger. This document chronicles the version-by-version evolutionary releases of the **Grantha** platform, leading up to our **v1.0 MVP** launch. Each milestone records our core feature integrations, architectural advancements, and structural shifts.

---

## 🧭 Release Timeline Summary

| Version | Release Date | Stage | Primary Focus |
| :---: | :--- | :--- | :--- |
| **`v0.1`** | May 02, 2026 | Pre-Alpha | Monorepo Setup & Server Bootstrapping |
| **`v0.2`** | May 05, 2026 | Pre-Alpha | Database Modeling & Seeding Engines |
| **`v0.3`** | May 08, 2026 | Alpha | Secure Sessioning & Multi-Role Auth |
| **`v0.4`** | May 12, 2026 | Alpha | Collaborative Q&A Forum & Claims System |
| **`v0.5`** | May 16, 2026 | Beta | FAQ Vetting & Admin Moderation Queues |
| **`v0.6`** | May 20, 2026 | Beta | Reputation Levels & Gamified Badging |
| **`v0.7`** | May 24, 2026 | Release Candidate | Conversational RAG AI Chatbot Assistant |
| **`v0.8`** | May 27, 2026 | Release Candidate | Resource Safety, Abort Signals, & Limits |
| **`v0.9`** | May 30, 2026 | MVP Candidate | UI/UX Refinements & Click-to-View Previews |
| **`v1.0`** | June 02, 2026 | MVP Launch | GitHub Actions Workflows & Admin Dashboards |

---

## 📦 Version History logs

### 🎓 v0.1: Foundations & Monorepo Bootstrap
* **Release Date**: May 02, 2026
* **Objective**: Scaffold the standard codebase structure and initialize the Node.js server and Vite React client shells.
* **Key Achievements**:
  * Scaffolds the dual-directory structure (`/client` and `/server`).
  * Structured root `package.json` scripting for seamless parallel local dev startups (`npm run dev`).
  * Verified baseline Express.js server router connections and health checks on port `5000`.
  * Scaffolded initial Tailwind base layers and default landing routes on the React frontend.

---

### 🗄️ v0.2: Database Modeling & Seeding Engines
* **Release Date**: May 05, 2026
* **Objective**: Design the Mongo schemas and build a robust parsing engine to populate the database with original student FAQs.
* **Key Achievements**:
  * Designed schemas for `User.js`, `FAQ.js`, `Query.js`, and `Pin.js` using Mongoose.
  * Engineered `parseFaqTxt.js` to parse raw text FAQs containing tags, categories, questions, and final answers.
  * Added automated database full-text search indexes (`title` and `description` text indexes) inside Mongoose models to allow lexical pre-filtering.

---

### 🔑 v0.3: Secure Sessioning & Multi-Role Auth
* **Release Date**: May 08, 2026
* **Objective**: Build a secure account system supporting stateless sessions and role authorization.
* **Key Achievements**:
  * Integrated JSON Web Tokens (JWT) for secure, stateless user session verification.
  * Implemented password salting and hashing using `bcryptjs`.
  * Outfitted routers with `protect` and `adminOnly` middlewares.
  * Standardized three authorization tiers: **Guests** (read-only FAQs), **Members** (raise queries/bookmark), and **Admins** (moderate/pin content).

---

### 🤝 v0.4: Collaborative Q&A Forum & Claims System
* **Release Date**: May 12, 2026
* **Objective**: Introduce community Q&A features to allow peer-driven knowledge gathering.
* **Key Achievements**:
  * Built the main **Community Board** displaying open student questions.
  * Engineered a secure, atomic **Claim-to-Answer** locking mechanism (`claimQuery` and `releaseQuery`) to prevent redundant work by responders.
  * Integrated a custom Markdown rich-text editor (`RichTextEditor.jsx`) supporting bold, italic, and upload-capable image embedding.

---

### 🛡️ v0.5: FAQ Vetting & Admin Moderation Queues
* **Release Date**: May 16, 2026
* **Objective**: Close the loop between community-sourced answers and official verified FAQs.
* **Key Achievements**:
  * Enabled admins to accept answers, automatically closing the original query and converting the solution into a pending FAQ Request.
  * Designed the Admin Moderation Queue dashboard tab to approve or reject pending FAQ additions.
  * Added soft-deletion fields (`deletedAt`) to FAQ schemas, permitting admins to hide documents without destroying audit trails.

---

### 🏆 v0.6: Reputation Levels & Gamified Badging
* **Release Date**: May 20, 2026
* **Objective**: Design and build a progressive volunteering system to incentivize high-quality responder contributions.
* **Key Achievements**:
  * Implemented central gamification reputation formulas:
    * **Lvl 1: Volunteer** 🎓 (Base tier)
    * **Lvl 2: Expert Responder** 🛡️ (100+ rep & 3+ accepted answers)
    * **Lvl 3: Elite Scholar** 🧠 (300+ rep & 10+ accepted answers)
    * **Lvl 4: Grantha Master** 🌳 (800+ rep & 25+ accepted answers)
  * Integrated five earned achievement badges: **Fast Responder** ⚡, **First Citizen** 🥇, **Peer Mentor** 🤝, **SLA Champion** 🏆, and **Popular Voice** 🔥.
  * Created a dedicated "Achievements Shelf" inside the user Profile Page with progress bars and dynamic tooltip descriptions.

---

### 💬 v0.7: Conversational RAG AI Chatbot Assistant
* **Release Date**: May 24, 2026
* **Objective**: Incorporate an intelligent LLM assistant to let users self-serve query answers instantly.
* **Key Achievements**:
  * Built a hybrid semantic retrieval search controller (`ragController.js`) utilizing local `Ollama` language generation.
  * Designed a floating, draggable conversation panel and launcher bar (`RAGChatWidget.jsx`) pinned at the viewport bottom.
  * Configured in-place expandable reference cards showing the exact source FAQs used to formulate the AI's response.

---

### 🔒 v0.8: Resource Safety, Abort Signals, & Limits
* **Release Date**: May 27, 2026
* **Objective**: Guard the platform against resource depletion, memory leaks, and excessive request polling.
* **Key Achievements**:
  * Implemented client `close` event listeners to dispatch `AbortController.abort()` to Ollama, instantly freeing GPU/CPU cycles if the chat is closed.
  * Capped semantic RAG caching to a lightweight 150-entry threshold to safeguard Node process memory.
  * Relaxed global API rate limits (`RATE_LIMIT_MAX=1000` per 15 minutes) and optimized notifications background polling intervals to prevent false rate-limit blockages.

---

### 🎨 v0.9: UI/UX Refinements & Click-to-View Previews
* **Release Date**: May 30, 2026
* **Objective**: Refine frontend user flows, resolve rendering bugs, and introduce click-to-zoom images.
* **Key Achievements**:
  * Added visual query pulse animation highlights that scroll new queries into center view for 2 seconds.
  * Designed an automatic **"Analytics Unlocked"** success tooltip popover floating under the profile menu upon onboarding.
  * Bound image clicks inside the `<MarkdownContent />` renderer to launch a blurred backdrop modal overlay (`animate-zoom-in`), keeping descriptions clean.
  * Decoupled Category bevel selections from Pinned FAQs so pinned FAQs remain sticky at the top of the feed across all filters.

---

### 🚀 v1.0: GitHub Actions Workflows & Admin Dashboards
* **Release Date**: June 02, 2026
* **Objective**: Launch the MVP with automated issue workflows, robust admin panels, and Project Rosetta tracking.
* **Key Achievements**:
  * Created `.github/workflows/auto-assign.yml` to support automated issue creator assignment and comment-based self-assignment triggers (`/assign` / `.take`).
  * Redesigned the Admin Pins dashboard tab into high-fidelity Obsidian Bronze card grids.
  * Enabled full editing of pin fields (Type, FAQ ID, Title, Content, Order) and built client-side hexadecimal regex checks to prevent Mongoose ObjectId crashes.
  * Completed the **Project Rosetta Changelog Ledger** to act as the primary evolutionary system document.
