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

### 📦 v0.1: Monorepo Setup & Base Bootstrap Release
* **Release Date**: May 28, 2026 - 20:00
* **Details**: Baseline pre-alpha release verifying clean monorepo builds.
* **🎨 Visual Wireframe & Layout**: Base HTML skeleton dashboard rendering static navigation bars with light warm bronze borders.
* **🧠 Team Thinking & Rationale**: Creating a stable pre-alpha tag allows us to begin deploying code changes sequentially with safety rollbacks.
* **💬 Discussions & Decisions**: Debated bundling built assets at this early stage vs using active local live-start node processes. Chose direct local starts.
* **⚠️ Errors & Roadblocks Faced**: Parallel start scripts clashed because of environment-specific port configurations between different local development environments.
* **🛡️ Edge Cases Tested**: Executed simultaneous start scripts under high system memory usage.

### 📐 v0.11: Design DB models and standard schemas
* **Release Date**: May 29, 2026 - 09:00
* **Details**: Design schemas for active models (`User`, `FAQ`, `Query`, `Pin`).
* **🎨 Visual Wireframe & Layout**: Whiteboard schema blocks mapping user credentials, upvote counters, soft delete flags, and category tags.
* **🧠 Team Thinking & Rationale**: The database models form the backbone of the application; they must support gamification reputation, search indexes, and audit logs natively.
* **💬 Discussions & Decisions**: Discussed referencing user objects by ObjectId vs embedding profile details. We decided on referencing to avoid duplicate user profile synchronization overhead.
* **⚠️ Errors & Roadblocks Faced**: Mongoose model initialization crashed due to missing field validations on optional sub-documents.
* **🛡️ Edge Cases Tested**: Validating schemas with missing optional parameters, ensuring defaults (like `reputation: 0` and `pinned: false`) are written correctly.

### 📂 v0.12: Raw FAQ text seeding script parsing
* **Release Date**: May 29, 2026 - 12:00
* **Details**: Build parser to migrate raw unstructured text documents to Mongo.
* **🎨 Visual Wireframe & Layout**: Simple administrative loading indicators showing `[24/48] FAQs Parsed & Migrated` within startup logs.
* **🧠 Team Thinking & Rationale**: To avoid manual content seeding, we created a custom parser that converts raw FAQ text files with standard separation boundaries directly into structured documents.
* **💬 Discussions & Decisions**: Chose between rigid JSON data structures vs a regex-driven plain text parser. We selected the regex parser to accommodate unstructured input files.
* **⚠️ Errors & Roadblocks Faced**: Double newline differences between Windows and Unix formatting (CRLF vs LF) caused the seeding script to group separate paragraphs into single fields.
* **🛡️ Edge Cases Tested**: Parsing text files containing empty lines, invalid category headings, and duplicate question strings.

### 🔍 v0.13: Concurrent database text indexes checks
* **Release Date**: May 29, 2026 - 15:00
* **Details**: Sync full-text search indexes on Mongo initialization to prevent searches crash.
* **🎨 Visual Wireframe & Layout**: Diagnostic console outputs: `"✔ Search text indexes verified on database connection"`.
* **🧠 Team Thinking & Rationale**: Full-text searching will fail at runtime if MongoDB hasn't finished indexing fields. Indexing must be guaranteed on boot.
* **💬 Discussions & Decisions**: Discussed building indexes dynamically upon query arrival vs indexing on startup. We opted for concurrent startup index generation.
* **⚠️ Errors & Roadblocks Faced**: Index building locked subsequent collection writes, crashing the parallel test suites.
* **🛡️ Edge Cases Tested**: Initializing multiple server processes concurrently attempting to write identical search index rules.

### 🗄️ v0.2: Knowledge Base Schema & Seed Verified
* **Release Date**: May 29, 2026 - 18:00
* **Details**: Full pre-alpha release verifying complete DB seeding and search indexes.
* **🎨 Visual Wireframe & Layout**: Responsive sidebar category pills side-by-side with a central list of loaded FAQ cards.
* **🧠 Team Thinking & Rationale**: Establish the primary public interface baseline so we can verify that search inputs match seeded text.
* **💬 Discussions & Decisions**: Decided whether to load all FAQs on mount vs on-demand pagination. Chose to load all FAQs initially for instantaneous clientside filtering.
* **⚠️ Errors & Roadblocks Faced**: Network lag on initial load when querying large text bodies.
* **🛡️ Edge Cases Tested**: Querying categories that have zero active FAQs linked, confirming they render a graceful "No entries found" banner.

