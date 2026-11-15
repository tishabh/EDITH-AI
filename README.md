# ⚡ EDITH AI — Next-Gen Intelligence System Powered by NVIDIA

EDITH AI is an ultra-modern, high-performance ChatGPT alternative featuring a refined **Obsidian & Emerald Dark UI**, live streaming reasoning engines, in-browser interactive code sandboxes (Artifacts), real-time web research, and comprehensive user personalization & admin controls.

---

## 🚀 Key Highlights

1. **Powered by NVIDIA Engines:**
   - **KMP 1.0 (Powered by NVIDIA):** Flagship high-reasoning intelligence engine for deep reasoning, architectural design, and complex problem-solving.
   - **KMP 1.5 (Powered by NVIDIA):** Advanced multi-modal and fast reasoning engine.
   - Live real-time token streaming with instant response delivery.

2. **Live In-Browser Code & UI Sandbox (Claude Artifacts Style):**
   - **Interactive Live Previews:** Supports React (JSX & TSX via in-browser Babel compiler), HTML5/CSS3/JavaScript canvas/HUD apps, SVGs, and Markdown documents.
   - **Multi-Device Viewport Switcher:** Test UI in Desktop, Tablet, and Mobile views on the fly.
   - **One-Click File Download:** Directly download generated code files (e.g. `.tsx`, `.html`, `.js`, `.py`, `.md`).
   - Fullscreen expand canvas and instant reload capability.

3. **Real-Time Web Search & Deep Research:**
   - Multi-source live search engine fetching real-time facts, current dates, news, and technical documentation with clean clickable citations.

4. **ChatGPT-Style User Settings & Personalization:**
   - Custom persona & instructions memory (What EDITH should know about you).
   - Response style preferences (Formal, Concise, Code-only, Explanatory).
   - Real-time web search controls and default model preferences.

5. **Executive Admin Command Center:**
   - Single-tenant root security restricted to authorized administrator.
   - Model latency ping tests and usage monitoring.
   - Broadcast system announcements and user analytics.

6. **Cloud Database & Auth via Supabase:**
   - Instant conversation history sync and user profile management.
   - Full offline/local storage fallback if Supabase credentials are not provided.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Compilers & Sandbox:** Babel Standalone (TypeScript & React JSX presets), Isolated iframe sandbox
- **AI Acceleration:** NVIDIA NIM API (Base URL: `https://integrate.api.nvidia.com/v1`)
- **Backend & Database:** Supabase (PostgreSQL with Row Level Security)
- **Tooling:** Vite 8, PostCSS, Oxlint

---

## 📦 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/tishabh/EDITH-AI.git
cd EDITH-AI
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
VITE_NVIDIA_API_KEY=nvapi-your-key-here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_ADMIN_EMAIL=your-email@example.com
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Deploying Live (Vercel / Netlify)

1. Import your GitHub repository to **[Vercel](https://vercel.com)** or **[Netlify](https://netlify.com)**.
2. In the **Environment Variables** settings, add:
   - `VITE_NVIDIA_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_EMAIL`
3. Click **Deploy**. Pre-configured `vercel.json` and `netlify.toml` ensure single-page app routing works out of the box!

---

## 📄 License
This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.
