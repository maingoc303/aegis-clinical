# Aegis Clinical Intelligence Dossier 🩺🔬

An advanced full-stack intelligence platform used to translate intricate medical diagnostic parameters, blood work panels, radiological scan summaries, or clinical prescriptions into easily understandable layout matrixes and empathetic layperson explanations.

This workspace features a highly sophisticated integration with **Google Gemini (`gemini-3.5-flash`)** utilizing the modern multi-modal `@google/genai` TypeScript SDK. It includes both a responsive React 19 client frontend and a robust Node.js backend proxy to keep your API keys fully hidden from browser network spectators.

---

## Key Capabilities ✨

- **Multi-Format Extractor**: Seamlessly upload clinical paperwork across multiple extensions, including:
  - **PDF documents** and **scanned images** (processed natively via Gemini's multi-modal comprehension).
  - **MS Word (`.docx`) files** (automatically extracted to clean raw text streams via server-side Mammoth parsing).
  - **MS Excel & CSV spreadsheets** (parsed worksheet-by-worksheet into structured table streams via `XLSX` engine).
  - Plain files (TXT, JSON, Markdown).
- **The Biophysical Matrix**: Translates detailed biomarkers into normal/alert tables with matching reference ranges, annotated context, identified chronic/acute diagnoses, and recommended instructions.
- **Dossier-Synced Conversations**: An immersive, state-aware AI chatbot that is fed the parsed clinical data so questions about specific lab panels are resolved with high contextual correctness.
- **Layout & Typography**: Styled using professional, high-contrast typography pairings (Cinzel display headings, Inter UI and JetBrains Mono code lines) and spacious, fluid layouts matching medical standards.

---

## Technical Stack 🛠️

- **Frontend**: [React 19](https://react.dev/), [Vite 6](https://vite.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend Services**: [Express.js v4](https://expressjs.com/), [Node.js (TypeScript)](https://www.typescriptlang.org/)
- **AI Synthesis**: Official [@google/genai SDK v2](https://github.com/google/generative-ai-js)
- **Doc Decoders**: `mammoth` (Word doc parsing), `xlsx` (Spreadsheet engine)

---

## Local Installation / Setup 🚀

To download, configure, and initialize the application on your local workstation, run through these simple steps:

### 1. Prerequisites
Ensure you have **Node.js (v18 or higher)** and `npm` installed on your machine.

### 2. Download and Extract
Obtain the repository files either via **git clone** or by exporting the ZIP archive directly from the settings drawer of Google AI Studio:
```bash
# Clone the repository
git clone https://github.com/maingoc303/aegis-clinical.git
cd aegis-clinical
```

### 3. Install Dependencies
Install the required packages for both the client build stream and the Express server:
```bash
npm install
```

### 4. Configure Environment Secrets
Create a local `.env` configuration file inside your project root to provision your AI Studio credentials:
```bash
cp .env.example .env
```
Open the `.env` file and insert your active **Gemini API Key**:
```env
# Get a key from Google AI Studio (https://aistudio.google.com/)
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere..."
```

*(Note: In local dev settings, `APP_URL` is optional. The client will automatically route to the active development host).*

### 5. Launch local Developer Server
Kickoff the joint full-stack compilation. This runs the Express backend on port `3000` with the hot Vite asset middleware mounted:
```bash
npm run dev
```

Your terminal will print out:
```text
Medical Application Server listening on http://0.0.0.0:3000
```
Open **[http://localhost:3000](http://localhost:3000)** in your web browser to start exploring and parsing your clinical files!

---

## Production Compilation & Deployment 📦

Prior to standard host deployments or container packaging, compile the TypeScript source files and pack the backend into a standalone build directory:

```bash
# Build the production bundle
npm run build
```

This performs two operations:
1. Compiles the front-end React code into a compressed, static client tree inside `dist/`.
2. Bundles the TypeScript `server.ts` entry file through `esbuild` to compile a single, native `dist/server.cjs` script.

To launch the compiled server in your production environments, simply trigger:
```bash
npm run start
```
This serves the client-side SPA statically while keeping deep server-side API proxy routes fully operational.

---

## Architectural File Tree 🗺️

```text
├── .env.example            # Environment properties template
├── package.json            # Deployment dependencies and script commands
├── server.ts               # Standby Express.js server & Gemini endpoint proxy
├── tsconfig.json           # Global compiler configurations
├── vite.config.ts          # Vite bundling and middleware configurations
├── index.html              # Main HTML entry canvas
│
└── src/
    ├── main.tsx            # Main client-side initializer
    ├── index.css           # Global Tailwind layout CSS (with premium fonts)
    ├── App.tsx             # Primary workspace dashboard
    ├── types.ts            # Clinical types and chat interfaces
    │
    └── components/
        ├── UploadZone.tsx      # Secure file drag-and-drop & parsing interface
        ├── DossierDisplay.tsx  # Dynamic report visualization and filter engine
        └── ChatPanel.tsx       # Sync-aware context-balanced conversation window
```

---

## Medical Representation & Compliance Disclaimer ⚠️

This platform is compiled strictly as an informative, metadata-parsing laboratory translator to bridge the gap between technical clinical terms and patient comprehension. It does not replace certified professional consultations, diagnoses, prescription updates, or physical treatments. Do not alter any dosage protocols without direct recommendation from your physician.
