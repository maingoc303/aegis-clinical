import React, { useState } from "react";
import { 
  FileText, Calendar, User, ShieldAlert, CheckCircle2, ChevronRight, Activity, 
  Filter, AlertTriangle, Pill, ClipboardList, Info, Hospital
} from "lucide-react";
import { MedicalData, UploadedFileState } from "../types";

interface DossierDisplayProps {
  medicalData: MedicalData | null;
  fileState: UploadedFileState | null;
}

type FilterType = "ALL" | "ABNORMAL" | "CRITICAL";

export default function DossierDisplay({ medicalData, fileState }: DossierDisplayProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");

  if (!medicalData) {
    return (
      <div id="empty-dossier-state" className="bg-stone-50 border border-dashed border-stone-200 rounded-xl p-10 text-center flex flex-col items-center justify-center min-h-[450px]">
        <div className="p-4 bg-white border border-stone-200 rounded-full text-stone-400 shadow-sm mb-4">
          <FileText size={32} className="stroke-[1.2]" />
        </div>
        <h3 className="font-serif text-lg font-medium text-stone-950">Patient Clinical dossier</h3>
        <p className="text-sm text-stone-500 font-light max-w-sm mt-1 mb-5">
          Drop any medical report, blood panel index, scanning summary, or clinical note to parse structured records instantly.
        </p>
        <div className="flex flex-wrap justify-center gap-2 max-w-md">
          <span className="px-2.5 py-1 bg-white text-stone-500 text-[10px] font-mono rounded-full border border-stone-150">PDF Analysis</span>
          <span className="px-2.5 py-1 bg-white text-stone-500 text-[10px] font-mono rounded-full border border-stone-150">Word Text Parser</span>
          <span className="px-2.5 py-1 bg-white text-stone-500 text-[10px] font-mono rounded-full border border-stone-150">Excel Worksheets</span>
          <span className="px-2.5 py-1 bg-white text-stone-500 text-[10px] font-mono rounded-full border border-stone-150">Scanned Images</span>
        </div>
      </div>
    );
  }

  // Filter clinical findings based on toggles
  const filteredFindings = medicalData.findings.filter((f) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "ABNORMAL") {
      const s = f.status?.toUpperCase() || "";
      return s === "HIGH" || s === "LOW" || s === "ABNORMAL";
    }
    if (activeFilter === "CRITICAL") {
      const s = f.status?.toUpperCase() || "";
      return s === "HIGH" || s === "LOW" || s === "ABNORMAL"; // and belongs in alerts
    }
    return true;
  });

  const getStatusStyle = (status: string) => {
    const s = status?.toUpperCase() || "";
    switch (s) {
      case "HIGH":
        return {
          bg: "bg-rose-50 text-rose-850 border-rose-200",
          badge: "bg-rose-600 text-white",
          text: "text-rose-750",
          dot: "bg-rose-500",
        };
      case "LOW":
        return {
          bg: "bg-blue-50 text-blue-800 border-blue-200",
          badge: "bg-blue-600 text-white",
          text: "text-blue-750",
          dot: "bg-blue-500",
        };
      case "ABNORMAL":
        return {
          bg: "bg-amber-50 text-amber-850 border-amber-200",
          badge: "bg-amber-600 text-stone-900",
          text: "text-amber-800",
          dot: "bg-amber-500",
        };
      default:
        return {
          bg: "bg-emerald-50 text-emerald-850 border-emerald-150",
          badge: "bg-emerald-600 text-white",
          text: "text-emerald-700",
          dot: "bg-emerald-500",
        };
    }
  };

  return (
    <div id="clinical-dossier" className="space-y-6">
      
      {/* 1. Critical Alerts Indicator */}
      {medicalData.criticalAlerts && medicalData.criticalAlerts.length > 0 && (
        <div id="critical-alerts" className="bg-rose-50/90 border border-rose-200 rounded-xl p-4.5 text-stone-900 shadow-[0_2px_12px_rgba(239,68,68,0.04)] animate-pulse-slow">
          <div className="flex items-start gap-3">
            <ShieldAlert size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-800 font-mono">
                Urgent Clinical Watchlist
              </h4>
              <ul className="list-disc pl-4 space-y-1 text-xs text-rose-750 font-medium">
                {medicalData.criticalAlerts.map((alert, idx) => (
                  <li key={idx}>{alert}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 2. Primary Biography/Dossier Card */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
        
        {/* Document Metadata header ribbon */}
        <div className="bg-stone-900 text-stone-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-950">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-500 text-stone-950 rounded text-[9px] font-mono font-bold uppercase tracking-wider">
                Extracted Report
              </span>
              <span className="text-[11px] font-mono text-stone-400">
                MD-{fileState ? (fileState.size % 900) + 100 : "227"}
              </span>
            </div>
            <h3 className="font-serif text-lg font-medium text-white tracking-tight mt-1">
              {medicalData.documentType || "Clinical Diagnostic Summary"}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-stone-400 text-xs font-mono shrink-0">
            <Calendar size={13} />
            <span>Date: {medicalData.documentDate || "Not Specified"}</span>
          </div>
        </div>

        {/* Patient Bio & Document Facility metadata */}
        <div className="p-6 bg-stone-50/75 border-b border-stone-150 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1 pr-4 border-r border-stone-200/60">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">Patient Name</span>
            <span className="text-sm font-semibold text-stone-900 truncate block">
              {medicalData.patientName || "Anonymous/Omitted"}
            </span>
          </div>
          <div className="space-y-1 pr-4 md:border-r border-stone-200/60">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">Biographical</span>
            <span className="text-sm font-semibold text-stone-900 block">
              {medicalData.patientAge ? `${medicalData.patientAge} yrs` : "N/A"} • {medicalData.patientGender || "N/A"}
            </span>
          </div>
          <div className="space-y-1 pr-4 border-r border-stone-200/60">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">Facility Unit</span>
            <span className="text-sm font-medium text-stone-850 truncate block flex items-center gap-1">
              <Hospital size={12} className="text-stone-400 shrink-0" />
              {medicalData.facilityName || "Clinical Lab/Omitted"}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">Provider Name</span>
            <span className="text-sm font-medium text-stone-850 truncate block">
              {medicalData.providerName || "Physician on Record"}
            </span>
          </div>
        </div>

        {/* Translate summary for layperson */}
        <div className="p-6 border-b border-stone-150">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-150 shrink-0 mt-0.5">
              <Info size={14} className="stroke-[2]" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700 font-mono">
                Layperson Clinical Summary
              </h4>
              <p className="text-sm text-stone-650 leading-relaxed font-light">
                {medicalData.summary}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Biomarkers Findings List */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4.5">
            <div className="flex items-center gap-1.5">
              <Activity size={16} className="text-stone-600" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-800 font-mono">
                Biomarkers &amp; Findings Matrix
              </h4>
            </div>
            {/* Filter controls */}
            <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-[11px] font-mono leading-none">
              <button
                onClick={() => setActiveFilter("ALL")}
                className={`px-2.5 py-1.5 rounded-md transition-all ${
                  activeFilter === "ALL" ? "bg-white text-stone-900 shadow-sm font-semibold" : "text-stone-500 hover:text-stone-900"
                }`}
              >
                All ({medicalData.findings.length})
              </button>
              <button
                onClick={() => setActiveFilter("ABNORMAL")}
                className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                  activeFilter === "ABNORMAL" ? "bg-white text-stone-900 shadow-sm font-semibold" : "text-stone-500 hover:text-stone-900"
                }`}
              >
                <AlertTriangle size={10} className="text-amber-600" /> Out of Range
              </button>
            </div>
          </div>

          {filteredFindings.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-stone-200 rounded-lg text-xs font-mono text-stone-400">
              No matching findings available for current filter setup.
            </div>
          ) : (
            <div className="border border-stone-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono font-medium">
                      <th className="p-3">Biomarker / Variable</th>
                      <th className="p-3 text-right">Value Detected</th>
                      <th className="p-3">Reference Interval</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3">Clinical Context Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFindings.map((finding, index) => {
                      const cfg = getStatusStyle(finding.status);
                      return (
                        <tr 
                          key={index} 
                          className={`border-b border-stone-100 last:border-0 hover:bg-stone-50/40 transition-colors ${
                            finding.status?.toUpperCase() !== "NORMAL" ? "bg-stone-50/20" : ""
                          }`}
                        >
                          <td className="p-3 font-semibold text-stone-900 max-w-[150px] truncate">
                            {finding.parameter}
                          </td>
                          <td className="p-3 text-right font-mono font-semibold text-stone-900">
                            {finding.value}
                          </td>
                          <td className="p-3 font-mono text-stone-500">
                            {finding.referenceRange || "—"}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              {finding.status || "NORMAL"}
                            </span>
                          </td>
                          <td className="p-3 text-stone-600 text-[11px] leading-relaxed max-w-[200px]">
                            {finding.notes || "No context annotated."}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Diagnoses, Medications & Action Advice Side-By-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Confirmed Diagnoses Box */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.01)]">
          <div className="flex items-center gap-2 pb-3.5 border-b border-stone-100 mb-4">
            <ClipboardList size={16} className="text-stone-600" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-800 font-mono">
              Identified Conditions / impressions
            </h4>
          </div>
          {medicalData.diagnoses && medicalData.diagnoses.length > 0 ? (
            <div className="space-y-2.5">
              {medicalData.diagnoses.map((diag, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-stone-700 bg-stone-50 p-2.5 rounded-md border border-stone-150/60 leading-relaxed">
                  <ChevronRight size={13} className="text-stone-400 shrink-0 mt-0.5" />
                  <span className="font-medium text-stone-900">{diag}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs font-mono text-stone-400 border border-dashed border-stone-150 rounded-lg">
              No specific chronic/acute diagnosis statements found.
            </div>
          )}
        </div>

        {/* Medications & Actions Box */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.01)]">
          <div className="flex items-center gap-2 pb-3.5 border-b border-stone-100 mb-4">
            <Pill size={16} className="text-stone-600" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-800 font-mono">
              Interventions &amp; recommendations
            </h4>
          </div>
          {medicalData.medicationsAndRecommendations && medicalData.medicationsAndRecommendations.length > 0 ? (
            <div className="space-y-3">
              {medicalData.medicationsAndRecommendations.map((med, idx) => (
                <div key={idx} className="bg-emerald-50/20 border border-emerald-150/40 p-3 rounded-md space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-emerald-900">{med.item}</span>
                  </div>
                  {med.dosageOrInstructions && (
                    <p className="text-[11px] text-stone-600 font-mono">
                      Instructions: {med.dosageOrInstructions}
                    </p>
                  )}
                  {med.purpose && (
                    <p className="text-[11px] text-stone-500 font-light italic leading-normal">
                      Intended Goal: {med.purpose}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs font-mono text-stone-400 border border-dashed border-stone-150 rounded-lg">
              No prescription directions or recommendations annotated.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
