import { useState, useRef, useEffect } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import database from "./database.js";

GlobalWorkerOptions.workerSrc = pdfWorker;

const GROK_API_BASE = "https://api.x.ai/v1/chat/completions";
const MAX_GROK_REQUEST_CHARS = 12000;
const USE_MOCK_AI = true;

function chunkText(text, maxChars = 6000) {
  const chunks = [];
  let cursor = 0;
  while (cursor < text.length) {
    let end = Math.min(cursor + maxChars, text.length);
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(" ", end);
      if (lastSpace > cursor) {
        end = lastSpace;
      }
    }
    chunks.push(text.slice(cursor, end).trim());
    cursor = end;
  }
  return chunks.filter(Boolean);
}

function parseJsonArray(raw) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to parse JSON response:", err, raw);
    return [];
  }
}

function mergeRequirements(items) {
  const seen = new Map();
  return items
    .filter((item) => item && item.text && typeof item.text === "string")
    .map((item, index) => ({
      id: item.id || `R${String(index + 1).padStart(3, "0")}`,
      category: item.category || "Technical Specifications",
      text: item.text.trim(),
      keywords: Array.isArray(item.keywords) ? item.keywords : [],
      priority: item.priority || "High",
      confirmed: item.confirmed !== false,
    }))
    .filter((item) => {
      const key = `${item.category}:${item.text}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.set(key, true);
      return true;
    });
}

function mockRequirements() {
  return [
    {
      id: "R001",
      category: "Technical Specifications",
      text: "The vendor must provide 99.9% uptime and support AES-256 encryption at rest and in transit.",
      keywords: ["uptime", "encryption", "AES-256"],
      priority: "Critical",
      confirmed: true,
    },
    {
      id: "R002",
      category: "Legal Compliance",
      text: "The vendor must comply with GDPR and carry at least $5 million in professional liability insurance.",
      keywords: ["GDPR", "liability", "insurance"],
      priority: "High",
      confirmed: true,
    },
    {
      id: "R003",
      category: "Financial Terms",
      text: "The vendor must provide audited financial statements for the last three fiscal years.",
      keywords: ["audited", "financial statements", "fiscal years"],
      priority: "Medium",
      confirmed: true,
    },
    {
      id: "R004",
      category: "Environmental & Social",
      text: "The vendor must demonstrate carbon neutrality or equivalent environmental commitment.",
      keywords: ["carbon neutrality", "environment", "sustainability"],
      priority: "Medium",
      confirmed: true,
    },
  ];
}

function mockVendorAnalysis(vendorName, confirmedReqs) {
  const score = Math.max(65, 100 - confirmedReqs.length * 5);
  const requirementResults = confirmedReqs.map((req) => ({
    reqId: req.id,
    status: "Met",
    confidence: 90,
    evidence: `The proposal addresses: ${req.text}`,
    gap: "",
  }));
  return {
    vendorName,
    complianceScore: score,
    requirementResults,
    risks: [
      {
        text: "Some requirements are described generally rather than with specific implementation details.",
        type: "Vague Language",
        impact: "The proposal may require further clarification before contracting.",
      },
    ],
  };
}

async function callGrok(systemPrompt, userPrompt, maxTokens = 1000) {
  const apiKey = import.meta.env.VITE_GROK_API_KEY;
  
  if (!apiKey) {
    console.error("Available env vars:", import.meta.env);
    throw new Error(
      "Grok API key missing. Please set VITE_GROK_API_KEY in your .env file and restart dev server."
    );
  }

  if (!systemPrompt || !userPrompt) {
    throw new Error("System prompt or user prompt is empty");
  }

  const response = await fetch(GROK_API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-beta",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    let errorMsg = response.statusText;
    try {
      const error = JSON.parse(text);
      errorMsg = error.error?.message || error.message || errorMsg;
    } catch (e) {
      // not JSON
    }
    if (response.status === 429) {
      throw new Error(
        `Grok quota exceeded. Check your xAI account or use a different API key, then restart the app.`
      );
    }
    throw new Error(`Grok API Error (${response.status}): ${errorMsg}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  if (!text) {
    throw new Error("Grok returned empty response. Check API quota.");
  }
  return text.replace(/```json|```/g, "").trim();
}


const STEPS = ["upload", "requirements", "vendors", "dashboard"];

const DEMO_RFP = `REQUEST FOR PROPOSAL – IT Infrastructure Modernization

1. MANDATORY TECHNICAL REQUIREMENTS
1.1 The vendor shall provide 99.9% system uptime guaranteed by SLA.
1.2 The vendor must support end-to-end AES-256 data encryption at rest and in transit.
1.3 All software must be ISO 27001 certified and compliant with GDPR regulations.
1.4 The vendor is required to provide 24/7 technical support with a maximum 4-hour response time.
1.5 The system must integrate with existing SAP ERP infrastructure via RESTful APIs.
1.6 Vendor shall complete full data migration within 90 days of contract signing.

2. LEGAL AND COMPLIANCE
2.1 The vendor must carry a minimum of $5 million in professional liability insurance.
2.2 All personnel assigned to the project must pass background verification checks.
2.3 Vendor is required to comply with local data sovereignty laws.
2.4 The vendor shall provide a detailed Data Processing Agreement (DPA) before contract execution.

3. FINANCIAL TERMS
3.1 Payment milestones must be tied to delivery of defined project phases.
3.2 The vendor must provide a fixed-price quote with no variable billing unless pre-approved.
3.3 Vendor is required to submit audited financial statements for the last three fiscal years.

4. ENVIRONMENTAL & SOCIAL
4.1 The vendor must demonstrate a carbon neutrality plan or equivalent environmental commitment.
4.2 All hardware supplied shall be RoHS compliant and free of restricted hazardous substances.`;

const DEMO_VENDOR_A = `PROPOSAL – CloudTech Solutions

EXECUTIVE SUMMARY
CloudTech Solutions is pleased to submit this proposal for the IT Infrastructure Modernization project.

TECHNICAL CAPABILITY
Our platform guarantees 99.95% uptime backed by our enterprise SLA agreement. We employ AES-256 encryption across all data stores and transmission channels. CloudTech holds ISO 27001 and SOC 2 Type II certifications, and our platform is fully GDPR compliant.

Our helpdesk operates around the clock – 24 hours a day, 7 days a week – with a guaranteed initial response within 2 hours for critical issues. We have extensive experience integrating with SAP ERP environments through our certified REST API gateway.

Data migration will be completed within 60 days following contract execution, under our proven migration framework.

LEGAL & COMPLIANCE
We maintain $10 million in professional liability coverage. All team members undergo rigorous background screening prior to project assignment. We fully comply with data sovereignty requirements and will provide a comprehensive Data Processing Agreement for your review.

FINANCIALS
Our proposal is structured with milestone-based payments aligned to project deliverables. We provide a fixed, all-inclusive price with no hidden costs. Our audited financial statements for FY2022, FY2023, and FY2024 are included in Appendix B.

ENVIRONMENTAL
CloudTech is certified carbon neutral since 2021. All hardware supplied is RoHS compliant.`;

const DEMO_VENDOR_B = `PROPOSAL – NexaCore Systems

OVERVIEW
NexaCore Systems is excited to present this proposal. We believe we offer exceptional value.

TECHNICAL DETAILS
Our infrastructure typically achieves high availability, generally around 99.5% in most deployments. We use industry-standard encryption methods for data protection. NexaCore is in the process of obtaining ISO 27001 certification, expected by end of year. Support is available Monday to Friday, 9am to 6pm, with emergency contacts available after hours for critical matters. Our team has some experience with SAP systems and we believe integration should be manageable. Data migration timeline is subject to further scoping but we estimate 3–6 months depending on complexity.

LEGAL
We carry $2 million general liability insurance. Background checks are conducted for senior personnel. We operate in accordance with applicable laws. A DPA can be provided upon request after contract signing.

FINANCIAL
We prefer a time-and-materials billing model as project scope may change. Financial statements are available for the last two years upon request.

ENVIRONMENTAL
We are committed to sustainability and are exploring options to reduce our environmental footprint. Hardware specifications are subject to final procurement decisions and additional fees may apply for specific environmental certifications.`;

export default function TenderValidator() {
  const [step, setStep] = useState("upload");
  const [rfpText, setRfpText] = useState("");
  const [rfpName, setRfpName] = useState("");
  const [requirements, setRequirements] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [currentVendorName, setCurrentVendorName] = useState("");
  const [currentVendorText, setCurrentVendorText] = useState("");
  const [analyzingVendor, setAnalyzingVendor] = useState(false);
  const [activeVendorTab, setActiveVendorTab] = useState(null);
  const [deepDiveReq, setDeepDiveReq] = useState(null);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [currentRfpId, setCurrentRfpId] = useState(null);
  const fileInputRFP = useRef(null);
  const fileInputVendor = useRef(null);

  // Generate session ID
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Load session data on component mount
  useEffect(() => {
    try {
      const savedSession = database.getSession(sessionId);
      if (savedSession) {
        setStep(savedSession.step || "upload");
        setRfpText(savedSession.rfpText || "");
        setRfpName(savedSession.rfpName || "");
        setRequirements(savedSession.requirements || []);
        setVendors(savedSession.vendors || []);
        setCurrentRfpId(savedSession.currentRfpId || null);
        setActiveVendorTab(savedSession.activeVendorTab || null);
        setDarkMode(savedSession.darkMode || false);
      }
    } catch (err) {
      console.error("Failed to load session:", err);
    }
  }, []);

  // Save session data whenever state changes
  useEffect(() => {
    const sessionData = {
      step,
      rfpText,
      rfpName,
      requirements,
      vendors,
      currentRfpId,
      activeVendorTab,
      darkMode,
      timestamp: Date.now()
    };
    try {
      database.saveSession(sessionId, sessionData);
    } catch (err) {
      console.error("Failed to save session:", err);
    }
  }, [step, rfpText, rfpName, requirements, vendors, currentRfpId, activeVendorTab, darkMode]);

  const clearError = () => setError(null);
  const toggleDarkMode = () => setDarkMode(!darkMode);

  const exportComplianceReport = () => {
    if (!vendors.length) return;
    const report = {
      rfpName,
      requirements: requirements.filter(r => r.confirmed),
      vendors,
      generatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${rfpName || 'rfp'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const readFile = (file) =>
    new Promise((res, rej) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const data = e.target.result;
        try {
          if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
            const doc = await getDocument({ data }).promise;
            let text = "";
            for (let i = 1; i <= doc.numPages; i += 1) {
              const page = await doc.getPage(i);
              const content = await page.getTextContent();
              const pageText = content.items
                .map((item) => item.str || "")
                .filter((s) => s.trim().length > 0)
                .join(" ");
              if (pageText.trim()) {
                text += `${pageText}\n\n`;
              }
            }
            res(text.trim() || "No text could be extracted from PDF");
          } else {
            res(data);
          }
        } catch (err) {
          rej(new Error(`Failed to parse PDF: ${err.message}`));
        }
      };

      reader.onerror = () => rej(new Error("Failed to read file"));
      if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });

  const handleRFPFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      clearError();
      const text = await readFile(file);
      setRfpText(text);
      setRfpName(file.name);

      // Save RFP to database
      const rfpId = database.saveRfp(file.name, text);
      setCurrentRfpId(rfpId);
      console.log(`RFP saved to database with ID: ${rfpId}`);
    } catch (err) {
      setError(`Failed to upload RFP: ${err.message}`);
    }
  };

  const handleVendorFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      clearError();
      const text = await readFile(file);
      setCurrentVendorText(text);
      setCurrentVendorName(file.name.replace(/\.[^/.]+$/, ""));
    } catch (err) {
      setError(`Failed to upload vendor proposal: ${err.message}`);
    }
  };

  const loadDemo = () => {
    setRfpText(DEMO_RFP);
    setRfpName("IT_Infrastructure_RFP.txt");

    // Save demo RFP to database
    const rfpId = database.saveRfp("IT_Infrastructure_RFP.txt", DEMO_RFP);
    setCurrentRfpId(rfpId);
    console.log(`Demo RFP saved to database with ID: ${rfpId}`);
  };

  const extractRequirements = async () => {
    setLoadingReqs(true);
    clearError();
    try {
      const system = `You are a legal and procurement expert. Extract ALL mandatory requirements from RFP documents. Return ONLY valid JSON — no prose, no markdown fences.`;
      const basePrompt = `Extract every mandatory requirement from this RFP segment. Look for words like "shall", "must", "required", "mandatory". Return a JSON array of objects with this exact shape:
[
  {
    "id": "R001",
    "category": "Technical Specifications" | "Legal Compliance" | "Financial Terms" | "Environmental & Social",
    "text": "Full requirement text",
    "keywords": ["keyword1"],
    "priority": "Critical" | "High" | "Medium",
    "confirmed": true
  }
]`;

      let parsed = [];

      if (USE_MOCK_AI) {
        parsed = mockRequirements();
      } else if (rfpText.length > MAX_GROK_REQUEST_CHARS) {
        const chunks = chunkText(rfpText, 8000);
        const chunkOutputs = await Promise.all(
          chunks.map((chunk, index) => {
            const prompt = `${basePrompt}\n\nRFP segment ${index + 1} of ${chunks.length}:\n${chunk}`;
            return callGrok(system, prompt, 800);
          })
        );

        const allRequirements = chunkOutputs.flatMap((raw) => parseJsonArray(raw));
        parsed = mergeRequirements(allRequirements);
      } else {
        const prompt = `${basePrompt}\n\nRFP:\n${rfpText}`;
        const raw = await callGrok(system, prompt, 1200);
        parsed = parseJsonArray(raw);
      }

      if (!parsed.length) {
        throw new Error("No requirements could be extracted. Try a smaller file or a cleaner RFP text format.");
      }

      // Clear existing requirements for this RFP
      if (currentRfpId) {
        database.clearRequirements(currentRfpId);
      }

      // Save requirements to database
      if (currentRfpId) {
        database.saveRequirements(currentRfpId, parsed);
        console.log(`Saved ${parsed.length} requirements to database`);
      }

      setRequirements(parsed);
      setStep("requirements");
    } catch (err) {
      setError(`Error extracting requirements: ${err.message}`);
    }
    setLoadingReqs(false);
  };

  const toggleRequirement = (id) => {
    setRequirements((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const newConfirmed = !r.confirmed;
          // Update database
          database.updateRequirementConfirmation(id, newConfirmed);
          return { ...r, confirmed: newConfirmed };
        }
        return r;
      })
    );
  };

  const analyzeVendor = async () => {
    if (!currentVendorText || !currentVendorName) return;
    setAnalyzingVendor(true);
    clearError();
    const confirmedReqs = requirements.filter((r) => r.confirmed);
    try {
      const system = `You are a compliance analyst. Analyze vendor proposals against RFP requirements. Return ONLY valid JSON.`;
      const prompt = `Analyze this vendor proposal against the requirements below. Return a JSON object:
{
  "vendorName": "${currentVendorName}",
  "complianceScore": <0-100 integer>,
  "requirementResults": [
    {
      "reqId": "R001",
      "status": "Met" | "Partial" | "Missing",
      "confidence": <0-100 integer>,
      "evidence": "Quote or paraphrase from proposal that addresses this",
      "gap": "What's missing or insufficient (empty string if Met)"
    }
  ],
  "risks": [
    {
      "text": "Exact or near-exact clause from the proposal",
      "type": "Liability" | "Vague Language" | "Non-Commitment" | "Hidden Fee" | "Timeline Risk",
      "impact": "Brief explanation of the business risk"
    }
  ]
}

Requirements:
${JSON.stringify(confirmedReqs, null, 2)}

Vendor Proposal:
${currentVendorText}`;

      const parsed = USE_MOCK_AI
        ? mockVendorAnalysis(currentVendorName, confirmedReqs)
        : JSON.parse(await callGrok(system, prompt, 1200));

      // Save vendor to database
      if (currentRfpId) {
        database.saveVendor(parsed.vendorName, currentRfpId, parsed.complianceScore, parsed);
        console.log(`Saved vendor ${parsed.vendorName} to database`);
      }

      setVendors((prev) => {
        const exists = prev.findIndex((v) => v.vendorName === parsed.vendorName);
        if (exists >= 0) {
          const updated = [...prev];
          updated[exists] = parsed;
          return updated;
        }
        return [...prev, parsed];
      });
      setActiveVendorTab(parsed.vendorName);
      setCurrentVendorName("");
      setCurrentVendorText("");
    } catch (err) {
      setError(`Error analyzing vendor: ${err.message}`);
    }
    setAnalyzingVendor(false);
  };

  const loadDemoVendors = async () => {
    setAnalyzingVendor(true);
    clearError();
    const confirmedReqs = requirements.filter((r) => r.confirmed);
    const system = `You are a compliance analyst. Return ONLY valid JSON.`;

    const analyzeOne = async (name, text) => {
      const prompt = `Analyze this vendor proposal against requirements. Return:
{
  "vendorName": "${name}",
  "complianceScore": <integer 0-100>,
  "requirementResults": [
    {"reqId":"R001","status":"Met"|"Partial"|"Missing","confidence":<int>,"evidence":"...","gap":"..."}
  ],
  "risks": [
    {"text":"...","type":"Liability"|"Vague Language"|"Non-Commitment"|"Hidden Fee"|"Timeline Risk","impact":"..."}
  ]
}
Requirements: ${JSON.stringify(confirmedReqs)}
Proposal: ${text}`;
      const raw = USE_MOCK_AI
        ? JSON.stringify(mockVendorAnalysis(name, confirmedReqs))
        : await callGrok(system, prompt, 1200);
      return JSON.parse(raw);
    };

    try {
      const [a, b] = await Promise.all([
        analyzeOne("CloudTech Solutions", DEMO_VENDOR_A),
        analyzeOne("NexaCore Systems", DEMO_VENDOR_B),
      ]);

      // Save demo vendors to database
      if (currentRfpId) {
        database.saveVendor(a.vendorName, currentRfpId, a.complianceScore, a);
        database.saveVendor(b.vendorName, currentRfpId, b.complianceScore, b);
        console.log(`Saved demo vendors to database`);
      }

      setVendors([a, b]);
      setActiveVendorTab(a.vendorName);
    } catch (err) {
      setError(`Error loading demo vendors: ${err.message}`);
    }
    setAnalyzingVendor(false);
  };

  const categoryColors = {
    "Technical Specifications": { bg: "#E6F1FB", text: "#0C447C", dot: "#378ADD" },
    "Legal Compliance": { bg: "#FAEEDA", text: "#633806", dot: "#EF9F27" },
    "Financial Terms": { bg: "#EAF3DE", text: "#27500A", dot: "#639922" },
    "Environmental & Social": { bg: "#E1F5EE", text: "#085041", dot: "#1D9E75" },
  };

  const statusColors = {
    Met: { bg: "#EAF3DE", text: "#27500A" },
    Partial: { bg: "#FAEEDA", text: "#633806" },
    Missing: { bg: "#FCEBEB", text: "#791F1F" },
  };

  const riskColors = {
    Liability: "#A32D2D",
    "Vague Language": "#BA7517",
    "Non-Commitment": "#3B6D11",
    "Hidden Fee": "#993556",
    "Timeline Risk": "#185FA5",
  };

  const categories = [...new Set(requirements.map((r) => r.category))];
  const activeVendor = vendors.find((v) => v.vendorName === activeVendorTab);

  const renderUpload = () => (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 10px", color: "var(--color-text-primary)" }}>
          Tender Compliance Validator
        </h2>
        <p style={{ color: "var(--color-text-secondary)", margin: 0, fontSize: 15, maxWidth: 620, lineHeight: 1.7 }}>
          Automatically extract mandatory requirements from RFPs and validate vendor proposals against them. Reduce manual review time, eliminate missed clauses, and surface weak or missing language before contracts are signed.
        </p>
      </div>

      <div
        style={{
          border: "1.5px dashed var(--color-border-secondary)",
          borderRadius: 12,
          padding: "2.5rem",
          textAlign: "center",
          background: "var(--color-background-secondary)",
          marginBottom: "1.5rem",
          cursor: "pointer",
        }}
        onClick={() => fileInputRFP.current?.click()}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
        <p style={{ fontWeight: 500, margin: "0 0 4px", color: "var(--color-text-primary)" }}>
          {rfpName || "Drop your RFP document here"}
        </p>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
          .txt or .pdf files supported
        </p>
        <input ref={fileInputRFP} type="file" accept=".txt,.pdf" style={{ display: "none" }} onChange={handleRFPFile} />
      </div>

      {rfpText && (
        <div
          style={{
            background: "var(--color-background-primary)",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: 8,
            padding: "1rem",
            marginBottom: "1.5rem",
            fontSize: 13,
            color: "var(--color-text-secondary)",
            maxHeight: 180,
            overflowY: "auto",
            fontFamily: "monospace",
            lineHeight: 1.6,
          }}
        >
          {rfpText.slice(0, 800)}…
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: "1rem" }}>
        <button
          onClick={loadDemo}
          style={{
            flex: 1,
            padding: "10px",
            border: "0.5px solid var(--color-border-secondary)",
            borderRadius: 8,
            background: "var(--color-background-secondary)",
            cursor: "pointer",
            color: "var(--color-text-secondary)",
            fontSize: 14,
          }}
        >
          Load Demo RFP
        </button>
        <button
          onClick={extractRequirements}
          disabled={!rfpText || loadingReqs}
          style={{
            flex: 2,
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            background: rfpText && !loadingReqs ? "#185FA5" : "#ccc",
            color: "#fff",
            fontWeight: 500,
            fontSize: 14,
            cursor: rfpText && !loadingReqs ? "pointer" : "not-allowed",
          }}
        >
          {loadingReqs ? "Extracting Requirements…" : "Extract Requirements →"}
        </button>
      </div>
    </div>
  );

  const renderRequirements = () => (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 4px", color: "var(--color-text-primary)" }}>
            Requirement Checklist
          </h2>
          <p style={{ color: "var(--color-text-secondary)", margin: 0, fontSize: 14 }}>
            {requirements.filter((r) => r.confirmed).length} of {requirements.length} requirements confirmed
          </p>
        </div>
        <button
          onClick={() => setStep("vendors")}
          style={{
            padding: "9px 20px",
            background: "#185FA5",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 500,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Proceed to Vendor Analysis →
        </button>
      </div>

      {categories.map((cat) => {
        const catReqs = requirements.filter((r) => r.category === cat);
        const col = categoryColors[cat] || { bg: "#F1EFE8", text: "#2C2C2A", dot: "#888780" };
        return (
          <div key={cat} style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.dot, display: "inline-block" }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {cat}
              </span>
            </div>
            <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, overflow: "hidden" }}>
              {catReqs.map((req, i) => (
                <div
                  key={req.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "12px 16px",
                    borderBottom: i < catReqs.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none",
                    background: req.confirmed ? "var(--color-background-primary)" : "var(--color-background-secondary)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={req.confirmed}
                    onChange={() => toggleRequirement(req.id)}
                    style={{ marginTop: 2, cursor: "pointer", accentColor: "#185FA5" }}
                  />
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        padding: "2px 7px",
                        borderRadius: 4,
                        background: col.bg,
                        color: col.text,
                        marginRight: 8,
                      }}
                    >
                      {req.id}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 7px",
                        borderRadius: 4,
                        background: req.priority === "Critical" ? "#FCEBEB" : req.priority === "High" ? "#FAEEDA" : "#F1EFE8",
                        color: req.priority === "Critical" ? "#791F1F" : req.priority === "High" ? "#633806" : "#444441",
                      }}
                    >
                      {req.priority}
                    </span>
                    <p style={{ margin: "6px 0 0", fontSize: 14, color: req.confirmed ? "var(--color-text-primary)" : "var(--color-text-secondary)", lineHeight: 1.5 }}>
                      {req.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderVendors = () => (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 4px", color: "var(--color-text-primary)" }}>
            Vendor Analysis
          </h2>
          <p style={{ color: "var(--color-text-secondary)", margin: 0, fontSize: 14 }}>
            Upload vendor proposals to validate compliance
          </p>
        </div>
        {vendors.length >= 2 && (
          <button
            onClick={() => setStep("dashboard")}
            style={{ padding: "9px 20px", background: "#185FA5", color: "#fff", border: "none", borderRadius: 8, fontWeight: 500, cursor: "pointer", fontSize: 14 }}
          >
            View Dashboard →
          </button>
        )}
      </div>

      <div
        style={{
          background: "var(--color-background-secondary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: 10,
          padding: "1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
          Add Vendor Proposal
        </h3>
        <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Vendor name"
            value={currentVendorName}
            onChange={(e) => setCurrentVendorName(e.target.value)}
            style={{ flex: 1, minWidth: 140, padding: "8px 12px", borderRadius: 6, border: "0.5px solid var(--color-border-secondary)", fontSize: 14, background: "var(--color-background-primary)", color: "var(--color-text-primary)" }}
          />
          <button
            onClick={() => fileInputVendor.current?.click()}
            style={{ padding: "8px 14px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 6, background: "var(--color-background-primary)", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 13 }}
          >
            📎 Upload
          </button>
          <input ref={fileInputVendor} type="file" accept=".txt,.pdf" style={{ display: "none" }} onChange={handleVendorFile} />
        </div>
        {currentVendorText && (
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 10 }}>
            ✓ Document loaded ({currentVendorText.length} chars)
          </div>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={analyzeVendor}
            disabled={!currentVendorText || !currentVendorName || analyzingVendor}
            style={{
              padding: "8px 18px",
              background: currentVendorText && currentVendorName && !analyzingVendor ? "#185FA5" : "#ccc",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 500,
              cursor: currentVendorText && currentVendorName && !analyzingVendor ? "pointer" : "not-allowed",
              fontSize: 13,
            }}
          >
            {analyzingVendor ? "Analyzing…" : "Analyze Vendor"}
          </button>
          {vendors.length === 0 && (
            <button
              onClick={loadDemoVendors}
              disabled={analyzingVendor}
              style={{
                padding: "8px 18px",
                background: "var(--color-background-primary)",
                color: "var(--color-text-secondary)",
                border: "0.5px solid var(--color-border-secondary)",
                borderRadius: 6,
                cursor: analyzingVendor ? "not-allowed" : "pointer",
                fontSize: 13,
              }}
            >
              {analyzingVendor ? "Loading Demo…" : "Load Demo Vendors"}
            </button>
          )}
        </div>
      </div>

      {vendors.length > 0 && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
            {vendors.map((v) => (
              <button
                key={v.vendorName}
                onClick={() => setActiveVendorTab(v.vendorName)}
                style={{
                  padding: "7px 16px",
                  borderRadius: 6,
                  border: activeVendorTab === v.vendorName ? "1.5px solid #185FA5" : "0.5px solid var(--color-border-secondary)",
                  background: activeVendorTab === v.vendorName ? "#E6F1FB" : "var(--color-background-primary)",
                  color: activeVendorTab === v.vendorName ? "#0C447C" : "var(--color-text-secondary)",
                  fontWeight: activeVendorTab === v.vendorName ? 500 : 400,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                {v.vendorName}
                <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: v.complianceScore >= 80 ? "#3B6D11" : v.complianceScore >= 60 ? "#854F0B" : "#A32D2D" }}>
                  {v.complianceScore}%
                </span>
              </button>
            ))}
          </div>

          {activeVendor && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: "1.5rem" }}>
                {[
                  { label: "Compliance Score", value: `${activeVendor.complianceScore}%`, good: activeVendor.complianceScore >= 80 },
                  { label: "Requirements Met", value: activeVendor.requirementResults?.filter((r) => r.status === "Met").length || 0 },
                  { label: "Partial / Missing", value: activeVendor.requirementResults?.filter((r) => r.status !== "Met").length || 0 },
                  { label: "Risk Flags", value: activeVendor.risks?.length || 0 },
                ].map((m) => (
                  <div key={m.label} style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 500, color: "var(--color-text-primary)" }}>{m.value}</div>
                  </div>
                ))}
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 10, color: "var(--color-text-primary)" }}>Requirement Results</h3>
              <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, overflow: "hidden", marginBottom: "1.5rem" }}>
                {activeVendor.requirementResults?.map((res, i) => {
                  const req = requirements.find((r) => r.id === res.reqId);
                  const sc = statusColors[res.status] || statusColors.Missing;
                  return (
                    <div
                      key={res.reqId}
                      style={{
                        padding: "12px 16px",
                        borderBottom: i < activeVendor.requirementResults.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none",
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                        cursor: res.status !== "Met" ? "pointer" : "default",
                        background: deepDiveReq === res.reqId ? "var(--color-background-secondary)" : "var(--color-background-primary)",
                      }}
                      onClick={() => res.status !== "Met" && setDeepDiveReq(deepDiveReq === res.reqId ? null : res.reqId)}
                    >
                      <span style={{ padding: "3px 9px", borderRadius: 5, fontSize: 12, fontWeight: 500, background: sc.bg, color: sc.text, whiteSpace: "nowrap" }}>
                        {res.status}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 3 }}>
                          {res.reqId}: {req?.text || "Requirement"}
                        </div>
                        {deepDiveReq === res.reqId && (
                          <div style={{ marginTop: 8, padding: "10px 12px", background: "var(--color-background-secondary)", borderRadius: 6, fontSize: 13 }}>
                            {res.evidence && (
                              <p style={{ margin: "0 0 6px", color: "var(--color-text-secondary)" }}>
                                <strong>Evidence:</strong> "{res.evidence}"
                              </p>
                            )}
                            {res.gap && (
                              <p style={{ margin: 0, color: "#A32D2D" }}>
                                <strong>Gap:</strong> {res.gap}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                        {res.confidence}% match
                      </div>
                    </div>
                  );
                })}
              </div>

              {activeVendor.risks?.length > 0 && (
                <>
                  <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 10, color: "var(--color-text-primary)" }}>
                    Risk Flags ({activeVendor.risks.length})
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {activeVendor.risks.map((risk, i) => (
                      <div key={i} style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, padding: "12px 14px", borderLeft: `3px solid ${riskColors[risk.type] || "#888"}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 4, background: "#FCEBEB", color: "#791F1F" }}>
                            {risk.type}
                          </span>
                        </div>
                        <p style={{ margin: "4px 0", fontSize: 13, color: "var(--color-text-primary)", fontStyle: "italic" }}>
                          "{risk.text}"
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-text-secondary)" }}>
                          {risk.impact}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderDashboard = () => {
    const maxScore = Math.max(...vendors.map((v) => v.complianceScore));
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 4px", color: "var(--color-text-primary)" }}>
              Compliance Dashboard
            </h2>
            <p style={{ color: "var(--color-text-secondary)", margin: 0, fontSize: 14 }}>
              Comparing {vendors.length} vendors across {requirements.filter((r) => r.confirmed).length} requirements
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: "2rem" }}>
          {vendors.map((v) => {
            const isTop = v.complianceScore === maxScore;
            return (
              <div
                key={v.vendorName}
                style={{
                  background: "var(--color-background-primary)",
                  border: isTop ? "1.5px solid #185FA5" : "0.5px solid var(--color-border-tertiary)",
                  borderRadius: 12,
                  padding: "1.25rem",
                  position: "relative",
                }}
              >
                {isTop && (
                  <span style={{ position: "absolute", top: -10, left: 16, fontSize: 11, fontWeight: 500, background: "#185FA5", color: "#fff", padding: "2px 10px", borderRadius: 4 }}>
                    Top Candidate
                  </span>
                )}
                <h3 style={{ fontSize: 16, fontWeight: 500, margin: "0 0 12px", color: "var(--color-text-primary)" }}>{v.vendorName}</h3>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Compliance</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: v.complianceScore >= 80 ? "#3B6D11" : v.complianceScore >= 60 ? "#854F0B" : "#A32D2D" }}>
                      {v.complianceScore}%
                    </span>
                  </div>
                  <div style={{ height: 6, background: "var(--color-background-secondary)", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${v.complianceScore}%`, background: v.complianceScore >= 80 ? "#639922" : v.complianceScore >= 60 ? "#EF9F27" : "#E24B4A", borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--color-text-secondary)" }}>
                  <span>✓ {v.requirementResults?.filter((r) => r.status === "Met").length} met</span>
                  <span>⚠ {v.risks?.length} risks</span>
                  <span>✗ {v.requirementResults?.filter((r) => r.status === "Missing").length} missing</span>
                </div>
              </div>
            );
          })}
        </div>

        <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 12, color: "var(--color-text-primary)" }}>
          Side-by-Side Requirement Comparison
        </h3>
        <div style={{ overflowX: "auto", marginBottom: "2rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, tableLayout: "fixed" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border-secondary)" }}>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: 500, width: "40%" }}>Requirement</th>
                {vendors.map((v) => (
                  <th key={v.vendorName} style={{ padding: "8px 12px", textAlign: "center", color: "var(--color-text-secondary)", fontWeight: 500 }}>
                    {v.vendorName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requirements.filter((r) => r.confirmed).map((req, i) => (
                <tr key={req.id} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)", background: i % 2 === 0 ? "var(--color-background-primary)" : "var(--color-background-secondary)" }}>
                  <td style={{ padding: "8px 12px", color: "var(--color-text-primary)" }}>
                    <span style={{ fontSize: 11, color: "var(--color-text-secondary)", marginRight: 6 }}>{req.id}</span>
                    {req.text.length > 60 ? req.text.slice(0, 60) + "…" : req.text}
                  </td>
                  {vendors.map((v) => {
                    const res = v.requirementResults?.find((r) => r.reqId === req.id);
                    const sc = statusColors[res?.status] || statusColors.Missing;
                    return (
                      <td key={v.vendorName} style={{ padding: "8px 12px", textAlign: "center" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 12, background: sc.bg, color: sc.text }}>
                          {res?.status || "—"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 12, color: "var(--color-text-primary)" }}>
          Risk Heatmap
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {vendors.map((v) => {
            const grouped = {};
            v.risks?.forEach((r) => {
              grouped[r.type] = (grouped[r.type] || 0) + 1;
            });
            return (
              <div key={v.vendorName} style={{ background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: "1rem" }}>
                <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 10, color: "var(--color-text-primary)" }}>{v.vendorName}</div>
                {Object.keys(grouped).length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>No risks flagged</div>
                ) : (
                  Object.entries(grouped).map(([type, count]) => (
                    <div key={type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{type}</span>
                      <div style={{ display: "flex", gap: 4 }}>
                        {Array.from({ length: count }).map((_, i) => (
                          <span key={i} style={{ width: 10, height: 10, borderRadius: 2, background: riskColors[type] || "#888", display: "inline-block" }} />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-tertiary)", fontFamily: "var(--sans)" }} className={darkMode ? 'dark-mode' : ''}>
      {error && (
        <div style={{ background: "#FCEBEB", borderBottom: "1px solid #F5BCBC", padding: "12px 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ maxWidth: 900, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontSize: 14, color: "#791F1F" }}>
              <strong>Error:</strong> {error}
            </div>
            <button
              onClick={clearError}
              style={{ padding: "2px 8px", border: "none", background: "transparent", color: "#791F1F", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        </div>
      )}
      <div style={{ background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚖️</span>
            <span style={{ fontWeight: 600, fontSize: 16, color: "var(--color-text-primary)" }}>Tender Compliance Validator</span>
            {rfpName && (
              <>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)", padding: "2px 8px", background: "var(--color-background-secondary)", borderRadius: 4 }}>
                  {rfpName}
                </span>
                <span style={{ fontSize: 11, color: "var(--color-text-secondary)", padding: "2px 6px", background: "#E6F1FB", borderRadius: 4 }}>
                  💾 {requirements.length} reqs, {vendors.length} vendors
                </span>
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {STEPS.map((s, i) => {
              const labels = { upload: "Upload RFP", requirements: "Review Checklist", vendors: "Vendor Analysis", dashboard: "Final Dashboard" };
              const accessible = (s === "upload") || (s === "requirements" && requirements.length > 0) || (s === "vendors" && requirements.length > 0) || (s === "dashboard" && vendors.length >= 1);
              return (
                <button
                  key={s}
                  onClick={() => accessible && setStep(s)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: step === s ? "#185FA5" : "transparent",
                    color: step === s ? "#fff" : accessible ? "var(--color-text-secondary)" : "var(--color-border-secondary)",
                    fontWeight: step === s ? 500 : 400,
                    cursor: accessible ? "pointer" : "not-allowed",
                    fontSize: 13,
                  }}
                >
                  {i + 1}. {labels[s]}
                </button>
              );
            })}
            {step === 'dashboard' && vendors.length > 0 && (
              <button
                onClick={exportComplianceReport}
                style={{
                  padding: '4px 12px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                📄 Export
              </button>
            )}
            <button
              onClick={toggleDarkMode}
              style={{
                padding: '4px 12px',
                backgroundColor: darkMode ? '#444444' : '#e9ecef',
                color: darkMode ? '#ffffff' : '#333333',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>

      <div>
        {step === "upload" && renderUpload()}
        {step === "requirements" && renderRequirements()}
        {step === "vendors" && renderVendors()}
        {step === "dashboard" && renderDashboard()}
      </div>

      {/* Database Stats Footer */}
      <div style={{ background: "var(--color-background-secondary)", borderTop: "0.5px solid var(--color-border-tertiary)", padding: "8px 1rem", marginTop: "auto" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
             <strong>Database Stats:</strong> {currentRfpId ? `Active RFP` : " 0 RFPs"} | {requirements.length}  Requirements | {vendors.length}  Vendors
          </div>
          <button
            onClick={() => {
              const stats = {
                rfps: JSON.parse(localStorage.getItem('tender_validator_rfps') || '[]').length,
                requirements: JSON.parse(localStorage.getItem('tender_validator_requirements') || '[]').length,
                vendors: JSON.parse(localStorage.getItem('tender_validator_vendors') || '[]').length,
                sessions: JSON.parse(localStorage.getItem('tender_validator_sessions') || '[]').length
              };
              console.log('Database Stats:', stats);
              alert(` Storage Stats:\n\n RFPs: ${stats.rfps}\n Requirements: ${stats.requirements}\n Vendors: ${stats.vendors}\n Sessions: ${stats.sessions}\n\nOpen DevTools (F12) → Application → Local Storage to view raw data.`);
            }}
            style={{ fontSize: 10, padding: "3px 8px", background: "#E6F1FB", color: "#0C447C", border: "none", borderRadius: 4, cursor: "pointer" }}
          >
            View Storage 🔍
          </button>
        </div>
      </div>
    </div>
  );
}