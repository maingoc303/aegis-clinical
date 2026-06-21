import React, { useState } from "react";
import { Activity, ShieldAlert, BookOpen, Clock, HeartHandshake } from "lucide-react";
import UploadZone from "./components/UploadZone";
import DossierDisplay from "./components/DossierDisplay";
import ChatPanel from "./components/ChatPanel";
import { MedicalData, UploadedFileState } from "./types";

export default function App() {
  const [medicalData, setMedicalData] = useState<MedicalData | null>(null);
  const [documentFile, setDocumentFile] = useState<UploadedFileState | null>(null);
  const [imageFile, setImageFile] = useState<UploadedFileState | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleAnalysisStarted = () => {
    setIsProcessing(true);
    setAnalysisError(null);
  };

  const handleAnalysisSuccess = (
    data: MedicalData,
    doc: UploadedFileState | null,
    img: UploadedFileState | null
  ) => {
    setMedicalData(data);
    setDocumentFile(doc);
    setImageFile(img);
    setIsProcessing(false);
  };

  const handleAnalysisFailure = (errorMsg: string) => {
    setAnalysisError(errorMsg);
    setIsProcessing(false);
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
            <div className="hidden md:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Multi-Source Gemini Core Node Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main content area layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 z-10">
        
        {/* Branding header block */}
        <div id="welcome-header" className="space-y-2 border-b border-stone-200/50 pb-6">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-stone-950">
            Aegis Intelligence <span className="text-stone-500 italic font-normal">Dossier</span>
          </h1>
          <p className="text-stone-500 text-sm max-w-3xl leading-relaxed font-light">
            An advanced physical/radiological &amp; clinical text metadata intelligence system. Securely transcribe and aggregate diagnostic sheets, imaging scans (X-Rays, CTs, MRIs), and medical histories into unified, context-synced insights.
          </p>
        </div>

        {/* Core Layout Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Block: Combined File Entry & Structured Output (7/12 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            <UploadZone
              onAnalysisStarted={handleAnalysisStarted}
              onAnalysisSuccess={handleAnalysisSuccess}
              onAnalysisFailure={handleAnalysisFailure}
              isProcessing={isProcessing}
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
            <DossierDisplay 
              medicalData={medicalData} 
              documentFile={documentFile} 
              imageFile={imageFile}
            />

          </div>

          {/* Right Block: AI Chatbot Workspace (5/12 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            
            <ChatPanel medicalData={medicalData} />

            {/* Quick Informational Tips Card */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.01)] space-y-4">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold flex items-center gap-1.5">
                <BookOpen size={12} /> Workspace Integrity Protocol
              </h4>
              <div className="grid grid-cols-1 gap-3.5 text-xs">
                
                <div className="flex gap-2.5 items-start">
                  <Clock size={15} className="text-stone-500 shrink-0 mt-0.5" />
                  <p className="text-stone-600 leading-normal font-light">
                    <span className="font-medium text-stone-850 block">Conjoint Multi-Modal Synced</span>
                    All chatbots remain fully linked to the structured findings matrix AND any visual observations extracted from your scans.
                  </p>
                </div>

                <div className="flex gap-2.5 items-start">
                  <HeartHandshake size={15} className="text-stone-500 shrink-0 mt-0.5" />
                  <p className="text-stone-600 leading-normal font-light">
                    <span className="font-medium text-stone-850 block">Privacy-First Execution</span>
                    Files are evaluated dynamically server-side via state-of-the-art secure tunnels and never cached.
                  </p>
                </div>

              </div>
            </div>

          </div>

        </div>

      </main>

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
            Disclaimer: Aegis Clinical and its AI-assistant technology are tools for parsing metadata and translating clinical vocabulary. They do not constitute official clinical medical advice, prescriptive commands, or diagnostic verdicts. Always consult directly with a certified healthcare physician or physician's assistant to analyze your reports.
          </p>
        </div>
      </footer>

    </div>
  );
}
