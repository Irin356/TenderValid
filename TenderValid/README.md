<<<<<<< HEAD
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
=======
# Tender Compliance Validator

## The Problem

Manual RFP (Request for Proposal) compliance checking is a time-consuming, error-prone process that costs organizations thousands of hours annually. Procurement teams must manually review vendor proposals against complex requirements, often missing critical clauses, misinterpreting legal language, or overlooking hidden risks. This leads to:

- **Missed Requirements**: Critical clauses buried in dense legal text
- **Inconsistent Reviews**: Different reviewers spot different issues
- **Delayed Decisions**: Weeks spent on manual analysis
- **Contractual Risks**: Weak language or missing commitments discovered too late

## The Solution

Tender Compliance Validator is an AI-powered web application that automates RFP compliance analysis. Upload your RFP document, extract mandatory requirements automatically, and validate vendor proposals against them with detailed risk assessments and compliance scoring.

### Key Features

- ** Smart Document Processing**: Extracts requirements from PDF and text RFP documents
- ** AI-Powered Analysis**: Uses advanced AI to identify mandatory clauses and assess compliance
- ** Visual Dashboards**: Side-by-side vendor comparisons with risk heatmaps
- **Risk Assessment**: Automatic flagging of vague language, missing commitments, and hidden fees
- **Compliance Scoring**: Quantitative compliance scores for objective vendor evaluation
- ** Dark Mode**: Modern UI with dark mode support for extended use
- ** Export Reports**: Download comprehensive compliance reports as JSON

## 🛠 Tech Stack

- **Frontend**: React 19.2.4 with Vite for fast development and optimized builds
- **AI Integration**: xAI Grok API for intelligent document analysis and compliance assessment
- **Document Processing**: pdfjs-dist for robust PDF text extraction
- **Styling**: CSS-in-JS with design tokens for consistent theming and dark mode support
- **Build System**: Vite for lightning-fast hot-reload development
- **State Management**: React hooks for component state and user interactions

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- xAI account with API access (for AI features)

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tender-compliance-validator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your xAI Grok API key:
   ```
   VITE_GROK_API_KEY=your_grok_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📖 Usage Guide

### Application Dataflow

The Tender Compliance Validator follows a streamlined 4-step process:

#### Step 1: Upload RFP Document
- Click "Drop your RFP document here" or use the upload button
- Supports both PDF and text files
- The app parses the document and displays a preview of the extracted text

#### Step 2: Extract Requirements with AI
- Click "Extract Requirements" to send the RFP text to xAI Grok for analysis
- Grok automatically identifies mandatory clauses using keywords like "shall", "must", "required"
- Requirements are categorized into Technical, Legal, Financial, and Environmental sections
- Review the extracted requirements checklist and uncheck any that shouldn't be mandatory
- Click "Proceed to Vendor Analysis"

#### Step 3: Analyze Vendor Proposals
- Upload vendor proposal documents (PDF or text format)
- Each proposal is sent to Grok AI for compliance analysis against confirmed requirements
- AI provides detailed compliance scores, requirement matching, and risk assessment
- Add multiple vendors for side-by-side comparison

#### Step 4: Review Comparative Dashboard
- View aggregated results in the final dashboard
- Compare all vendors with compliance heatmaps and risk visualizations
- Export comprehensive reports for stakeholders

### AI Integration Details

**Primary AI Engine**: xAI Grok API
- **Requirement Extraction**: Analyzes RFP text to identify mandatory clauses
- **Compliance Analysis**: Matches vendor proposals against requirements
- **Risk Assessment**: Identifies problematic language patterns and business risks
- **Fallback Mode**: Mock responses available for demo purposes when API is unavailable

## 🎨 Features in Detail

### Smart Document Processing
- **Multi-Format Support**: Handles both PDF and plain text RFP documents
- **Robust Text Extraction**: Uses pdfjs-dist for reliable PDF parsing
- **Preview Functionality**: Shows extracted text before AI analysis

### AI-Powered Analysis (xAI Grok)
- **Intelligent Requirement Extraction**: Grok identifies mandatory language patterns and categorizes requirements
- **Semantic Compliance Matching**: Goes beyond keyword matching to understand requirement fulfillment
- **Automated Risk Detection**: Flags vague language, liability issues, and hidden costs
- **Confidence Scoring**: Provides certainty levels for all AI assessments

### Smart Requirement Extraction
Automatically identifies mandatory language using keywords like "shall", "must", "required", and categorizes requirements into:
- Technical Specifications
- Legal Compliance
- Financial Terms
- Environmental & Social

### AI-Powered Compliance Analysis
For each requirement, the system provides:
- **Status**: Met, Partial, or Missing
- **Confidence Score**: How certain the AI is about the assessment
- **Evidence**: Direct quotes from the vendor proposal
- **Gaps**: What's missing or insufficient

### Risk Assessment Engine
Automatically flags potential issues:
- **Vague Language**: Non-specific commitments
- **Liability Issues**: Weak legal protections
- **Hidden Fees**: Unclear pricing structures
- **Timeline Risks**: Unrealistic delivery promises

### Dark Mode Support
Toggle between light and dark themes for comfortable extended use during document review sessions.

### Export Functionality
Download detailed compliance reports including:
- RFP name and requirements
- Vendor analysis results
- Risk assessments
- Generation timestamp

## �️ Database Storage

The application includes persistent data storage using browser localStorage:

### What Gets Stored:
- **RFPs**: Document names, content, and upload timestamps
- **Requirements**: Extracted requirements with categories, priorities, and confirmation status
- **Vendors**: Analysis results, compliance scores, and risk assessments
- **Sessions**: User progress and application state (auto-saved)

### Storage Benefits:
- **Persistence**: Data survives browser refreshes and sessions
- **Offline Capability**: Works without internet connection
- **Multi-Tab Support**: Data syncs across browser tabs
- **Demo Ready**: Pre-loaded sample data for immediate testing

### Storage Stats:
View storage usage in the header next to the RFP name (shows requirements and vendor counts).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with React and Vite
- AI powered by xAI Grok
- PDF processing by Mozilla PDF.js
- Icons and UI inspiration from modern design systems

---

**Ready to revolutionize your RFP compliance process?** Start analyzing vendor proposals in minutes instead of weeks!
   ```bash
   npm install
   ```

3. **Configure API Key**:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your xAI Grok API key:
     ```
     VITE_GROK_API_KEY=your_grok_api_key_here
     ```

4. **Start development server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173/` (or next available port)