### 🔐 v0.22: JWT stateless tokens authentication
* **Release Date**: May 29, 2026 - 21:00
* **Details**: Implement stateless JSON Web Token cookies exchange.
* **🎨 Visual Wireframe & Layout**: High-fidelity sandy/bronze theme login and registration dialog screens.
* **🧠 Team Thinking & Rationale**: Stateful sessions are hard to scale; stateless JWT tokens placed inside HTTP-only cookies prevent XSS theft.
* **💬 Discussions & Decisions**: Debated localStorage tokens vs secure HTTP-only cookies. Selected cookies due to robust script-injection resistance.
* **⚠️ Errors & Roadblocks Faced**: Test suites failed to decrypt session signatures when JWT secret keys were missing from the local environment values.
* **🛡️ Edge Cases Tested**: Handling expired tokens, tampered signatures, and malicious user role injection attempts.

### 🛡️ v0.28: Admin tier authorization middleware checks
* **Release Date**: May 30, 2026 - 09:00
* **Details**: Guard REST routes against unauthorized role manipulations.
* **🎨 Visual Wireframe & Layout**: Admin moderation panels with restricted link badges. Unauthorized users are blocked with clean, absolute red warning screens.
* **🧠 Team Thinking & Rationale**: Security checks must occur on the backend routes; client-side route hiding is easily bypassed.
* **💬 Discussions & Decisions**: Discussed flat roles vs permissions list tables. Opted for a streamlined `role` enum (`guest`, `member`, `admin`) for lightweight checks.
* **⚠️ Errors & Roadblocks Faced**: Unauthenticated guest visits crashed the middleware when trying to evaluate the roles of undefined user profiles.
* **🛡️ Edge Cases Tested**: Non-admin users attempting to POST to the `/api/admin` endpoint with manual tools (like curl or postman).

### 🔑 v0.3: Secure Sessioning & Multi-Role Auth
* **Release Date**: May 30, 2026 - 12:00
* **Details**: Full Alpha release enabling Guest, Member, and Admin sessioning.
* **🎨 Visual Wireframe & Layout**: A dynamic header navbar that updates its controls dynamically based on the current session status.
* **🧠 Team Thinking & Rationale**: Provide a cohesive, unified browsing session that adjusts privileges in real time.
* **💬 Discussions & Decisions**: Chose React context providers vs global Redux stores. Selected a clean custom `AuthContext` to avoid boilerplate.
* **⚠️ Errors & Roadblocks Faced**: Client context suffered from "auth flash"—briefly rendering guest buttons on page refresh before the cookie was verified.
* **🛡️ Edge Cases Tested**: Fast page refreshes, expired session recovery, and multi-tab logout events.

### 📋 v0.35: Construct endpoints to fetch open peer questions feed
* **Release Date**: May 30, 2026 - 16:00
* **Details**: Construct backend endpoints to retrieve open peer questions feed.
* **🎨 Visual Wireframe & Layout**: Split-pane interface displaying open queries lists on the left, and detail cards on the right.
* **🧠 Team Thinking & Rationale**: Set the foundation for peer-to-peer volunteer workflows by exposing unclaimed user questions to qualified responders.
* **💬 Discussions & Decisions**: Decided whether to auto-assign incoming queries to volunteers vs manual claiming. Manual voluntary claiming with 24-hour SLA timers was preferred to encourage engagement.
* **⚠️ Errors & Roadblocks Faced**: Query retrieval queries crashed due to cast conversion errors when formatting dates.
* **🛡️ Edge Cases Tested**: Retrieving query feeds when no user questions are active, ensuring absolute stability.

