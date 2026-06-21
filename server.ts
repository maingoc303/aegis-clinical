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
  const PORT = 3000;

  // Set up standard parsers with generous limits to support medium-to-large medical documents
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));

  // API Endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // File parsing endpoint
  app.post("/api/analyze-medical-file", async (req, res) => {
    try {
      const { fileName, fileType, base64 } = req.body;

      if (!base64 || !fileName || !fileType) {
        return res.status(400).json({ error: "Missing required parameters: fileName, fileType, or base64" });
      }

      const buffer = Buffer.from(base64, "base64");
      let extractedText = "";
      let isNativeFormat = false; // Whether Gemini can process base64 natively (PDF/Image)
      let geminiMimeType = fileType;

      // Classify format & handle extraction if conversion is needed
      const lowerName = fileName.toLowerCase();
      
      if (lowerName.endsWith(".docx") || lowerName.endsWith(".doc")) {
        // Convert MS Word DOCX to plain text
        try {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value;
          if (!extractedText.trim()) {
            extractedText = "[Attempted text extraction from Word document, but it returned empty. The file might contain only images or be blank.]";
          }
        } catch (docxErr: any) {
          console.error("Mammoth text extraction error:", docxErr);
          extractedText = `[Failed to extract text from Word document: ${docxErr.message || docxErr}]`;
        }
      } else if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls") || lowerName.endsWith(".csv")) {
        // Convert Excel worksheets or CSV files to structured text
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
          extractedText = sheetData || "[The spreadsheet file appears empty of content.]";
        } catch (xlsxErr: any) {
          console.error("XLSX text extraction error:", xlsxErr);
          extractedText = `[Failed to parse spreadsheet content: ${xlsxErr.message || xlsxErr}]`;
        }
      } else if (fileType.includes("text/") || lowerName.endsWith(".txt") || lowerName.endsWith(".json") || lowerName.endsWith(".md")) {
        // Decode raw text / simple JSON formats
        extractedText = buffer.toString("utf-8");
      } else if (fileType.includes("pdf") || fileType.includes("image/")) {
        // Supported natively by Gemini multimodal models
        isNativeFormat = true;
        // Standardize image types if needed
        geminiMimeType = fileType;
      } else {
        // Fallback: try reading as plain UTF-8 text string
        extractedText = buffer.toString("utf-8");
      }

      const ai = getGeminiClient();

      // Configure system prompting to structure the response exactly as a robust MedicalData JSON schema
      const systemInstruction = `You are an expert AI clinical data analyst and medical document parser.
Verify details carefully. Your task is to extract medical parameters from the uploaded file and structure them into a highly accurate, clean JSON response that respects the user's health information.
Do not hallucinate categories or invent fake information. Highlight clear facts.

Return a JSON with the following structure:
patientName: (string, blank if omitted)
patientAge: (string, blank if omitted)
patientGender: (string, blank if omitted)
patientId: (string, blank if omitted, e.g. MRN, card number, hospital record number)
documentDate: (string, date of medical document as written/implicit, blank if omitted)
documentType: (string, e.g. blood panel index, radiological scan, discharge note, medication list, clinical prescription)
facilityName: (string, name of hospital or lab name if applicable)
providerName: (string, doctor or clinical provider name if available)
summary: (string, 2 TO 3 sentences explaining what this document is, what its overall outlook is, written in friendly, clear, respectful language for the patient - translation to layperson terms)
findings: (array of objects, containing list of clinically measurable or notable params, labs, parameters, etc., e.g., blood cell counts, MRI abnormalities, prescription instructions:
  - parameter: string (e.g. Glucose, Heart Rate, Left Knee Condition)
  - value: string (e.g. 104 mg/dL, 72 bpm, Mild joint effusion)
  - referenceRange: string (optional, e.g. 70-99 mg/dL or normal range, blank if omitted)
  - status: string (MUST be: NORMAL, HIGH, LOW, or ABNORMAL)
  - notes: string (optional, e.g. elevated, indicative of slight prediabetes, or fully normal)
)
diagnoses: (array of strings, formal clinically diagnosed conditions stated in document, e.g. "Essential Hypertension Status", "Acute Bronchitis")
medicationsAndRecommendations: (array of objects, list of prescribed medications or medical advices:
  - item: string (medication name or instruction name)
  - dosageOrInstructions: string (optional instruction/dose, e.g. 500mg once daily with breakfast)
  - purpose: string (optional purpose, e.g. hypertension control/lower inflammation)
)
criticalAlerts: (array of strings, any critical out-of-range clinical flags or emergency alerts that patients MUST see immediately. Empty array if none.)`;

      let contents: any;

      if (isNativeFormat) {
        // Send actual PDF/image content inline to the multimodal engine
        contents = {
          parts: [
            {
              inlineData: {
                data: base64,
                mimeType: geminiMimeType,
              },
            },
            {
              text: "Extract and map the complete clinical variables present in this document into the requested JSON schema. Write clinically detailed findings and understandable layman summaries.",
            },
          ],
        };
      } else {
        // Send pre-extracted plain text content to Gemini
        contents = {
          parts: [
            {
              text: `Please analyze the following extracted text content from the file "${fileName}" and output structured clinical information:

--- BEGIN EXTRACTED TEXT ---
${extractedText}
--- END EXTRACTED TEXT ---`,
            },
          ],
        };
      }

      // Generate medical report JSON using gemini-3.5-flash
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
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
        throw new Error("No data returned from Gemini analysis engine.");
      }

      const parsedJSON = JSON.parse(resultText.trim());
      res.json({ success: true, data: parsedJSON, originalFileName: fileName });
    } catch (err: any) {
      console.error("Analysis Endpoint Failure:", err);
      res.status(500).json({ error: err.message || "An error occurred while compiling your medical report." });
    }
  });

  // AI Medical Chatbot endpoint
  app.post("/api/medical-chat", async (req, res) => {
    try {
      const { messages, medicalContext } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Missing or invalid 'messages' array in request body." });
      }

      const ai = getGeminiClient();

      const chatSystemInstruction = `You are a respectful, compassionate, and highly informative medical AI assistant.
Your main role is to help the user understand their clinical values, health documents, symptoms, or queries in an intuitive way.

${medicalContext ? `The user has uploaded a medical document. Here is the structured medical information extracted from that document:
--- EXTRACTED MEDICAL CONTEXT ---
${JSON.stringify(medicalContext, null, 2)}
--- END OF MEDICAL CONTEXT ---

Please refer back to this document to address their questions accurately and custom-tailor your support. Cite values, reference ranges, and recommendations directly from this data when assisting them.` : "The user has not uploaded any medical document yet. Answer their health or physical queries with clinically balanced knowledge."}

Your strict operational safety protocols:
1. Translates intricate medical nomenclature into simple, actionable, and gentle patient language.
2. Under no circumstances should you make self-diagnoses or authoritatively dictate prescriptions or drug changes. Be safe and helpful.
3. ALWAYS remind the patient that your answers are educational, advising them to collaborate directly with their doctor for actual diagnoses, prescription changes, and clinical treatment plans.
4. Support clean, beautiful markdown. Use bolding, lists, bullet points, and headers to maintain clean visual density and easy legibility.
5. If some values look highly critical, gently remind them to speak with a physician promptly.`;

      // Structure messages list into Gemini's expected Content objects
      const geminiContents = messages.map((m: any) => ({
        role: m.role === "model" ? "model" : m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      // Generate Chat completion
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
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
