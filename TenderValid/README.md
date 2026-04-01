# TenderCheck — Tender Compliance Validator

## Project Title

**TenderCheck** — An AI-powered tool that reads RFP documents and vendor proposals, then tells you exactly who meets the requirements and who doesn't.

---

## The Problem

If you've ever worked in procurement or legal, you know the pain. A 120-page RFP goes out, and two weeks later you're sitting with 8 vendor proposals — each one also 80–100 pages — trying to manually check if Vendor D actually committed to 24/7 support or just *implied* it somewhere in section 4.3.

Missing even one requirement can void a bid, trigger a lawsuit, or lock your company into a contract with hidden loopholes. And right now, the only tool most teams have for this is a spreadsheet and a lot of coffee.

That's the problem this project tries to fix.

---

## The Solution

TenderCheck lets you upload an RFP, automatically pulls out every mandatory requirement from it, and then checks each vendor's proposal against that list — using AI to understand meaning, not just match keywords.

Here's what it actually does, step by step:

**1. Reads the RFP and builds a checklist**
It looks for obligation language — "shall", "must", "is required to" — and turns every one of those sentences into a trackable requirement. These get sorted into buckets like Technical, Legal, Financial, and Environmental so you're not staring at one giant wall of text.

**2. Checks each vendor proposal against that checklist**
For every requirement, it finds the relevant part of the vendor's document (even if they phrased it completely differently), marks it as Met, Partial, or Missing, gives you a confidence score, and shows you the actual quote it based that on.

**3. Flags the risky fine print**
It also scans for language that should make any procurement team nervous — things like "subject to change", "additional fees may apply", or "pending final approval". For each one it finds, it explains in plain English why that clause is a problem.

**4. Gives you a comparison dashboard**
Once you've analysed multiple vendors, you get a side-by-side view — compliance scores, a requirement matrix, and a risk heatmap — so you can walk into the board meeting with something concrete.

---

## Tech Stack

- **JavaScript** — the whole project is written in JS, no Python or backend involved
- **React 18** — handles all the UI and state
- **Vite** — used to build and run the project locally
- **Anthropic Claude API** — the `claude-sonnet-4-20250514` model does all the heavy lifting: extraction, semantic matching, risk detection
- **Native fetch API** — no Axios, no SDK wrappers, just plain browser fetch calls to the Anthropic endpoint
- **npm** — package management
- **No database** — everything lives in React state during the session; nothing is stored server-side

---

## Setup Instructions

You'll need Node.js (v18 or above) and an Anthropic API key. If you don't have one, you can get it at [console.anthropic.com](https://console.anthropic.com).

### Step 1 — Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/tender-check.git
cd tender-check
```

### Step 2 — Set up the project (first time only)

```bash
npm create vite@latest . -- --template react
```

### Step 3 — Replace the default App file

```bash
cp tender-compliance-validator.jsx src/App.jsx
```

### Step 4 — Install dependencies

```bash
npm install
```

### Step 5 — Add your API key

Open `src/App.jsx` and find the `callClaude` function. For local development, update the headers like this:

```js
headers: {
  "Content-Type": "application/json",
  "x-api-key": "YOUR_API_KEY_HERE",
  "anthropic-version": "2023-06-01",
  "anthropic-dangerous-direct-browser-access": "true"
}
```

Just don't push your API key to GitHub. Use environment variables if you're deploying this publicly.

### Step 6 — Run it

```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser. That's it.

### Step 7 — Build for production (optional)

```bash
npm run build
```

The output goes into the `dist/` folder. You can deploy that to Vercel or Netlify in about two minutes.

---

## Trying it out

You don't need any real documents to test this. On the upload screen, click **Load Demo RFP** to use a pre-built IT infrastructure tender. Then on the vendor screen, click **Load Demo Vendors** — it'll analyse two sample proposals and give you a full comparison automatically.

---

## Folder structure

```
tender-check/
├── src/
│   └── App.jsx       ← the entire app lives here
├── public/
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

---

## A note on this project

This was built as a submission for a real-world problem statement — the kind of compliance bottleneck that actually slows down infrastructure projects and causes legal headaches. The goal wasn't to build another fancy dashboard. It was to make a tool that a procurement officer could actually sit down with and use on day one, without training.
