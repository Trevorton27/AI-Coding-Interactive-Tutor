# AI Coding Interactive Tutor  
**Harnessing Haiku 4.5 to build a next‑level learning experience**

---

## ✅ What is this project?  
This project is a **web‑based interactive coding tutor** that guides learners step‑by‑step through real‑world programming tasks. Behind the scenes it uses the **Haiku 4.5** library (for e.g., LLM orchestration, memory, or agent logic) to power intelligent feedback, hints, and adaptive challenge selection.

You’ll find a modern full‑stack architecture:
- A Next.js application front‑end for the interactive experience  
- Monorepo packages for services, database, UI, etc.  
- Custom scripts for orchestration and automation  
- A tasks curriculum built for hands‑on coding and mastery  

---

## 🎯 What does it do?  
- Presents learners with coding tasks — you can pick from a curated list, dive into an editor, and code directly in the browser.  
- Integrates with the Haiku 4.5 powered tutor agent: ask questions, receive hints, or request solutions.  
- Tracks your progress and mastery over time with visual indicators and dashboards.  
- Allows reviews and “next task” recommendations based on your performance.  
- Supports full‑stack architecture: client UI, API endpoints (task list, tutor interface, progress tracking), database schema/seed logic, and shared UI/service modules.  

---

## 🚀 Why it’s cool  
- **Adaptive & Interactive**: Unlike typical tutorial sites, this environment adjusts based on how you're doing — bridging the gap between static lessons and a live mentor.  
- **Real‑world code editor in browser**: You’re not just reading; you’re coding, testing, and seeing results — all in one place.  
- **Monorepo architecture**: Everything from UI components to orchestrator logic and database models lives in a well‑structured workspace, making it easy to extend and customize.  
- **Powered by Haiku 4.5**: The use of Haiku 4.5 for agent logic means the tutoring component is robust, modular, and future‑proof.  
- **Ready to scale**: Built with modern tools and patterns (Next.js, TypeScript, shared packages), you can grow this from a personal project into a full‑blown platform.

---

## 🧪 Quick Start  
1. Clone the repo:  
   ```bash
   git clone https://github.com/Trevorton27/AI-Coding-Interactive-Tutor.git
   cd AI-Coding-Interactive-Tutor


## Static Core + AI Variation Layer (Haiku-optimized)

This app now supports **theme-safe AI variants** for any static task. Variants keep the same tests and objectives but refresh the narrative and starter comments using **Claude 3.5 Haiku**.

### How it works
- Static tasks live in `apps/web/data/tasks.levels.json`.
- POST `/api/variants` with `{ task_id }` to get a themed variant.
- The server calls Haiku with a guard-railed system prompt; only surface text changes.
- Tests are untouched → grading remains deterministic.

### Configure
Set your Anthropic key and optional model in `apps/web/.env.local`:
```
ANTHROPIC_API_KEY=sk-...
CLAUDE_MODEL=claude-3-5-haiku-20241022
```

### UI
On the **Learn** page, click **“✨ New Variant”** to generate and load a variant of the current task.

### Costs & caching
Variants are generated on demand. If you want caching, persist `{task_id, seed, variant}` by hash in your DB and return cached copies.