### 🤝 v0.4: Q&A Forum, RichText Editor, & Claim Locks
* **Release Date**: May 30, 2026 - 20:00
* **Details**: Full Alpha release with RichText editor image uploads and Claim locks.
* **🎨 Visual Wireframe & Layout**: Clean, inline editor pane with styling toolbars, adjacent to dynamic volunteer countdown timers.
* **🧠 Team Thinking & Rationale**: Volunteers need functional layout tools to compose readable answers, but we must protect questions from duplicate volunteer claims.
* **💬 Discussions & Decisions**: Chose between heavy external wysiwyg plugins vs building a targeted markdown text area. Designed a custom lightweight editor for speed.
* **⚠️ Errors & Roadblocks Faced**: Overlapping interval ticks caused active SLA claim timer countdowns to skip numbers.
* **🛡️ Edge Cases Tested**: Multiple volunteers attempting to claim the exact same question at the millisecond scale.

### 🧪 v0.45: Vetting triggers & convert answer flow
* **Release Date**: May 31, 2026 - 09:00
* **Details**: Link accepted community answers to pending FAQ Request conversions.
* **🎨 Visual Wireframe & Layout**: Visual "Verify & Promote" buttons appearing alongside accepted peer responses.
* **🧠 Team Thinking & Rationale**: High-quality community answers represent invaluable knowledge; we need an automated way to convert them into standard platform FAQs.
* **💬 Discussions & Decisions**: Discussed auto-publishing accepted answers vs placing them in a vetting queue. Opted for placing them in a vetting queue for moderator review.
* **⚠️ Errors & Roadblocks Faced**: Redundant database duplicates when double-clicking the promote button rapidly.
* **🛡️ Edge Cases Tested**: Converting answers that contain complex HTML strings or embedded images.

### 🛡️ v0.5: FAQ Vetting & Admin Moderation Queues
* **Release Date**: May 31, 2026 - 12:00
* **Details**: Full Beta release implementing admin vetting queue and soft-deletes.
* **🎨 Visual Wireframe & Layout**: Moderator dashboard listing pending FAQs with interactive edit, approve, and delete inputs.
* **🧠 Team Thinking & Rationale**: Prevent platform defacement by giving admins the power to clean and shape knowledge entries before public release.
* **💬 Discussions & Decisions**: Hard deletes vs soft deletes. Chose soft deletes (updating active status boolean flags) to preserve auditing history.
* **⚠️ Errors & Roadblocks Faced**: Soft-deleted entries continued to appear in full-text search results due to a missing filter flag.
* **🛡️ Edge Cases Tested**: Admin editing and submitting a pending FAQ entry while another admin processes its deletion.

### 📊 v0.55: Reputation calculators & level tier metrics
* **Release Date**: May 31, 2026 - 15:00
* **Details**: Formulate reputation tiers and gamified milestones.
* **🎨 Visual Wireframe & Layout**: Structured gamification matrices in profile sections displaying user progress metrics.
* **🧠 Team Thinking & Rationale**: Gamified engagement metrics drive contribution quality. Higher reputation translates to expert tiers.
* **💬 Discussions & Decisions**: Decided whether to calculate reputation dynamically via collection aggregates vs caching them on user documents. Caching was selected for performance.
* **⚠️ Errors & Roadblocks Faced**: Race conditions when simultaneous upvotes triggered concurrent reputation recalculation writes.
* **🛡️ Edge Cases Tested**: De-upvoting questions, reputation adjustments when answers are soft-deleted by admins.

### 🏆 v0.6: Reputation Levels & Gamified Badges
* **Release Date**: May 31, 2026 - 18:00
* **Details**: Full Beta release implementing progressive Levels 1-4 and Profile achievement shelves.
* **🎨 Visual Wireframe & Layout**: Colorful level pills (e.g. `🛡️ Lvl 2`) and achievement badges displayed in responsive shelves.
* **🧠 Team Thinking & Rationale**: Visual rewards acknowledge the value of community volunteers and provide strong incentives for accuracy.
* **💬 Discussions & Decisions**: Decided on rendering user badges everywhere vs restricting them to profile views. We opted for showing them near answers to build user credibility.
* **⚠️ Errors & Roadblocks Faced**: Complex flexbox layouts broke badge alignments on smaller viewport devices.
* **🛡️ Edge Cases Tested**: A user crossing multiple reputation levels at once on a single high-impact answer approval.

