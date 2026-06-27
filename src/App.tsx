import React, { useState, useEffect } from "react";
import { Activity, ShieldAlert, BookOpen, Clock, HeartHandshake, Cpu, LogOut } from "lucide-react";
import UploadZone from "./components/UploadZone";
import DossierDisplay from "./components/DossierDisplay";
import ChatPanel from "./components/ChatPanel";
import LongitudinalPanel from "./components/LongitudinalPanel";
import { MedicalData, UploadedFileState, HistoricalRecord, ChatMessage } from "./types";
import RegulatoryConsentModal from "./components/RegulatoryConsentModal";
import PatientDatabaseConsole from "./components/PatientDatabaseConsole";
import SummaryReportModal from "./components/SummaryReportModal";
import { t } from "./translations";

export default function App() {
  const [medicalData, setMedicalData] = useState<MedicalData | null>(null);
  const [activeMedicalDataEn, setActiveMedicalDataEn] = useState<MedicalData | null>(null);
  const [activeMedicalDataVi, setActiveMedicalDataVi] = useState<MedicalData | null>(null);
  const [documentFile, setDocumentFile] = useState<UploadedFileState | null>(null);
  const [imageFile, setImageFile] = useState<UploadedFileState | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Active patient tracking state
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [isNewPatient, setIsNewPatient] = useState<boolean>(false);

  // Settings: Model selection
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.5-flash");

  // Expert curation and clinical skills folder guidance
  const [clinicalExpertise, setClinicalExpertise] = useState<string>(() => {
    try {
      return localStorage.getItem("aegis_clinical_expertise") || "";
    } catch {
      return "";
    }
  });

  const [curationGuidance, setCurationGuidance] = useState<string>(() => {
    try {
      return localStorage.getItem("aegis_curation_guidance") || "";
    } catch {
      return "";
    }
  });

  const [activeSkills, setActiveSkills] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("aegis_active_skills");
      return stored ? JSON.parse(stored) : ["patient_care.md"];
    } catch {
      return ["patient_care.md"];
    }
  });

  const [appLanguage, setAppLanguage] = useState<"en" | "vi" | string>(() => {
    try {
      return localStorage.getItem("aegis_app_language") || "en";
    } catch {
      return "en";
    }
  });

  const [medicalDataLanguage, setMedicalDataLanguage] = useState<string>(() => {
    try {
      return localStorage.getItem("aegis_app_language") || "en";
    } catch {
      return "en";
    }
  });
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  const handleLanguageChange = (lang: string) => {
    setAppLanguage(lang);
    try {
      localStorage.setItem("aegis_app_language", lang);
    } catch {}
  };

  useEffect(() => {
    if (medicalData && medicalDataLanguage !== appLanguage && !isTranslating) {
      if (appLanguage === "vi" && activeMedicalDataVi) {
        setMedicalData(activeMedicalDataVi);
        setMedicalDataLanguage("vi");
        return;
      }
      if (appLanguage === "en" && activeMedicalDataEn) {
        setMedicalData(activeMedicalDataEn);
        setMedicalDataLanguage("en");
        return;
      }

      const translateDossier = async () => {
        setIsTranslating(true);
        try {
          const response = await fetch("/api/translate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "medical-data",
              content: medicalData,
              targetLanguage: appLanguage,
            }),
          });
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.translated) {
              const translatedWithId = { ...result.translated, patientId: activePatientId || result.translated.patientId };
              setMedicalData(translatedWithId);
              setMedicalDataLanguage(appLanguage);
              if (appLanguage === "en") {
                setActiveMedicalDataEn(translatedWithId);
              } else {
                setActiveMedicalDataVi(translatedWithId);
              }
            }
          }
        } catch (err) {
          console.error("Failed to translate dossier:", err);
        } finally {
          setIsTranslating(false);
        }
      };
      translateDossier();
    }
  }, [appLanguage, medicalData, medicalDataLanguage, activeMedicalDataEn, activeMedicalDataVi, activePatientId, isTranslating]);

  const handleExpertiseChange = (roleId: string) => {
    setClinicalExpertise(roleId);
    try {
      localStorage.setItem("aegis_clinical_expertise", roleId);
    } catch {}

    const defaultMap: { [key: string]: string[] } = {
      PATIENT: ["patient_care.md"],
      MD_PRACTITIONER: ["differential_diagnostics.md", "pharmacology.md"],
      PHARMACIST: ["pharmacology.md", "differential_diagnostics.md"],
      PATHOLOGIST: ["laboratory_pathology.md", "cohort_statistics.md"],
    };
    const defaultFiles = defaultMap[roleId] || [];
    handleActiveSkillsChange(defaultFiles);
  };

  const handleGuidanceChange = (val: string) => {
    setCurationGuidance(val);
    try {
      localStorage.setItem("aegis_curation_guidance", val);
    } catch {}
  };

  const handleActiveSkillsChange = (skills: string[]) => {
    setActiveSkills(skills);
    try {
      localStorage.setItem("aegis_active_skills", JSON.stringify(skills));
    } catch {}
  };

  // Modal state for clinical standards consent (GDPR/HIPAA/California CCPA)
  const [isConsentModalOpen, setIsConsentModalOpen] = useState<boolean>(false);

  // Settings: Longitudinal consent and records
  const [consentGranted, setConsentGranted] = useState<boolean>(() => {
    try {
      const savedConsent = localStorage.getItem("aegis_longitudinal_consent");
      const savedRegulation = localStorage.getItem("aegis_data_privacy_consent_accepted") === "true";
      return savedConsent === "true" && savedRegulation;
    } catch {
      return false;
    }
  });

  const [historyRecords, setHistoryRecords] = useState<HistoricalRecord[]>(() => {
    try {
      const saved = localStorage.getItem("aegis_longitudinal_records");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Summary Report & Session Logout states
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [sessionKey, setSessionKey] = useState<number>(0);

  const handleConfirmLogout = async (saveBeforeLogout = false) => {
    if (saveBeforeLogout && medicalData && activePatientId) {
      let chatHistory: ChatMessage[] | undefined = undefined;
      try {
        const savedChat = localStorage.getItem("aegis_current_chat");
        if (savedChat) {
          chatHistory = JSON.parse(savedChat).filter((m: ChatMessage) => m.id !== "welcome");
        }
      } catch (e) {
        console.error("Error reading chat history on logout:", e);
      }

      const newRecord: HistoricalRecord = {
        id: `rec-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        fileName: documentFile ? documentFile.name : undefined,
        imageName: imageFile ? imageFile.name : undefined,
        medicalData: medicalData,
        medicalDataEn: activeMedicalDataEn || (appLanguage === "en" ? medicalData : undefined),
        medicalDataVi: activeMedicalDataVi || (appLanguage === "vi" ? medicalData : undefined),
        chatHistory: chatHistory,
      };

      // Save to server-side persistent database
      await saveRecordToDatabase(activePatientId, newRecord);
    }

    setMedicalData(null);
    setDocumentFile(null);
    setImageFile(null);
    setAnalysisError(null);
    setActivePatientId(null);
    setIsNewPatient(false);
    try {
      localStorage.removeItem("aegis_current_chat");
      localStorage.removeItem("aegis_longitudinal_records");
    } catch (e) {
      console.error(e);
    }
    setHistoryRecords([]);
    setSessionKey((prev) => prev + 1);
    setIsSummaryModalOpen(false);
  };

  const saveRecordToDatabase = async (patientId: string, record: HistoricalRecord) => {
    try {
      await fetch(`/api/patient/${patientId}/record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record })
      });
    } catch (e) {
      console.error("Failed to persist newly analyzed dossier to backend database:", e);
    }
  };

  const handleLoadRecords = (patientId: string, records: HistoricalRecord[]) => {
    setActivePatientId(patientId);
    setHistoryRecords(records);
    setIsNewPatient(records.length === 0);
    setAnalysisError(null);
    setSessionKey((prev) => prev + 1);
    try {
      localStorage.setItem("aegis_longitudinal_records", JSON.stringify(records));
      localStorage.removeItem("aegis_current_chat");
    } catch {}

    // Hydrate workspace with the latest report if history is available
    if (records.length > 0) {
      const latest = records[records.length - 1];
      const data = appLanguage === "vi" 
        ? (latest.medicalDataVi || latest.medicalData) 
        : (latest.medicalDataEn || latest.medicalData);
      setMedicalData(data);
      setMedicalDataLanguage(appLanguage);
      setActiveMedicalDataEn(latest.medicalDataEn || (appLanguage === "en" ? latest.medicalData : null));
      setActiveMedicalDataVi(latest.medicalDataVi || (appLanguage === "vi" ? latest.medicalData : null));
      setDocumentFile(latest.fileName ? { name: latest.fileName, size: 0, type: "application/pdf", base64: "" } : null);
      setImageFile(latest.imageName ? { name: latest.imageName, size: 0, type: "image/png", base64: "" } : null);
    } else {
      setMedicalData(null);
      setActiveMedicalDataEn(null);
      setActiveMedicalDataVi(null);
      setDocumentFile(null);
      setImageFile(null);
    }
  };

  const handleAnalysisStarted = () => {
    setIsProcessing(true);
    setAnalysisError(null);
  };

  const handleAnalysisSuccess = async (
    data: MedicalData,
    doc: UploadedFileState | null,
    img: UploadedFileState | null,
    reportDate: string
  ) => {
    // Save to browser logging list and persistent database if active patient ID is set or retrieved!
    const targetPatientId = activePatientId || data.patientId || "patient-unassigned";
    
    const enrichedData = {
      ...data,
      patientId: targetPatientId
    };

    setMedicalData(enrichedData);
    setMedicalDataLanguage(appLanguage);
    if (appLanguage === "en") {
      setActiveMedicalDataEn(enrichedData);
      setActiveMedicalDataVi(null);
    } else {
      setActiveMedicalDataVi(enrichedData);
      setActiveMedicalDataEn(null);
    }
    setDocumentFile(doc);
    setImageFile(img);
    setIsProcessing(false);

    // Save to browser logging list if granted
    if (consentGranted) {
      const recordId = `rec-${Date.now()}`;
      const newRecord: HistoricalRecord = {
        id: recordId,
        date: reportDate,
        fileName: doc ? doc.name : undefined,
        imageName: img ? img.name : undefined,
        medicalData: enrichedData,
      };

      setHistoryRecords((prev) => {
        const updated = [...prev, newRecord];
        localStorage.setItem("aegis_longitudinal_records", JSON.stringify(updated));
        return updated;
      });

      // Persist initial record to backend database
      saveRecordToDatabase(targetPatientId, newRecord);
      
      // Auto-set the active patient ID if not set
      if (!activePatientId) {
        setActivePatientId(targetPatientId);
      }

      // Automatically translate in background to make sure we persist both languages
      try {
        const targetLang = appLanguage === "en" ? "vi" : "en";
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "medical-data",
            content: enrichedData,
            targetLanguage: targetLang
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.translated) {
            const translatedWithId = { ...result.translated, patientId: targetPatientId };
            const medEn = appLanguage === "en" ? enrichedData : translatedWithId;
            const medVi = appLanguage === "vi" ? enrichedData : translatedWithId;

            if (appLanguage === "en") {
              setActiveMedicalDataVi(translatedWithId);
            } else {
              setActiveMedicalDataEn(translatedWithId);
            }

            const updatedRecord: HistoricalRecord = {
              ...newRecord,
              medicalDataEn: medEn,
              medicalDataVi: medVi
            };

            setHistoryRecords((prev) => {
              const updated = prev.map((r) => r.id === recordId ? updatedRecord : r);
              localStorage.setItem("aegis_longitudinal_records", JSON.stringify(updated));
              return updated;
            });

            saveRecordToDatabase(targetPatientId, updatedRecord);
          }
        }
      } catch (err) {
        console.error("Auto background translation failed:", err);
      }
    }
  };

  const handleAnalysisFailure = (errorMsg: string) => {
    setAnalysisError(errorMsg);
    setIsProcessing(false);
  };

  const handleRemoveRecord = (id: string) => {
    setHistoryRecords((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      localStorage.setItem("aegis_longitudinal_records", JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleConsent = (val: boolean) => {
    if (val) {
      const accepted = localStorage.getItem("aegis_data_privacy_consent_accepted") === "true";
      if (!accepted) {
        setIsConsentModalOpen(true);
        return;
      }
    }
    setConsentGranted(val);
    localStorage.setItem("aegis_longitudinal_consent", String(val));
  };

  const handleAcceptRegulations = () => {
    localStorage.setItem("aegis_data_privacy_consent_accepted", "true");
    setConsentGranted(true);
    localStorage.setItem("aegis_longitudinal_consent", "true");
    setIsConsentModalOpen(false);
  };

  const handleDeclineRegulations = () => {
    localStorage.setItem("aegis_data_privacy_consent_accepted", "false");
    setConsentGranted(false);
    localStorage.setItem("aegis_longitudinal_consent", "false");
    setIsConsentModalOpen(false);
  };

  const handleReset = () => {
    setMedicalData(null);
    setDocumentFile(null);
    setImageFile(null);
    setAnalysisError(null);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col justify-between selection:bg-stone-200">
      
      {/* 1. Header ribbon & brand */}
      <header className="border-b border-stone-200/85 bg-white relative z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-900 text-white rounded-lg flex items-center justify-center shadow-inner">
              <Activity size={18} className="stroke-[1.8] text-emerald-400" />
            </div>
            <div>
              <span className="font-serif text-base font-bold text-stone-950 tracking-tight">
                Aegis<span className="text-emerald-700 italic font-medium font-sans ml-0.5">Clinical</span>
              </span>
              <span className="hidden sm:inline-block ml-3 px-2 py-0.5 bg-stone-100 text-stone-500 rounded text-[9px] font-mono tracking-widest uppercase">
                v2.0 Multimodal Joint Schema
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-stone-500">
            {/* Language Selector */}
            <div className="flex items-center gap-1.5 border-r border-stone-200 pr-3 h-6">
              <span className="text-[10px] uppercase text-stone-400 font-bold hidden sm:inline-block">Language:</span>
              <select
                id="language-select"
                value={appLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent border-0 text-stone-700 font-semibold cursor-pointer focus:ring-0 text-xs py-0 px-1"
              >
                <option value="en">English 🇬🇧</option>
                <option value="vi">Tiếng Việt 🇻🇳</option>
              </select>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{appLanguage === "vi" ? "Nút Chính Gemini Đa Nguồn Đang Hoạt Động" : "Multi-Source Gemini Core Node Active"}</span>
            </div>

            <button
              id="logout-btn"
              onClick={() => setIsSummaryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 font-semibold cursor-pointer transition-all shadow-sm"
              title={appLanguage === "vi" ? "Kết thúc phiên & lưu trữ" : "Logout & End Session"}
            >
              <LogOut size={13} />
              <span>{appLanguage === "vi" ? "Kết Thúc Phiên" : "End Session"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main content area layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 z-10">
        
        {/* Branding header block */}
        <div id="welcome-header" className="space-y-4 border-b border-stone-200/50 pb-6">
          <div className="space-y-1">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-stone-950">
              Aegis {appLanguage === "vi" ? "Hồ Sơ Trí Tuệ" : "Intelligence Dossier"} <span className="text-stone-500 italic font-normal">Clinical</span>
            </h1>
            <p className="text-stone-500 text-sm max-w-3xl leading-relaxed font-light">
              {appLanguage === "vi" 
                ? "Hệ thống trí tuệ lâm sàng và phân tích chẩn đoán đa phương thức tiên tiến. Trích xuất và tích hợp an toàn các tệp báo cáo, hình ảnh chẩn đoán (X-Quang, CT, MRI) và tiền sử bệnh án thành các thông tin chi tiết đồng bộ."
                : "An advanced physical/radiological & clinical text metadata intelligence system. Securely transcribe and aggregate diagnostic sheets, imaging scans (X-Rays, CTs, MRIs), and medical histories into unified, context-synced insights."}
            </p>
          </div>

          {/* Model selection & consent guidelines */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.015)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Foundation model select */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs font-mono font-semibold text-stone-600 flex items-center gap-1.5 shrink-0">
                <Cpu size={14} className="text-emerald-600" />
                {appLanguage === "vi" ? "Mô Hình Đang Chọn:" : "Selected Model:"}
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", desc: "Balanced speed & accuracy" },
                  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", desc: "Highly stable production model" },
                  { id: "gemini-flash-latest", name: "Gemini Flash Latest", desc: "Standard latest flash model" },
                  { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", desc: "Expert clinical reasoning capability" },
                  { id: "gemini-3.1-flash-lite", name: "Gemini 1.5 Lite", desc: "Ultra-fast summaries" }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-all cursor-pointer text-left ${
                      selectedModel === m.id
                        ? "bg-stone-900 border-stone-900 text-stone-50 font-medium shadow-sm"
                        : "bg-stone-50/50 border-stone-200 text-stone-600 hover:border-stone-400"
                    }`}
                    title={m.desc}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Longitudinal archival toggle */}
            <div className="flex items-center gap-2.5 border-t md:border-t-0 pt-3 md:pt-0 border-stone-100 shrink-0">
              <input
                id="grant-archive-consent"
                type="checkbox"
                checked={consentGranted}
                onChange={(e) => handleToggleConsent(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-600 border-stone-300 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="grant-archive-consent" className="text-xs text-stone-700 cursor-pointer select-none">
                <span className="font-semibold text-stone-905 block">
                  {appLanguage === "vi" ? "Bật Theo Dõi Lịch Sử Bệnh Án" : "Enable Longitudinal Data Bank"}
                </span>
                <span className="block text-[10px] text-stone-400 font-light">
                  {appLanguage === "vi" ? "Lưu trữ tự động các kết quả phân tích vào dòng thời gian của bệnh nhân" : "Saves analyzed dossiers locally inside the browser timeline"}
                </span>
              </label>
            </div>

          </div>
        </div>

        {/* Patient Archive & Verification Console */}
        <PatientDatabaseConsole
          currentExpertise={clinicalExpertise}
          onExpertiseChange={handleExpertiseChange}
          onLoadRecords={handleLoadRecords}
          activePatientId={activePatientId}
          setActivePatientId={setActivePatientId}
          historyRecords={historyRecords}
          consentGranted={consentGranted}
          onToggleConsent={handleToggleConsent}
          language={appLanguage}
        />

        {/* Core Layout Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Block: Combined File Entry & Structured Output (7/12 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            <UploadZone
              sessionKey={sessionKey}
              onAnalysisStarted={handleAnalysisStarted}
              onAnalysisSuccess={handleAnalysisSuccess}
              onAnalysisFailure={handleAnalysisFailure}
              isProcessing={isProcessing}
              selectedModel={selectedModel}
              expertise={clinicalExpertise}
              manualCurationGuidance={curationGuidance}
              activeSkills={activeSkills}
              language={appLanguage}
            />

            {analysisError && (
              <div id="analysis-failed-notif" className="p-4.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1.5 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-xs uppercase tracking-wider font-mono text-rose-850">
                      Analysis Protocol Halt
                    </h5>
                    <p className="text-xs text-rose-750 font-light mt-0.5 leading-normal">
                      {analysisError}
                    </p>
                    <button 
                      onClick={handleReset} 
                      className="mt-2 text-xs font-semibold text-rose-850 hover:underline flex items-center gap-1 font-mono"
                    >
                      Reset Workspace
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Structured Medical Record output */}
            {isTranslating && (
              <div className="p-6 bg-emerald-50/50 border border-emerald-150 rounded-xl text-stone-900 flex items-center justify-center gap-3 animate-pulse mb-6 shadow-sm">
                <div className="animate-spin h-4 w-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full" />
                <span className="text-xs font-mono font-medium text-emerald-800">
                  {appLanguage === "vi" ? "Đang dịch toàn bộ hồ sơ y tế sang Tiếng Việt..." : "Translating entire clinical dossier to English..."}
                </span>
              </div>
            )}

            <DossierDisplay 
              medicalData={medicalData} 
              documentFile={documentFile} 
              imageFile={imageFile}
              clinicalExpertise={clinicalExpertise}
              language={appLanguage}
            />

          </div>

          {/* Right Block: AI Chatbot Workspace (5/12 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            
            <ChatPanel 
              sessionKey={sessionKey}
              medicalData={medicalData} 
              selectedModel={selectedModel}
              expertise={clinicalExpertise}
              manualCurationGuidance={curationGuidance}
              activeSkills={activeSkills}
              language={appLanguage}
            />

            {/* Quick Informational Tips Card */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.01)] space-y-4">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold flex items-center gap-1.5">
                <BookOpen size={12} /> {appLanguage === "vi" ? "Giao thức Toàn vẹn Không gian làm việc" : "Workspace Integrity Protocol"}
              </h4>
              <div className="grid grid-cols-1 gap-3.5 text-xs">
                
                <div className="flex gap-2.5 items-start">
                  <Clock size={15} className="text-stone-500 shrink-0 mt-0.5" />
                  <p className="text-stone-600 leading-normal font-light">
                    <span className="font-medium text-stone-850 block">
                      {appLanguage === "vi" ? "Đồng bộ Đa Phương Thức Liên Kết" : "Conjoint Multi-Modal Synced"}
                    </span>
                    {appLanguage === "vi" 
                      ? "Tất cả các chatbot vẫn được liên kết đầy đủ với ma trận kết quả có cấu trúc VÀ bất kỳ quan sát trực quan nào được trích xuất từ các bản quét của bạn."
                      : "All chatbots remain fully linked to the structured findings matrix AND any visual observations extracted from your scans."}
                  </p>
                </div>

                <div className="flex gap-2.5 items-start">
                  <HeartHandshake size={15} className="text-stone-500 shrink-0 mt-0.5" />
                  <p className="text-stone-600 leading-normal font-light">
                    <span className="font-medium text-stone-850 block">
                      {appLanguage === "vi" ? "Thực thi Ưu tiên Quyền riêng tư" : "Privacy-First Execution"}
                    </span>
                    {appLanguage === "vi"
                      ? "Các tệp được đánh giá động phía máy chủ thông qua các đường truyền bảo mật tiên tiến và không bao giờ bị lưu vào bộ nhớ đệm lâu dài."
                      : "Files are evaluated dynamically server-side via state-of-the-art secure tunnels and never cached."}
                  </p>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* 3. Longitudinal Trends Dashboard section at the bottom */}
        <div className="pt-4">
          <LongitudinalPanel 
            records={historyRecords}
            onRemoveRecord={handleRemoveRecord}
            selectedModel={selectedModel}
            expertise={clinicalExpertise}
            isNewPatient={isNewPatient}
            activePatientId={activePatientId}
            language={appLanguage}
          />
        </div>

      </main>

      {/* Regulatory custom privacy and clinical standards consent modal */}
      <RegulatoryConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
        onAccept={handleAcceptRegulations}
        onDecline={handleDeclineRegulations}
        language={appLanguage}
      />

      {/* Summary Report & Logout session modal */}
      <SummaryReportModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        onConfirmLogout={handleConfirmLogout}
        medicalData={medicalData}
        activePatientId={activePatientId}
        clinicalExpertise={clinicalExpertise}
        isNewPatient={isNewPatient}
        language={appLanguage}
      />

      {/* 3. Bottom Footer */}
      <footer className="bg-stone-900 text-stone-400 py-10 mt-12 border-t border-stone-950 z-10 font-mono text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-stone-800 pb-6">
            <span>AEGIS PARSER SYSTEM v2.0.0</span>
            <div className="flex items-center gap-1.5">
              <span>ATMOSPHERE &amp; DATA ENGINE:</span>
              <span className="text-emerald-400 font-semibold bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-900 text-[10px]">MULTIMODAL ACTIVE</span>
            </div>
          </div>
          <p className="text-[10px] text-stone-500 leading-relaxed font-light text-center sm:text-left">
            {appLanguage === "vi"
              ? "Tuyên bố miễn trừ trách nhiệm: Aegis Clinical và công nghệ trợ lý AI của nó là các công cụ để phân tích cú pháp siêu dữ liệu và dịch từ vựng lâm sàng. Chúng không cấu thành lời khuyên y tế lâm sàng chính thức, mệnh lệnh kê đơn hoặc phán quyết chẩn đoán. Luôn luôn tham khảo ý kiến trực tiếp với bác sĩ chuyên khoa hoặc trợ lý bác sĩ được chứng nhận để phân tích các báo cáo của bạn."
              : "Disclaimer: Aegis Clinical and its AI-assistant technology are tools for parsing metadata and translating clinical vocabulary. They do not constitute official clinical medical advice, prescriptive commands, or diagnostic verdicts. Always consult directly with a certified healthcare physician or physician's assistant to analyze your reports."}
          </p>
        </div>
      </footer>

    </div>
  );
}