5. **Build for production**:
   ```bash
   npm run build
   npm run preview  # preview the production build
   ```

## Usage Guide

### Step 1: Upload RFP
- Click the upload area or drag and drop an RFP document (.txt or .pdf)
- Supported formats: Plain text (.txt), PDF documents (.pdf)
- The application will extract and display text preview
- Click **"Extract Requirements"** to begin analysis

### Step 2: Review Requirement Checklist
- Review automatically extracted requirements grouped by category
- Each requirement shows its ID, priority level, and full text
- Use checkboxes to confirm/unconfirm requirements before proceeding
- Requirements are pre-confirmed by default; uncheck any false positives

### Step 3: Vendor Analysis
- Upload vendor proposals individually (.txt or .pdf)
- Enter vendor name
- Click **"Analyze Vendor"** to validate against confirmed requirements
- View results including compliance score, requirement status, and identified risks
- Load demo vendors to see example analysis

### Step 4: Final Dashboard
- View all analyzed vendors in comparison
- Check overall compliance scores and requirement metrics
- Review side-by-side requirement satisfaction table
- Analyze risk heatmap across all vendors to identify common issues

## File Upload Formats

### Supported Formats
- **Text Files** (.txt): Plain text RFPs and proposals
- **PDF Files** (.pdf): Scanned or digital PDFs
  - Automatically extracts text from all pages
  - Handles multi page documents
  - Robust error handling for corrupted or scanned PDFs

### File Size Guidelines
- Recommended maximum: 100 pages per document
- Larger files may take longer to process
- API request timeout: 60 seconds per analysis

## Error Handling

The application includes comprehensive error handling:
- **Missing API Key**: Clear error message with setup instructions
- **Failed File Upload**: Specific error about file parsing
- **API Errors**: Detailed error messages from the xAI Grok API
- **JSON Parsing**: Validation of AI responses with fallback error reporting

All errors are displayed in a dismissible error banner at the top of the page.

## Architecture

### Technology Stack
- **Frontend**: React 19 + Vite
- **PDF Processing**: pdfjs-dist (PDF.js)
- **AI Engine**: xAI Grok API
- **Styling**: CSS-in-JS with design tokens

### Key Components
- `App.jsx`: Main application component with all logic
- `index.css`: Global styles and design system variables
- `callGrok()`: API abstraction for Grok interactions

### Data Flow
1. User uploads RFP → File is parsed (text or PDF)
2. RFP text sent to Grok for requirement extraction
3. Requirements displayed for user review/confirmation
4. Vendor proposals uploaded and analyzed against confirmed requirements
5. Results aggregated and displayed in comparative dashboard

## Environment Variables

```env
VITE_GROK_API_KEY=your_grok_api_key_here
```

The app uses Vite's environment variable system. Variables must be prefixed with `VITE_` to be accessible in the browser.

## Development

### Available Scripts
- `npm run dev` - Start development server with hot-reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

### Key Dependencies
- `react@19.2.4` - React library
- `react-dom@19.2.4` - React DOM
- `pdfjs-dist@4.x` - PDF parsing library
- `vite@8.0.1` - Build tool

## PDF Upload Issue Fixes

Recent fixes address PDF upload and validation:
- ✅ Fixed PDF text extraction with improved robustness
- ✅ Added proper error handling and user-friendly messages
- ✅ Implemented API authentication headers for Grok API
- ✅ Added PDF worker file resolution for Vite bundling
- ✅ Enhanced error display in UI with dismissible error banner

## Troubleshooting

### "API key missing" error
- Verify `.env` file exists in project root
- Check that `VITE_GROK_API_KEY` is set correctly
- Restart dev server after updating `.env`

### PDF parsing shows garbled text
- PDF may have special encoding or be scanned image
- Try converting to text-searchable PDF or plain text file
- Check browser console (F12) for detailed error messages

### Long analysis waiting times
- Large documents (100+ pages) take longer to process
- API has finite rate limits; space out requests
- Check xAI Grok API status and quota

### Compliance scores seem incorrect
- Review the evidence and gaps for each requirement
- Ensure vendor proposal covers requirement completely
- Re-extract requirements if RFP wasn't clear

## Known Limitations

1. **Single AI Model**: Currently uses xAI Grok; could support model switching
2. **Text Analysis Only**: Cannot analyze images embedded in PDFs
3. **English Language**: Works best with English documents
4. **API Rate Limiting**: Subject to xAI API rate limits
5. **Timeout**: Long documents may exceed 60-second API timeout

## Future Improvements

- Document templates for common industries
- PDF report generation and export
- Historical comparison and RFP versioning
- Custom requirement categories
- Multi-language support
- Advanced scoring with customizable weights
- Batch processing for multiple documents
- Integration with procurement systems

>>>>>>> 4c67c01 (Your message)
