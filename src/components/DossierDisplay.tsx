import React, { useState } from "react";
import { 
  FileText, Calendar, ShieldAlert, ChevronRight, Activity, 
  AlertTriangle, Pill, ClipboardList, Info, Hospital, Image as ImageIcon, Sparkles
} from "lucide-react";
import { MedicalData, UploadedFileState } from "../types";

interface DossierDisplayProps {
  medicalData: MedicalData | null;
  documentFile: UploadedFileState | null;
  imageFile: UploadedFileState | null;
}

type FilterType = "ALL" | "ABNORMAL";

export default function DossierDisplay({ medicalData, documentFile, imageFile }: DossierDisplayProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");

  if (!medicalData) {
    return (
      <div id="empty-dossier-state" className="bg-stone-50 border border-dashed border-stone-200 rounded-xl p-10 text-center flex flex-col items-center justify-center min-h-[380px]">
        <div className="p-4 bg-white border border-stone-200 rounded-full text-stone-400 shadow-sm mb-4">
          <FileText size={32} className="stroke-[1.2]" />
        </div>
        <h3 className="font-serif text-lg font-medium text-stone-950">Patient Clinical Dossier</h3>
        <p className="text-sm text-stone-500 font-light max-w-sm mt-1 mb-5">
          Submit either clinical documentation, metabolic spreadsheets, or standard diagnostic imagery scans (such as X-Ray, CT scans, or MRIs) to dynamically generate aggregated diagnoses and translations.
        </p>
        <div className="flex flex-wrap justify-center gap-2 max-w-md">
          <span className="px-2.5 py-1 bg-white text-stone-500 text-[10px] font-mono rounded-full border border-stone-150">PDF Reports</span>
          <span className="px-2.5 py-1 bg-white text-stone-500 text-[10px] font-mono rounded-full border border-stone-150">X-Ray / MRI scans</span>
          <span className="px-2.5 py-1 bg-white text-stone-500 text-[10px] font-mono rounded-full border border-stone-150">Spreadsheets</span>
          <span className="px-2.5 py-1 bg-white text-stone-500 text-[10px] font-mono rounded-full border border-stone-150">Pathology H&amp;E Stain</span>
        </div>
      </div>
    );
  }

  // Filter clinical findings based on toggles
  const filteredFindings = medicalData.findings?.filter((f) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "ABNORMAL") {
      const s = f.status?.toUpperCase() || "";
      return s === "HIGH" || s === "LOW" || s === "ABNORMAL";
    }
    return true;
  }) || [];

  const getStatusStyle = (status: string) => {
    const s = status?.toUpperCase() || "";
    switch (s) {
      case "HIGH":
        return {
          bg: "bg-rose-50 text-rose-850 border-rose-200",
          text: "text-rose-750",
          dot: "bg-rose-500",
        };
      case "LOW":
        return {
          bg: "bg-blue-50 text-blue-800 border-blue-200",
          text: "text-blue-750",
          dot: "bg-blue-500",
        };
      case "ABNORMAL":
        return {
          bg: "bg-amber-50 text-amber-850 border-amber-200",
          text: "text-amber-850",
          dot: "bg-amber-500",
        };
      default:
        return {
          bg: "bg-emerald-50 text-emerald-850 border-emerald-150",
          text: "text-emerald-700",
          dot: "bg-emerald-500",
        };
    }
  };

  return (
    <div id="clinical-dossier" className="space-y-6">
      
      {/* 1. Critical Alerts Indicator */}
      {medicalData.criticalAlerts && medicalData.criticalAlerts.length > 0 && (
        <div id="critical-alerts" className="bg-rose-50/90 border border-rose-200 rounded-xl p-4.5 text-stone-900 shadow-[0_2px_12px_rgba(239,68,68,0.04)]">
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-500 text-stone-950 rounded text-[9px] font-mono font-bold uppercase tracking-wider">
                Integrated Synthesis Result
              </span>
              {documentFile && (
                <span className="px-1.5 py-0.5 bg-stone-800 text-stone-400 rounded text-[9px] font-mono">
                  DOC: {documentFile.name.length > 20 ? `${documentFile.name.substring(0, 18)}...` : documentFile.name}
                </span>
              )}
              {imageFile && (
                <span className="px-1.5 py-0.5 bg-stone-800 text-emerald-400 rounded text-[9px] font-mono">
                  IMG: {imageFile.name.length > 20 ? `${imageFile.name.substring(0, 18)}...` : imageFile.name}
                </span>
              )}
            </div>
            <h3 className="font-serif text-lg font-medium text-white tracking-tight mt-1.5">
              {medicalData.documentType || "Consolidated Clinical Dossier"}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-stone-400 text-xs font-mono shrink-0">
            <Calendar size={13} />
            <span>Date: {medicalData.documentDate || "Synchronized Live"}</span>
          </div>
        </div>

        {/* Patient Bio & Document Facility metadata */}
        <div className="p-6 bg-stone-50/75 border-b border-stone-150 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1 pr-4 border-r border-stone-200/60">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">Patient Name</span>
            <span className="text-sm font-semibold text-stone-900 truncate block">
              {medicalData.patientName || "Anonymous Patient"}
            </span>
          </div>
          <div className="space-y-1 pr-4 lg:border-r border-stone-200/60">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">Bio Matrix</span>
            <span className="text-sm font-semibold text-stone-900 block">
              {medicalData.patientAge ? `${medicalData.patientAge}` : "Omitted"} • {medicalData.patientGender || "Omitted"}
            </span>
          </div>
          <div className="space-y-1 pr-4 border-r border-stone-200/60">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">Primary Facility</span>
            <span className="text-sm font-medium text-stone-850 truncate block flex items-center gap-1">
              <Hospital size={12} className="text-stone-400 shrink-0" />
              {medicalData.facilityName || "Clinical Lab/Omitted"}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">Medical Provider</span>
            <span className="text-sm font-medium text-stone-850 truncate block">
              {medicalData.providerName || "Physician in Charge"}
            </span>
          </div>
        </div>

        {/* Cohesive Medical Summary (Combining Document + Imaging Data) */}
        <div className="p-6 border-b border-stone-150 bg-white">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-150 shrink-0 mt-0.5">
              <Info size={14} className="stroke-[2]" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700 font-mono flex items-center gap-1">
                Unified Layperson Clinical Summary
              </h4>
              <p className="text-sm text-stone-650 leading-relaxed font-light">
                {medicalData.summary}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Foundation Model Clinical ImageObservations Interpretation (Xray/CT/MRI etc.) */}
        {medicalData.imageObservations && (
          <div className="p-6 border-b border-stone-150 bg-stone-50/40">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-sky-50 text-sky-700 rounded border border-sky-150 shrink-0 mt-0.5">
                <ImageIcon size={14} className="stroke-[2]" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700 font-mono">
                    Clinical Imaging Scan Interpretation (Vision-to-Language)
                  </h4>
                  <span className="inline-block px-1.5 py-0.5 bg-sky-100/70 border border-sky-200 text-sky-700 text-[8px] font-mono uppercase rounded font-bold tracking-wider">
                    Foundation Model
                  </span>
                </div>
                <p className="text-xs text-stone-650 leading-relaxed font-light italic">
                  "{medicalData.imageObservations}"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4. Biomarkers Findings List */}
        {medicalData.findings && medicalData.findings.length > 0 && (
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
                <div className="overflow-x-auto font-sans">
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
        )}
      </div>

      {/* 5. Diagnoses, Medications & Action Advice Side-By-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Confirmed Diagnoses Box */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.01)]">
          <div className="flex items-center gap-2 pb-3.5 border-b border-stone-100 mb-4">
            <ClipboardList size={16} className="text-stone-600" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-800 font-mono">
              Identified Conditions / Impressions
            </h4>
          </div>
          {medicalData.diagnoses && medicalData.diagnoses.length > 0 ? (
            <div className="space-y-2.5 font-sans">
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
            <div className="space-y-3 font-sans">
              {medicalData.medicationsAndRecommendations.map((med, idx) => (
                <div key={idx} className="bg-emerald-50/20 border border-emerald-150/40 p-3 rounded-md space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-emerald-950">{med.item}</span>
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
