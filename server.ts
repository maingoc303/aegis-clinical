import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import mammoth from "mammoth";
import * as xlsx from "xlsx";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Ensure Gemini API client is carefully initialized
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not defined");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Set up standard parsers with generous limits to support medium-to-large medical documents
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));

  // API Endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Unified integrated dossier analysis endpoint
  app.post("/api/analyze-medical-dossier", async (req, res) => {
    try {
      const { documentFile, imageFile, medicalHistory, model, expertise, manualCurationGuidance } = req.body;

      if (!documentFile && !imageFile) {
        return res.status(400).json({ error: "Please upload at least one clinical document or a medical imaging file to analyze." });
      }

      let selectedModel = model || "gemini-3.5-flash";
      const validModels = ["gemini-3.5-flash", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite"];
      if (!validModels.includes(selectedModel)) {
        selectedModel = "gemini-3.5-flash";
      }

      const parts: any[] = [];
      let textInstructions = "Please analyze this patient's clinical file and provide organized results. ";

      if (medicalHistory) {
        textInstructions += `\n[Patient Pre-existing Medical History & Context]:\n"${medicalHistory}"\n`;
      }

      if (expertise) {
        textInstructions += `\n[Context - Expected Recipient Expertise Profile]: "${expertise}"\n`;
      }

      if (manualCurationGuidance) {
        textInstructions += `\n[CRITICAL - USER MANUAL CURATION GUIDANCE & RULE OVERRIDES]:\n"${manualCurationGuidance}"\nApply these manual reference ranges or focus clinical parameters strictly.\n`;
      }

      // Handle Clinical Document if provided
      if (documentFile) {
        const { fileName, fileType, base64 } = documentFile;
        const buffer = Buffer.from(base64, "base64");
        const lowerName = fileName.toLowerCase();
        let extractedText = "";

        if (lowerName.endsWith(".docx") || lowerName.endsWith(".doc")) {
          try {
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value;
          } catch (e: any) {
            extractedText = `[Failed to extract text from Word document: ${e.message}]`;
          }
        } else if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls") || lowerName.endsWith(".csv")) {
          try {
            const workbook = xlsx.read(buffer, { type: "buffer" });
            let sheetData = "";
            workbook.SheetNames.forEach((name) => {
              const worksheet = workbook.Sheets[name];
              const csv = xlsx.utils.sheet_to_csv(worksheet);
              if (csv.trim()) {
                sheetData += `\n--- Sheet: ${name} ---\n${csv}\n`;
              }
            });
            extractedText = sheetData || "[Empty sheet]";
          } catch (e: any) {
            extractedText = `[Failed to parse sheet: ${e.message}]`;
          }
        } else if (fileType.includes("text/") || lowerName.endsWith(".txt") || lowerName.endsWith(".json") || lowerName.endsWith(".md")) {
          extractedText = buffer.toString("utf-8");
        }

        // If it is PDF, we can upload it as native inlineData!
        if (fileType.includes("pdf")) {
          parts.push({
            inlineData: {
              data: base64,
              mimeType: fileType,
            }
          });
          textInstructions += `\n[Primary PDF Clinical Document Attachment Included]\n`;
        } else if (fileType.includes("image/")) {
          // If they uploaded image in front-end document bucket, process it natively
          parts.push({
            inlineData: {
              data: base64,
              mimeType: fileType,
            }
          });
          textInstructions += `\n[Primary Document Image Attachment Included]\n`;
        } else if (extractedText) {
          textInstructions += `\n--- PRIMARY CLINICAL DOCUMENT TEXT CONTENT --- \n${extractedText}\n--- END PRIMARY CLINICAL DOCUMENT ---\n`;
        }
      }

      // Handle Imaging visual scan image if provided
      if (imageFile) {
        const { fileName, fileType, base64 } = imageFile;
        parts.push({
          inlineData: {
            data: base64,
            mimeType: fileType,
          }
        });
        textInstructions += `\n[Imaging visual scan or diagnostic image file attached: "${fileName}" of type ${fileType}]\n`;
      }

      parts.push({ text: textInstructions });

      const ai = getGeminiClient();

      let expertiseInstruction = "";
      if (expertise === "PATIENT") {
        expertiseInstruction = "Your target recipient is a patient/layman. Keep the 'summary' and 'findings.notes' direct, warm, supportive, and extremely clear. Explain complex symbols and ranges.";
      } else if (expertise === "MD_PRACTITIONER") {
        expertiseInstruction = "Your target recipient is an MD/DO Practitioner. Use highly precise, professional medical taxonomy. Focus heavily on pathophysiological markers, differential diagnosis, and clinical diagnostic guidelines in the notes and summary.";
      } else if (expertise === "PHARMACIST") {
        expertiseInstruction = "Your target recipient is a Clinical Pharmacist. Emphasize medication molecules, CYP interaction substrates, renal/hepatic dosing metrics, and bio-metabolic ranges in findings and summaries.";
      } else if (expertise === "PATHOLOGIST") {
        expertiseInstruction = "Your target recipient is a Pathology / Lab Specialist. Focus strictly on cellular morphology, tissue margins, biomarkers assay boundaries, histology stains (H&E, IHC), and fluid mechanics.";
      } else if (expertise === "RESEARCHER") {
        expertiseInstruction = "Your target recipient is a Medical Researcher. Connect parameters to phenotypic codes, genomic classifications, and standardized databases or research indexes.";
      }

      let manualCurationRules = "";
      if (manualCurationGuidance) {
        manualCurationRules = `\n[CRITICAL OVERRIDES - HUMAN CURATION ACTIVE]:\n${manualCurationGuidance}\nYou MUST force status flags and value classifications to adhere exactly to this manual override rule.`;
      }

      const systemInstruction = `You are Aegis-Clinical, an exceptionally precise multimodal medical intelligence system and diagnostic scanner interpreter.
Your task is to analyze an integrated clinical dossier containing potentially a patient document, a diagnostic imaging visualization (like Xray, CT scan, MRI, pathology tissue slide, H&E stains, Ultrasounds, etc.), and patient-provided pre-existing health history.

${expertiseInstruction}
${manualCurationRules}

You MUST extract and integrate findings into a rigorous JSON compliance:
1. "imageObservations": If a clinical image/scan was attached, act as an expert radiologist/pathologist and provide a pristine, state-of-the-art language summary of the visualization - describing specific anatomical structures viewed, any density changes, calcifications, lesions, potential fractures, or healthy tissue configurations. If no image was provided, leave this field blank or null.
2. "summary": Provide a unified, elegant clinical-domain appropriate synthesis which combines findings from BOTH the clinical document AND the imaging observations, while also contextualizing them for the user in light of their pre-existing \`medicalHistory\` (e.g., advising them on how these findings interrelate with past history).
3. "findings": A list of all measurable or medically significant laboratory parameters, vital signs, or radiological/pathological findings (e.g. glucose, HbA1c, pulmonary consolidation, femur bone alignment, tissue biopsy lymphocyte counts):
  - parameter: string (e.g., 'Calcium', 'Lung Fields', 'Bone Alignment')
  - value: string (e.g., '9.8 mg/dL', 'Streaky opacity in right lower lobe', 'No cortical fracture')
  - referenceRange: string (optional, e.g., '8.5-10.2 mg/dL')
  - status: string (MUST be: NORMAL, HIGH, LOW, or ABNORMAL)
  - notes: string (optional, e.g. elevated, suggestive of recovery, normal)
4. "diagnoses": List of diagnosed clinical conditions mentioned explicitly, or principal impressions derived (e.g. 'Type 2 Diabetes mellitus', 'Pneumonia suspect', 'Unremarkable tissue biopsy').
5. "medicationsAndRecommendations": Any recommended therapies, prescription items, behavioral modifications, or clinical tests to ask a physician:
  - item: string
  - dosageOrInstructions: string (optional)
  - purpose: string (optional)
6. "criticalAlerts": Critical out-of-range clinical alerts or urgent flags requiring immediate physician notice (e.g. critically high potassium, severe pneumonia, tissue malignancy risks). Empty array if none.`;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              patientName: { type: Type.STRING },
              patientAge: { type: Type.STRING },
              patientGender: { type: Type.STRING },
              patientId: { type: Type.STRING },
              documentDate: { type: Type.STRING },
              documentType: { type: Type.STRING },
              facilityName: { type: Type.STRING },
              providerName: { type: Type.STRING },
              summary: { type: Type.STRING },
              imageObservations: { type: Type.STRING },
              findings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    parameter: { type: Type.STRING },
                    value: { type: Type.STRING },
                    referenceRange: { type: Type.STRING },
                    status: { type: Type.STRING },
                    notes: { type: Type.STRING },
                  },
                  required: ["parameter", "value"],
                },
              },
              diagnoses: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              medicationsAndRecommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.STRING },
                    dosageOrInstructions: { type: Type.STRING },
                    purpose: { type: Type.STRING },
                  },
                  required: ["item"],
                },
              },
              criticalAlerts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["documentType", "summary"],
          },
        },
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("No synthesis data returned from Aegis AI execution layer.");
      }

      const parsedJSON = JSON.parse(resultText.trim());
      res.json({ success: true, data: parsedJSON });
    } catch (err: any) {
      console.error("Dossier endpoint failure:", err);
      res.status(500).json({ error: err.message || "An error occurred compiling your integrated medical dossier." });
    }
  });

  // AI Medical Chatbot endpoint
  app.post("/api/medical-chat", async (req, res) => {
    try {
      const { messages, medicalContext, model, expertise, manualCurationGuidance } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Missing or invalid 'messages' array in request body." });
      }

      let selectedModel = model || "gemini-3.5-flash";
      const validModels = ["gemini-3.5-flash", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite"];
      if (!validModels.includes(selectedModel)) {
        selectedModel = "gemini-3.5-flash";
      }

      const ai = getGeminiClient();

      let chatSystemInstruction = `You are a respectful, compassionate, and highly informative medical AI assistant.
Your main role is to help the user understand their clinical values, health documents, symptoms, or queries in an intuitive way.

${medicalContext ? `The user has uploaded a medical document. Here is the structured medical information extracted from that document:
--- EXTRACTED MEDICAL CONTEXT ---
${JSON.stringify(medicalContext, null, 2)}
--- END OF MEDICAL CONTEXT ---

Please refer back to this document to address their questions accurately and custom-tailor your support. Cite values, reference ranges, and recommendations directly from this data when assisting them.` : "The user has not uploaded any medical document yet. Answer their health or physical queries with clinically balanced knowledge."}`;

      if (expertise === "PATIENT") {
        chatSystemInstruction += `\n\n[USER EXPERTISE: Patient/Layman Advocate]. Explain all complex clinical indices (such as LVEF, Troponin, HbA1c, cell morphology) using direct, warm, supportive, and accessible analogies. Focus heavily on simple education definitions, lifestyle/diet tips, hydration/sleep advise, and explicit, polite questions they can discuss with their direct healthcare provider.`;
      } else if (expertise === "MD_PRACTITIONER") {
        chatSystemInstruction += `\n\n[USER EXPERTISE: Licensed Clinical Practitioner (MD/DO/NP)]. Address them as a clinical peer. Discuss advanced differential diagnoses, physiological staging (such as heart failure stages or NYHA scores), potential pathophysiological correlation models, therapeutic progression options, and clinical alert values to verify.`;
      } else if (expertise === "PHARMACIST") {
        chatSystemInstruction += `\n\n[USER EXPERTISE: Clinical Pharmacist (PharmD)]. Focus on drug structures, pharmacokinetic dynamics, CYP enzyme pathways, hepatic/renal clearance estimates, contraindications with food or drugs, bioavailabilities, and FDA standards or drug-equivalence parameters.`;
      } else if (expertise === "PATHOLOGIST") {
        chatSystemInstruction += `\n\n[USER EXPERTISE: Pathologist / Lab Scientist]. Discuss cell morphology markers, specimen handling variables (e.g. assays, blood chemistry calibration limits), cytological stain results (H&E, IHC), tissue biopsy margins, and immune cells infiltration metrics.`;
      } else if (expertise === "RESEARCHER") {
        chatSystemInstruction += `\n\n[USER EXPERTISE: Biobank/Clinical Researcher]. Reference phenotypic indicators, scientific cohort trends, database registries, LOINC/SNOMED-CT clinical coding standards, experimental design benchmarks, statistical power variance, and relevant medical literature trends.`;
      }

      if (manualCurationGuidance) {
        chatSystemInstruction += `\n\n[CRITICAL HUMAN CURATION OVERRIDES]: The user has established strict custom guidelines which you MUST treat as absolute truth for this session, over-riding classic rules:\n"${manualCurationGuidance}"`;
      }

      chatSystemInstruction += `\n\nYour strict operational safety protocols:
1. Speak matching the recipient's chosen clinical expertise level as outlined above.
2. Under no circumstances should you make final authoritative clinical diagnoses or dictate prescription changes without reminding the user of standard physician collaboration checks.
3. Support clean, beautiful markdown. Use bolding, lists, bullet points, interactive tables, and clear headers to maintain pristine legibility.
4. If some values look highly critical, highlight them promptly.`;

      // Structure messages list into Gemini's expected Content objects
      const geminiContents = messages.map((m: any) => ({
        role: m.role === "model" ? "model" : m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      // Generate Chat completion
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: geminiContents,
        config: {
          systemInstruction: chatSystemInstruction,
          temperature: 0.35, // lower temperature for high factual accuracy in clinical questions
        },
      });

      const replyText = response.text;
      res.json({ success: true, response: replyText });
    } catch (err: any) {
      console.error("Chat Endpoint Failure:", err);
      res.status(500).json({ error: err.message || "The medical chatbot encountered an error answering your message." });
    }
  });

  // AI Longitudinal Trend Analyzer endpoint
  app.post("/api/analyze-longitudinal", async (req, res) => {
    try {
      const { records, model } = req.body;

      if (!records || !Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ error: "Please upload and process at least one report to perform longitudinal analysis." });
      }

      let selectedModel = model || "gemini-3.5-flash";
      const validModels = ["gemini-3.5-flash", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite"];
      if (!validModels.includes(selectedModel)) {
        selectedModel = "gemini-3.5-flash";
      }

      // Sort chronological ascending (oldest first)
      const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Prepare chronological text report log
      let chronologyExcerpt = "Chronological Patient Historical Records Provided:\n\n";
      sortedRecords.forEach((rec, idx) => {
        chronologyExcerpt += `[Record #${idx + 1}] Date: ${rec.date}\n`;
        if (rec.fileName) chronologyExcerpt += `- Attachment File: ${rec.fileName}\n`;
        if (rec.imageName) chronologyExcerpt += `- Visual Scan Image: ${rec.imageName}\n`;
        chronologyExcerpt += `- Hospital Type: ${rec.medicalData.documentType || "Consultation/Lab"}\n`;
        chronologyExcerpt += `- Main Summary: ${rec.medicalData.summary}\n`;
        if (rec.medicalData.imageObservations) {
          chronologyExcerpt += `- Imaging Scan Analysis: ${rec.medicalData.imageObservations}\n`;
        }
        
        chronologyExcerpt += `- Biomarker Finding Parameters:\n`;
        if (rec.medicalData.findings && rec.medicalData.findings.length > 0) {
          rec.medicalData.findings.forEach((f: any) => {
            chronologyExcerpt += `  * Parameter: "${f.parameter}", Value: "${f.value}", Normal-Range: "${f.referenceRange || "N/A"}", Status: "${f.status}"\n`;
          });
        } else {
          chronologyExcerpt += `  * No direct numerical metrics detected.\n`;
        }
        
        if (rec.medicalData.diagnoses && rec.medicalData.diagnoses.length > 0) {
          chronologyExcerpt += `- Clinical Impressions/Diagnoses: ${rec.medicalData.diagnoses.join(", ")}\n`;
        }
        chronologyExcerpt += "\n";
      });

      const ai = getGeminiClient();

      const longitudinalSystemInstruction = `You are Aegis-Longitudinal-Explorer, an exceptionally precise clinical trend analytics engine.
Your purpose is to conduct a longitudinal evaluation of a patient's historical medical records over multiple sequenced collection dates.

You must examine and output a highly polished, professional medical progression report structured in clean markdown:
1. **Executive Progression Summary**: A concise (1-2 paragraph) description of how the patient's general health status is changing, highlighting any clear system patterns.
2. **Biomarker Progression Logs**: Highlight which parameters (like e.g. Glucose, blood pressure, white blood cells) have been measured multiple times. Note whether values are showing improvement (approaching normal ranges), stability, or clear deterioration/safety alarms.
3. **Condition Progression Analysis**: Review has past conditions or impressions resolved, worsened, or stayed chronic.
4. **Therapeutic Feedback loop**: Give a clinical evaluation on whether their current health updates (medications, interventions) appear to be working based on follow-up report findings.
5. **Actionable Healthy Optimization Advice**: Recommend safe, precise lifestyle habits, monitoring intervals, or specialist follow-ups to discuss with their physician.

Operational Protocols:
- Maintain an objective, highly scientific yet deeply supportive clinical tone.
- Never write specific drug dosages or authorized prescriptions.
- Always conclude with a strong standard warning advising consulting a physical MD for actual medical actions.`;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: [
          { text: chronologyExcerpt },
          { text: "Analyze the chronological sequence above and output the highly comprehensive Markdown report accordingly." }
        ],
        config: {
          systemInstruction: longitudinalSystemInstruction,
          temperature: 0.25,
        }
      });

      const replyText = response.text;
      res.json({ success: true, analysis: replyText });
    } catch (err: any) {
      console.error("Longitudinal analysis failure:", err);
      res.status(500).json({ error: err.message || "An error occurred during longitudinal trend synthesis." });
    }
  });

  // Enable Dev vs Prod environment hosting
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Medical Application Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