### 🌳 v0.612: Granular profiling of reputation milestones
* **Release Date**: May 31, 2026 - 21:00
* **Details**: Elite verification detailing progressive badge limits (Highly granular).
* **🎨 Visual Wireframe & Layout**: Interactive tooltips showing exact requirements (`12/25 Accepted Answers`) when hovering over badges.
* **🧠 Team Thinking & Rationale**: High-tier contributors need micro-feedback on their progress. Fine-grained thresholds build engagement.
* **💬 Discussions & Decisions**: Debated the complexity of adding sub-levels. Settled on highly specific sub-milestone checks to ensure balance.
* **⚠️ Errors & Roadblocks Faced**: Hover tooltips clipped out of screen boundaries on tablet viewports.
* **🛡️ Edge Cases Tested**: Verifying calculations at the exact threshold boundary (e.g. exactly 300 reputation points).

### 💬 v0.7: Conversational RAG AI Chatbot Assistant
* **Release Date**: June 01, 2026 - 09:00
* **Details**: Full RC release integrating floating Ollama LLM conversation streams.
* **🎨 Visual Wireframe & Layout**: A beautiful, floating bottom chat assistant widget with sandy glassmorphic styles.
* **🧠 Team Thinking & Rationale**: Provide instant conversational answers based exclusively on our verified FAQ knowledge base.
* **💬 Discussions & Decisions**: Cloud AI APIs vs local LLM inference engines. Selected a local `Ollama` instance paired with a semantic cache to eliminate running costs.
* **⚠️ Errors & Roadblocks Faced**: Stream chunk rendering caused major browser lagging on long text generations.
* **🛡️ Edge Cases Tested**: Gracefully handling empty vector search matches, prompting the AI to recommend asking a community member instead.

### 🛑 v0.75: Stream Abort controller connection listeners
* **Release Date**: June 01, 2026 - 13:00
* **Details**: Save server memory cycles by instantly terminating Ollama runs on tab close.
* **🎨 Visual Wireframe & Layout**: Active UI loading cancel buttons and instant streaming cancellation animations.
* **🧠 Team Thinking & Rationale**: Unfinished streaming processes consume precious server resources. Closing a tab must cancel active RAG calls.
* **💬 Discussions & Decisions**: Timeout polling checks vs direct connection listener triggers. Chose standard HTTP request `close` event listeners.
* **⚠️ Errors & Roadblocks Faced**: Unhandled exception triggers when attempting to close stream resources that had already completed.
* **🛡️ Edge Cases Tested**: Users repeatedly opening, starting, and closing streaming chats in rapid succession.

### 🔒 v0.8: Memory cache caps & relaxed global API limits
* **Release Date**: June 01, 2026 - 17:00
* **Details**: Full RC release clamping RAG cache sizes and relaxing rate limits (1000reqs).
* **🎨 Visual Wireframe & Layout**: High-frequency API diagnostic logs showing cache limits and request statistics.
* **🧠 Team Thinking & Rationale**: Active polling endpoints can trigger false rate limit blocks. Cache caps prevent server out-of-memory crashes.
* **💬 Discussions & Decisions**: Chose 200 requests/15-min limits vs a relaxed 1000 limit with dynamic environment variable support.
* **⚠️ Errors & Roadblocks Faced**: Automated client notifications polling triggered rapid rate limit blocks across active tabs.
* **🛡️ Edge Cases Tested**: Simulating high load from hundreds of parallel browser instances.

### 🎨 v0.85: UI/UX Refinements, Visual highlights, & click previews
* **Release Date**: June 02, 2026 - 09:00
* **Details**: visual query card highlights, volunteer analytics success tooltips, and click-to-view markdown image modal zooms.
* **🎨 Visual Wireframe & Layout**: Golden highlight pulse overlays and full-screen blurred backdrop modal image zooms.
* **🧠 Team Thinking & Rationale**: Aesthetic polish is vital. High-fidelity visual feedback and micro-interactions elevate the user experience.
* **💬 Discussions & Decisions**: Decided whether to load heavy modal libraries vs building a pure CSS/React image overlay. We built a custom overlay to maintain speed.
* **⚠️ Errors & Roadblocks Faced**: Clipped image aspects stretched visual grids when large attachments were rendered inline.
* **🛡️ Edge Cases Tested**: Click events on images nested within dynamic AI chat bubbles.

