import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Layers, Image as ImageIcon, History, Sparkles, X, Calendar } from "lucide-react";
import { UploadedFileState, MedicalData } from "../types";

interface UploadZoneProps {
  onAnalysisStarted: () => void;
  onAnalysisSuccess: (
    medicalData: MedicalData,
    documentFile: UploadedFileState | null,
    imageFile: UploadedFileState | null,
    reportDate: string
  ) => void;
  onAnalysisFailure: (errorMessage: string) => void;
  isProcessing: boolean;
  selectedModel: string;
  expertise: string;
  manualCurationGuidance: string;
}

export default function UploadZone({
  onAnalysisStarted,
  onAnalysisSuccess,
  onAnalysisFailure,
  isProcessing,
  selectedModel,
  expertise,
  manualCurationGuidance,
}: UploadZoneProps) {
  // Independent uploading state for Document Column & Image Column
  const [docFile, setDocFile] = useState<UploadedFileState | null>(null);
  const [imageFile, setImageFile] = useState<UploadedFileState | null>(null);
  const [medicalHistory, setMedicalHistory] = useState("");
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const [docDragActive, setDocDragActive] = useState(false);
  const [imageDragActive, setImageDragActive] = useState(false);

  const docInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const MAX_SIZE = 12 * 1024 * 1024; // 12MB Limit

  // Handle Drag Events for Document Column
  const handleDocDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDocDragActive(true);
    } else if (e.type === "dragleave") {
      setDocDragActive(false);
    }
  };

  // Handle Drag Events for Image Column
  const handleImageDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setImageDragActive(true);
    } else if (e.type === "dragleave") {
      setImageDragActive(false);
    }
  };

  const handleDocDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDocDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processDocument(e.dataTransfer.files[0]);
    }
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImage(e.dataTransfer.files[0]);
    }
  };

  const processDocument = (file: File) => {
    if (file.size > MAX_SIZE) {
      alert(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Limit is 12MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(",")[1];
      setDocFile({
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        base64: base64Data,
      });
    };
    reader.readAsDataURL(file);
  };

  const processImage = (file: File) => {
    // Validate image format
    if (!file.type.startsWith("image/")) {
      alert("Invalid format. Please upload an image file (PNG, JPEG, WEBP) for the clinical image analysis column.");
      return;
    }
    if (file.size > MAX_SIZE) {
      alert(`Image file is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Limit is 12MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(",")[1];
      setImageFile({
        name: file.name,
        size: file.size,
        type: file.type,
        base64: base64Data,
      });
    };
    reader.readAsDataURL(file);
  };

  // Submit joint dossier payload to the backend
  const triggerCombinedDossierAnalysis = async () => {
    if (!docFile && !imageFile) return;

    onAnalysisStarted();

    try {
      const payload = {
        model: selectedModel,
        expertise: expertise,
        manualCurationGuidance: manualCurationGuidance,
        documentFile: docFile
          ? {
              fileName: docFile.name,
              fileType: docFile.type,
              base64: docFile.base64,
            }
          : null,
        imageFile: imageFile
          ? {
              fileName: imageFile.name,
              fileType: imageFile.type,
              base64: imageFile.base64,
            }
          : null,
        medicalHistory: medicalHistory.trim() || undefined,
        reportDate: reportDate,
      };

      const response = await fetch("/api/analyze-medical-dossier", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "The integrated clinical analysis server dropped response.");
      }

      onAnalysisSuccess(resData.data, docFile, imageFile, reportDate);
    } catch (err: any) {
      console.error("Dossier compilation failure:", err);
      onAnalysisFailure(err.message || "An unexpected error occurred while parsing the combined medical dossier.");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div id="integrated-dossier-compiler" className="bg-white border border-stone-200 rounded-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6">
      
      {/* Header ribbon */}
      <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
        <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-md">
          <Layers size={18} className="stroke-[1.5]" />
        </div>
        <div>
          <h2 className="font-serif text-lg font-medium text-stone-950">Integrated Dossier Entry</h2>
          <p className="text-xs text-stone-500 font-light mt-0.5">Combine paper reports, clinical radiology scans, and patient history</p>
        </div>
      </div>

      {/* Dual Column Upload Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Column Left: Clinical Documents */}
        <div className="flex flex-col space-y-2">
          <label className="text-xs font-mono font-semibold text-stone-600 flex items-center gap-1.5">
            <FileText size={14} className="text-emerald-600" />
            1. Clinical Documents &amp; Lab Reports
          </label>
          
          <div
            id="document-upload-zone"
            onDragEnter={handleDocDrag}
            onDragOver={handleDocDrag}
            onDragLeave={handleDocDrag}
            onDrop={handleDocDrop}
            onClick={() => !isProcessing && docInputRef.current?.click()}
            className={`flex-1 min-h-[160px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-5 text-center transition-all duration-300 relative cursor-pointer ${
              docDragActive 
                ? "border-emerald-500 bg-emerald-50/40 scale-[0.99]" 
                : "border-stone-200 hover:border-stone-400 bg-stone-50/30 hover:bg-white"
            } ${isProcessing ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <input
              ref={docInputRef}
              type="file"
              className="hidden"
              disabled={isProcessing}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.json,.md"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processDocument(e.target.files[0]);
                }
              }}
            />

            {docFile ? (
              <div className="space-y-2.5 w-full px-2" onClick={(e) => e.stopPropagation()}>
                <div className="p-2.5 bg-emerald-50 border border-emerald-150 rounded-lg flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 max-w-[80%]">
                    <FileText size={18} className="text-emerald-700 shrink-0" />
                    <div className="text-left">
                      <p className="text-xs font-medium text-stone-900 truncate max-w-[150px] md:max-w-[170px]" title={docFile.name}>
                        {docFile.name}
                      </p>
                      <p className="text-[10px] text-stone-500 font-mono">
                        {formatBytes(docFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDocFile(null)}
                    disabled={isProcessing}
                    className="p-1 hover:bg-stone-200/50 rounded text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="text-[10px] text-stone-400 font-light italic">Click card or drop replacement report</p>
              </div>
            ) : (
              <div className="space-y-2 flex flex-col items-center">
                <div className="p-2 bg-stone-100 rounded-full border border-stone-200 text-stone-500">
                  <Upload size={16} />
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-900">Drag PDF, Word, or Sheets</p>
                  <p className="text-[11px] text-stone-400 font-light mt-0.5">or click to browse local files</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Column Right: Clinical Imagery (Xray/CT/MRI/H&E Pathology) */}
        <div className="flex flex-col space-y-2">
          <label className="text-xs font-mono font-semibold text-stone-600 flex items-center gap-1.5">
            <ImageIcon size={14} className="text-emerald-600" />
            2. Diagnostic Imaging (X-Ray, CT, MRI, Tissue)
          </label>
          
          <div
            id="image-upload-zone"
            onDragEnter={handleImageDrag}
            onDragOver={handleImageDrag}
            onDragLeave={handleImageDrag}
            onDrop={handleImageDrop}
            onClick={() => !isProcessing && imageInputRef.current?.click()}
            className={`flex-1 min-h-[160px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-5 text-center transition-all duration-300 relative cursor-pointer ${
              imageDragActive 
                ? "border-emerald-500 bg-emerald-50/40 scale-[0.99]" 
                : "border-stone-200 hover:border-stone-400 bg-stone-50/30 hover:bg-white"
            } ${isProcessing ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <input
              ref={imageInputRef}
              type="file"
              className="hidden"
              disabled={isProcessing}
              accept="image/png,image/jpeg,image/webp,image/jpg"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processImage(e.target.files[0]);
                }
              }}
            />

            {imageFile ? (
              <div className="space-y-2.5 w-full px-2" onClick={(e) => e.stopPropagation()}>
                <div className="p-2.5 bg-emerald-50 border border-emerald-150 rounded-lg flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 max-w-[80%]">
                    <ImageIcon size={18} className="text-emerald-700 shrink-0" />
                    <div className="text-left">
                      <p className="text-xs font-medium text-stone-900 truncate max-w-[150px] md:max-w-[170px]" title={imageFile.name}>
                        {imageFile.name}
                      </p>
                      <p className="text-[10px] text-stone-500 font-mono">
                        {formatBytes(imageFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setImageFile(null)}
                    disabled={isProcessing}
                    className="p-1 hover:bg-stone-200/50 rounded text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="text-[10px] text-stone-400 font-light italic">Click card or drop replacement imaging visual</p>
              </div>
            ) : (
              <div className="space-y-2 flex flex-col items-center">
                <div className="p-2 bg-stone-100 rounded-full border border-stone-200 text-stone-500">
                  <ImageIcon size={16} />
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-900">Drag X-Ray, CT, or Biopsy Scan</p>
                  <p className="text-[11px] text-stone-400 font-light mt-0.5">or click to browse local visuals</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Report Date Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-1">
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-semibold text-stone-600 flex items-center gap-1.5">
            <Calendar size={14} className="text-emerald-600" />
            3. Report / Sample Collection Date
          </label>
          <input
            type="date"
            value={reportDate}
            disabled={isProcessing}
            onChange={(e) => setReportDate(e.target.value)}
            className="w-full text-xs font-mono font-light p-2.5 border border-stone-200 rounded-xl bg-stone-50 text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-all cursor-pointer"
          />
        </div>
        <div className="text-[10px] text-stone-400 flex items-center pt-5 font-light leading-normal">
          Assigning a backdate allows compiling a chronologically sorted longitudinal tracking timeline across different days.
        </div>
      </div>

      {/* Patient Background Option fields */}
      <div className="space-y-1.5">
        <label className="text-xs font-mono font-semibold text-stone-600 flex items-center gap-1.5">
          <History size={14} className="text-emerald-600" />
          4. Patient Health History (Optional Context)
        </label>
        <textarea
          value={medicalHistory}
          disabled={isProcessing}
          onChange={(e) => setMedicalHistory(e.target.value)}
          placeholder="Enter historical context like: Hypertension, penicillin allergies, family histories, past surgeries, or active chronic complaints..."
          className="w-full text-xs font-light p-3 border border-stone-200 rounded-xl bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-all min-h-[64px]"
        />
      </div>

      {/* Trigger CTA action area */}
      <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-[10.5px] text-stone-400 leading-normal font-light">
          Upload either report document, visual diagnosis scan, or list patient histories to initiate combined multivariable AI clinical interpretation.
        </div>
        
        <button
          onClick={triggerCombinedDossierAnalysis}
          disabled={(!docFile && !imageFile) || isProcessing}
          className={`px-5 py-3 rounded-xl shadow-sm text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
            (!docFile && !imageFile) || isProcessing
              ? "bg-stone-100 text-stone-400 cursor-not-allowed"
              : "bg-stone-950 text-white hover:bg-emerald-700 active:scale-[0.982]"
          }`}
        >
          {isProcessing ? (
            <React.Fragment>
              <div className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full" />
              <span>Transcribing Clinical Dossier...</span>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Sparkles size={14} className="fill-stone-100/10 text-white" />
              <span>Analyze Integrated Medical Dossier</span>
            </React.Fragment>
          )}
        </button>
      </div>

      {/* Warning ribbon */}
      <div className="bg-stone-50 rounded-lg p-3.5 border border-stone-150 text-[11px] text-stone-600 leading-relaxed font-light flex items-start gap-2.5">
        <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5 stroke-[1.8]" />
        <div>
          <span className="font-semibold text-stone-850">Medical Disclaimer:</span> All factors, transcription outcomes, and medical visual scans must be strictly cross-verified against your primary physician's native files.
        </div>
      </div>

    </div>
  );
}
