# Hirely

AI-powered resume reviewer and job-specific resume optimization platform.

Upload your resume, get detailed AI analysis, and optimize it for any job.

## Features

- **AI Resume Review** — Content, structure, clarity, ATS compatibility, and more
- **Job Match Analysis** — Compare your resume against any job description
- **Suggested Changes** — Accept, reject, or edit each recommendation
- **Resume Rewrite** — Generate an improved version with editable output
- **ATS Analysis** — Identify formatting issues that may reduce parsing reliability
- **Skill Gap Detection** — See which required skills you're missing
- **Bullet Point Improvements** — Strengthen every bullet with actionable feedback
- **Dashboard** — Track all your analyses in one place

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Vite
- **AI Backend:** Netlify Functions + OpenAI API
- **PDF Parsing:** pdfjs-dist (client-side)
- **OCR:** tesseract.js (client-side)
- **Storage:** localStorage (all data stays in your browser)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` (optional for local dev):

```bash
cp .env.example .env.local
```

Set your OpenAI API key:

```
OPENAI_API_KEY=sk-your-key-here
```

For local development with Netlify Functions, add this to `.env.local`:

```
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
```

### 3. Run Locally

**Option A: Vite dev server only (no AI functions)**

```bash
npm run dev
```

Opens at `http://localhost:5173`. Upload and parsing work, but AI analysis will fail without the Netlify Functions proxy.

**Option B: Full dev server with Netlify Functions**

```bash
npm install -g netlify-cli
netlify login
netlify dev
```

Opens at `http://localhost:8888`. This runs both the Vite dev server and Netlify Functions locally.

### 4. Build for Production

```bash
npm run build
```

Output goes to `dist/`.

### 5. Type Check

```bash
npm run typecheck
```

## Deploying to Netlify

1. Push your repository to GitHub/GitLab/Bitbucket.
2. Log in to [Netlify](https://app.netlify.com).
3. Click **Add new site** > **Import an existing project**.
4. Select your repository.
5. Netlify will auto-detect the build settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Go to **Site settings** > **Environment variables** and add:
   - `OPENAI_API_KEY` — Your OpenAI API key
   - `OPENAI_MODEL` (optional) — Default is `gpt-4o-mini`
7. Click **Deploy site**.

## Required Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key. Used by Netlify Functions only — never exposed to the browser. |
| `OPENAI_MODEL` | No | Override the AI model. Default: `gpt-4o-mini` |

## How It Works

1. **Upload** — Drag and drop a PDF or image of your resume
2. **Parse** — Text is extracted client-side (PDF.js for PDFs, Tesseract.js for images)
3. **Analyze** — Text is sent to a Netlify Function that calls the OpenAI API
4. **Review** — View detailed feedback across multiple categories
5. **Optimize** — Add a job description to get job-specific recommendations
6. **Rewrite** — Generate an improved version (review before accepting)
7. **Download** — Export your optimized resume

## Privacy

- Resume text is processed by OpenAI's API for analysis only
- No resume data is stored on any server
- All data stays in your browser's localStorage
- API keys are kept server-side in Netlify Functions
- No data is shared with third parties

## Project Structure

```
├── public/                  # Static assets
├── src/
│   ├── components/
│   │   ├── analysis/        # Analysis tab components
│   │   ├── layout/          # Navbar, Footer
│   │   ├── ui/              # Reusable UI primitives
│   │   └── upload/          # Upload components
│   ├── lib/
│   │   ├── ai.ts            # AI client (calls Netlify Functions)
│   │   ├── parsers/         # PDF and image parsing
│   │   └── storage.ts       # localStorage persistence
│   ├── pages/               # Route pages
│   ├── types/               # TypeScript types
│   ├── App.tsx              # Router
│   └── main.tsx             # Entry point
├── netlify/functions/        # Serverless AI functions
│   ├── _shared/             # Shared AI logic and prompts
│   ├── analyze-resume.ts    # Resume analysis endpoint
│   ├── job-match.ts         # Job match analysis endpoint
│   └── rewrite-resume.ts    # Resume rewrite endpoint
├── netlify.toml             # Netlify configuration
└── vite.config.ts           # Vite configuration
```

## Important Notes

- AI-generated assessments are **guidance only**, not objective hiring metrics
- The system never fabricates experience, metrics, or qualifications
- ATS scores are estimates and should not be treated as official ATS system results
- Always review AI suggestions before using them on an actual application
