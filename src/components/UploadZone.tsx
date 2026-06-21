import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Layers } from "lucide-react";
import { UploadedFileState, MedicalData } from "../types";

interface UploadZoneProps {
  onAnalysisStarted: () => void;
  onAnalysisSuccess: (medicalData: MedicalData, fileState: UploadedFileState) => void;
  onAnalysisFailure: (errorMessage: string) => void;
  isProcessing: boolean;
}

export default function UploadZone({
  onAnalysisStarted,
  onAnalysisSuccess,
  onAnalysisFailure,
  isProcessing,
}: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [currentFile, setCurrentFile] = useState<UploadedFileState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;

    // Check size limit (e.g., 12MB limit)
    const MAX_SIZE = 12 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      onAnalysisFailure(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please upload a file under 12MB.`);
      return;
    }

    onAnalysisStarted();
    setCurrentFile({
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
    });

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const rawResult = reader.result as string;
        const base64Data = rawResult.split(",")[1];

        // Trigger analysis call to Express API
        const payload = {
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          base64: base64Data,
        };

        const response = await fetch("/api/analyze-medical-file", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const resData = await response.json();

        if (!response.ok || !resData.success) {
          throw new Error(resData.error || "The analysis server failed to parse this clinical file.");
        }

        onAnalysisSuccess(resData.data, {
          name: file.name,
          size: file.size,
          type: file.type,
          base64: base64Data,
        });
      } catch (err: any) {
        console.error("File parsing component error:", err);
        onAnalysisFailure(err.message || "An unexpected error occurred during medical file analysis.");
      }
    };

    reader.onerror = () => {
      onAnalysisFailure("Unable to read the uploaded local file storage.");
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerInputClick = () => {
    inputRef.current?.click();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFormatLabel = (name: string) => {
    const ext = name.split(".").pop()?.toUpperCase() || "";
    return ext ? `${ext} Document` : "Medical File";
  };

  return (
    <div id="medical-upload-card" className="bg-white border border-stone-200 rounded-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100 mb-5">
        <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-md">
          <Layers size={18} className="stroke-[1.5]" />
        </div>
        <div>
          <h2 className="font-serif text-lg font-medium text-stone-950">Dossier File Parser</h2>
          <p className="text-xs text-stone-500 font-light mt-0.5">Secure clinical analysis of standard file types</p>
        </div>
      </div>

      <div
        id="drag-and-drop-container"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={isProcessing ? undefined : triggerInputClick}
        className={`w-full min-h-[190px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-all duration-300 relative ${
          isProcessing ? "bg-stone-50/70 border-stone-200 cursor-wait" : ""
        } ${
          dragActive 
            ? "border-emerald-500 bg-emerald-50/40 scale-[0.99]" 
            : "border-stone-200 hover:border-stone-400 bg-stone-50/30 hover:bg-white cursor-pointer"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          disabled={isProcessing}
          onChange={handleChange}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.txt,.json,.md"
        />

        {isProcessing ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-100 border-t-emerald-600"></div>
              <Upload className="absolute text-emerald-600 size-5 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-stone-900 animate-pulse">Analyzing Clinical Data...</p>
              <p className="text-xs text-stone-500 max-w-xs leading-normal font-light">
                Gemini is transcribing biomarkers, evaluating parameters, and organizing health vectors. Please hold.
              </p>
            </div>
          </div>
        ) : currentFile ? (
          <div className="flex flex-col items-center space-y-3.5">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-150">
              <CheckCircle2 size={24} className="stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-stone-900 max-w-[280px] truncate">{currentFile.name}</p>
              <span className="inline-block px-2.5 py-0.5 bg-stone-100 text-stone-600 rounded text-[10px] font-mono uppercase tracking-wide">
                {getFormatLabel(currentFile.name)} • {formatBytes(currentFile.size)}
              </span>
            </div>
            <p className="text-xs text-emerald-700/80 font-light">
              Click or drop replacement document to re-parse.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <div className="p-3.5 bg-white text-stone-500 rounded-full border border-stone-200/80 shadow-sm group-hover:scale-105 transition-all">
              <Upload size={22} className="stroke-[1.5] text-stone-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-stone-900">
                Drag &amp; drop clinical file here
              </p>
              <p className="text-xs text-stone-500 font-light">
                or click to browse your workstation
              </p>
            </div>
            <div className="pt-2 text-[10px] text-stone-400 font-mono tracking-widest uppercase">
              PDF, DOCX, XLSX, PNG, JPEG, CSV, TXT
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 bg-stone-50 rounded-lg p-3.5 border border-stone-150 text-[11px] text-stone-600 leading-relaxed font-light flex items-start gap-2.5">
        <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5 stroke-[1.8]" />
        <div>
          <span className="font-semibold text-stone-850">Medical Disclaimer:</span> All extracted factors must be strictly cross-referenced against your physician's native document. This system serves solely as a secondary interpretive laboratory tool.
        </div>
      </div>
    </div>
  );
}
