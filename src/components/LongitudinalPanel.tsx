import React, { useState, useMemo } from "react";
import { 
  TrendingUp, 
  Calendar, 
  LineChart as ChartIcon, 
  Sparkles, 
  Trash2, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  Plus,
  RefreshCw,
  Clock,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { HistoricalRecord, MedicalData } from "../types";

interface LongitudinalPanelProps {
  records: HistoricalRecord[];
  onRemoveRecord: (id: string) => void;
  selectedModel: string;
}

// Simple and safe text-to-HTML parser to style markdown responses elegantly
const renderTimelineMarkdown = (text: string) => {
  if (!text) return "";
  
  // Bold text (**bold**)
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-stone-900">$1</strong>');
  
  const lines = formatted.split("\n");
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      return `<li class="ml-4 list-disc text-xs text-stone-700 font-light pb-1">${trimmed.substring(2)}</li>`;
    }
    if (trimmed.match(/^\d+\.\s/)) {
      const content = trimmed.replace(/^\d+\.\s/, "");
      return `<li class="ml-4 list-decimal text-xs text-stone-700 font-light pb-1">${content}</li>`;
    }
    if (trimmed.startsWith("### ")) {
      return `<h5 class="text-xs font-semibold text-stone-900 pt-3 pb-1 uppercase tracking-wider font-mono">${trimmed.substring(4)}</h5>`;
    }
    if (trimmed.startsWith("## ")) {
      return `<h4 class="text-sm font-serif font-semibold text-emerald-950 pt-4 pb-1 border-b border-stone-100 flex items-center gap-1.5">${trimmed.substring(3)}</h4>`;
    }
    if (trimmed.startsWith("# ")) {
      return `<h3 class="text-base font-serif font-bold text-stone-950 pt-5 pb-1 border-b border-stone-200">${trimmed.substring(2)}</h3>`;
    }
    if (trimmed === "") {
      return `<div class="h-1.5"></div>`;
    }
    return `<p class="text-xs text-stone-650 leading-relaxed font-light pb-2">${line}</p>`;
  });

  return processedLines.join("");
};

export default function LongitudinalPanel({
  records,
  onRemoveRecord,
  selectedModel
}: LongitudinalPanelProps) {
  const [activeTab, setActiveTab] = useState<"visualizer" | "report">("visualizer");
  const [selectedParameter, setSelectedParameter] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activeDotsIndex, setActiveDotsIndex] = useState<number | null>(null);

  // Chronological sorting (ascending by date)
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records]);

  // Scan all findings across historical records to find unique parameters and plot points
  const parameterHistory = useMemo(() => {
    const paramMap: { [key: string]: Array<{ date: string; valueStr: string; numericValue: number | null; unit: string; status: string; notes?: string; recordId: string }> } = {};

    sortedRecords.forEach(rec => {
      if (rec.medicalData.findings) {
        rec.medicalData.findings.forEach(finding => {
          const rawParam = finding.parameter || "";
          if (!rawParam) return;

          // Normalize parameter name (e.g., lowercase trimming or standard names can map together, but keep casing for display)
          // Find standard matches or exact match
          const paramName = rawParam.trim();
          
          // Parse number & units
          let numericVal: number | null = null;
          let detectedUnit = "";

          const valueStr = finding.value || "";
          const numMatch = valueStr.match(/([0-9]+(?:\.[0-9]+)?)/);
          if (numMatch) {
            numericVal = parseFloat(numMatch[1]);
            // Extract remaining text as unit
            detectedUnit = valueStr.replace(numMatch[1], "").trim();
          }

          if (!paramMap[paramName]) {
            paramMap[paramName] = [];
          }

          paramMap[paramName].push({
            date: rec.date,
            valueStr,
            numericValue: numericVal,
            unit: detectedUnit,
            status: finding.status || "NORMAL",
            notes: finding.notes,
            recordId: rec.id
          });
        });
      }
    });

    return paramMap;
  }, [sortedRecords]);

  // Unique parameter list sorted alphabetically
  const parameterOptions = useMemo(() => {
    return Object.keys(parameterHistory).sort();
  }, [parameterHistory]);

  // Default to first parameter option if none is selected
  React.useEffect(() => {
    if (parameterOptions.length > 0 && !selectedParameter) {
      // Find one that has at least some numeric values
      const numericChoice = parameterOptions.find(p => 
        parameterHistory[p].some(item => item.numericValue !== null)
      );
      setSelectedParameter(numericChoice || parameterOptions[0]);
    }
  }, [parameterOptions, selectedParameter, parameterHistory]);

  // Compute SVG Plot coordinates for selected parameter
  const chartData = useMemo(() => {
    if (!selectedParameter || !parameterHistory[selectedParameter]) return null;

    const dataPoints = parameterHistory[selectedParameter];
    const numericPoints = dataPoints.filter(p => p.numericValue !== null);

    if (numericPoints.length === 0) return null;

    const values = numericPoints.map(p => p.numericValue as number);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    
    // Add 15% padding top and bottom to make chart beautiful
    const range = maxVal - minVal;
    const padding = range === 0 ? Math.max(1, minVal * 0.1) : range * 0.15;
    const yMin = Math.max(0, minVal - padding);
    const yMax = maxVal + padding;

    return {
      points: numericPoints,
      yMin,
      yMax,
      minVal,
      maxVal
    };
  }, [selectedParameter, parameterHistory]);

  const triggerLongitudinalAIAnalysis = async () => {
    if (records.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisReport(null);

    try {
      const response = await fetch("/api/analyze-longitudinal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: records,
          model: selectedModel
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "The analytical progression server dropped response.");
      }

      setAnalysisReport(resData.analysis);
      setActiveTab("report");
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "An unexpected error occurred synthesizing your timeline analytics.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusColorClass = (status: string) => {
    const s = status.toUpperCase();
    if (s === "HIGH") return "bg-rose-50 border-rose-200 text-rose-700";
    if (s === "LOW") return "bg-sky-50 border-sky-200 text-sky-700";
    if (s === "ABNORMAL") return "bg-amber-50 border-amber-200 text-amber-700";
    return "bg-emerald-50 border-emerald-100 text-emerald-700";
  };

  return (
    <div id="longitudinal-workspace" className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-0">
      
      {/* Header bar */}
      <div className="bg-stone-50 border-b border-stone-200 px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-serif font-semibold text-stone-950 flex items-center gap-2">
            <TrendingUp className="text-emerald-600 stroke-[2.2]" size={18} />
            Longitudinal Health Workspace ({records.length} {records.length === 1 ? "Record" : "Records"})
          </h2>
          <p className="text-xs text-stone-500 font-light mt-0.5">
            Cross-day tracking, health progression timelines, and AI biomarker trend interpretation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {records.length > 0 && (
            <button
              onClick={triggerLongitudinalAIAnalysis}
              disabled={isAnalyzing}
              className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap ${
                isAnalyzing 
                  ? "bg-stone-100 text-stone-400 cursor-not-allowed" 
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {isAnalyzing ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Sparkles size={13} className="fill-emerald-100/10 text-emerald-50" />
              )}
              {isAnalyzing ? "Synthesizing Trends..." : "Generate AI Progression Report"}
            </button>
          )}
        </div>
      </div>

      {sortedRecords.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center space-y-3 min-h-[300px]">
          <div className="p-3 bg-stone-50 rounded-full border border-stone-150 text-stone-400">
            <Clock size={24} className="stroke-[1.5]" />
          </div>
          <div className="max-w-sm">
            <p className="text-sm font-semibold text-stone-900">Longitudinal Timeline is Empty</p>
            <p className="text-xs text-stone-500 mt-1 font-light leading-relaxed">
              When analyzing new dossiers, enable data archiving using the collection date selector to save logs chronologically to this dashboard and map biomarker metrics over time.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 border-t border-stone-100 h-full min-h-[600px] divide-x divide-stone-200">
          
          {/* LEFT PANEL (Timeline Log List) */}
          <div className="lg:col-span-5 p-5 space-y-4 max-h-[680px] overflow-y-auto bg-stone-50/20">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Calendar size={13} className="text-emerald-600" />
                Chronological Entries Log
              </h3>
              <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-semibold">
                Sorted oldest to newest
              </span>
            </div>

            <div className="relative border-l-2 border-stone-150 pl-4 ml-2.5 space-y-6 pt-1 pb-2">
              {sortedRecords.map((rec, index) => {
                const formattedDate = new Date(rec.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                });

                return (
                  <div key={rec.id} className="relative group">
                    {/* Event bullet indicator */}
                    <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white group-hover:scale-125 transition-transform" />
                    
                    <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-emerald-500/50 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2 mb-2">
                        <div>
                          <p className="text-[11px] font-mono font-bold text-emerald-700 uppercase tracking-widest">
                            {formattedDate}
                          </p>
                          <h4 className="text-xs font-semibold text-stone-900 mt-0.5">
                            {rec.medicalData.documentType || "Medical Lab Report"}
                          </h4>
                        </div>
                        <button
                          onClick={() => onRemoveRecord(rec.id)}
                          className="text-stone-300 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove from history logger"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Display attachment names if active */}
                      {(rec.fileName || rec.imageName) && (
                        <div className="flex flex-wrap gap-1.5 pb-2 border-b border-stone-100/60 mb-2">
                          {rec.fileName && (
                            <div className="bg-stone-50 border border-stone-100 text-[10px] text-stone-500 rounded px-1.5 py-0.5 max-w-[130px] truncate" title={rec.fileName}>
                              📄 {rec.fileName}
                            </div>
                          )}
                          {rec.imageName && (
                            <div className="bg-emerald-50/50 border border-emerald-100 text-[10px] text-emerald-600 rounded px-1.5 py-0.5 max-w-[130px] truncate" title={rec.imageName}>
                              📷 {rec.imageName}
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed italic font-light">
                        "{rec.medicalData.summary}"
                      </p>

                      {/* Diagnostic badges list */}
                      {rec.medicalData.diagnoses && rec.medicalData.diagnoses.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {rec.medicalData.diagnoses.map((diag, dIdx) => (
                            <span key={dIdx} className="text-[9.5px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono font-medium">
                              {diag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Biomarker highlights summary */}
                      {rec.medicalData.findings && rec.medicalData.findings.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-stone-100 flex flex-wrap gap-1.5">
                          {rec.medicalData.findings.slice(0, 3).map((f, fIdx) => {
                            const isAlert = ["HIGH", "LOW", "ABNORMAL"].includes((f.status || "").toUpperCase());
                            return (
                              <span 
                                key={fIdx} 
                                className={`text-[9px] px-1.5 py-0.5 rounded border ${
                                  isAlert 
                                    ? "bg-rose-50/30 border-rose-150 text-rose-700" 
                                    : "bg-stone-50 border-stone-150 text-stone-500"
                                } font-light`}
                              >
                                {f.parameter}: {f.value}
                              </span>
                            );
                          })}
                          {rec.medicalData.findings.length > 3 && (
                            <span className="text-[9px] text-stone-400 pl-1">
                              +{rec.medicalData.findings.length - 3} more finding metrics
                            </span>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANEL (Active visual workspace, Charts and AI Reports) */}
          <div className="lg:col-span-7 flex flex-col max-h-[680px] overflow-y-auto">
            
            {/* View selectors */}
            <div className="bg-stone-50 border-b border-stone-200 px-6 py-3 flex items-center justify-between shrink-0">
              <div className="flex bg-stone-150 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setActiveTab("visualizer")}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                    activeTab === "visualizer" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Biomarker Trend Charts
                </button>
                <button
                  onClick={() => {
                    setActiveTab("report");
                    if (!analysisReport) {
                      triggerLongitudinalAIAnalysis();
                    }
                  }}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 ${
                    activeTab === "report" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  AI Progression Report
                  {analysisReport && (
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  )}
                </button>
              </div>

              <div className="text-[10px] font-mono text-stone-400">
                Engine: <span className="font-semibold text-stone-600 uppercase">{selectedModel}</span>
              </div>
            </div>

            {/* ERROR RIBBON */}
            {analysisError && (
              <div className="m-5 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2.5">
                <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <span className="font-semibold">Trend Generation Failed</span> – {analysisError}
                  <button 
                    onClick={triggerLongitudinalAIAnalysis} 
                    className="block underline mt-1 font-semibold hover:text-rose-900 cursor-pointer"
                  >
                    Retry Analysis
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTAINER */}
            <div className="flex-1 p-6">
              {activeTab === "visualizer" ? (
                <div className="space-y-6">
                  
                  {/* Selector Block */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-semibold text-stone-600 flex items-center gap-1.5">
                      <ChartIcon size={14} className="text-emerald-600" />
                      Select Historical Biomarker to Track:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {parameterOptions.map((param) => {
                        const count = parameterHistory[param].length;
                        const isSelected = selectedParameter === param;
                        return (
                          <button
                            key={param}
                            onClick={() => {
                              setSelectedParameter(param);
                              setActiveDotsIndex(null);
                            }}
                            className={`px-3 py-1.5 text-xs rounded-lg border transition-all cursor-pointer ${
                              isSelected 
                                ? "bg-stone-900 text-white border-stone-900 font-semibold shadow-sm" 
                                : "bg-white border-stone-200 text-stone-600 hover:border-stone-400"
                            }`}
                          >
                            {param}
                            <span className={`ml-1.5 text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                              isSelected ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-500"
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* SVG Chart display */}
                  {chartData ? (
                    <div className="bg-stone-50/50 border border-stone-200 rounded-2xl p-5 space-y-4">
                      
                      {/* Chart metadata & header details */}
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-400">
                            Active Trendline
                          </h4>
                          <p className="text-sm font-serif font-semibold text-stone-900">
                            Chronology Map of {selectedParameter}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono text-stone-500">
                            Detected range across day logs:
                          </p>
                          <p className="text-xs font-mono font-bold text-stone-900">
                            {chartData.minVal} – {chartData.maxVal} {chartData.points[0]?.unit}
                          </p>
                        </div>
                      </div>

                      {/* SVG Canvas wrapper */}
                      <div className="relative w-full aspect-[21/9] bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                        
                        <svg className="w-full h-full p-4" viewBox="0 0 500 200" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#059669" stopOpacity="0.12" />
                              <stop offset="100%" stopColor="#059669" stopOpacity="0.00" />
                            </linearGradient>
                          </defs>

                          {/* Grid Lines */}
                          <line x1="40" y1="20" x2="480" y2="20" stroke="#f5f5f4" strokeWidth="1" strokeDasharray="3 3" />
                          <line x1="40" y1="65" x2="480" y2="65" stroke="#f5f5f4" strokeWidth="1" strokeDasharray="3 3" />
                          <line x1="40" y1="110" x2="480" y2="110" stroke="#f5f5f4" strokeWidth="1" strokeDasharray="3 3" />
                          <line x1="40" y1="155" x2="480" y2="155" stroke="#f5f5f4" strokeWidth="1" strokeDasharray="3 3" />
                          
                          {/* Y-Axis tick descriptors (left aligned) */}
                          <text x="35" y="24" textAnchor="end" className="text-[9px] fill-stone-400 font-mono">
                            {chartData.yMax.toFixed(1)}
                          </text>
                          <text x="35" y="90" textAnchor="end" className="text-[9px] fill-stone-400 font-mono">
                            {((chartData.yMax + chartData.yMin) / 2).toFixed(1)}
                          </text>
                          <text x="35" y="157" textAnchor="end" className="text-[9px] fill-stone-400 font-mono">
                            {chartData.yMin.toFixed(1)}
                          </text>

                          {/* Render line */}
                          {chartData.points.length > 0 && (() => {
                            const paddingLeft = 60;
                            const paddingRight = 440;
                            const chartWidth = paddingRight - paddingLeft;
                            const ySpan = chartData.yMax - chartData.yMin;

                            const getCoords = (index: number, val: number) => {
                              const totalPoints = chartData.points.length;
                              const x = totalPoints <= 1 
                                ? paddingLeft + chartWidth / 2 
                                : paddingLeft + (index / (totalPoints - 1)) * chartWidth;
                              
                              // Invert Y mapping context for SVG
                              const percentage = ySpan === 0 ? 0.5 : (val - chartData.yMin) / ySpan;
                              const y = 155 - percentage * 135; 
                              return { x, y };
                            };

                            // Path builder
                            let pathString = "";
                            let areaPathString = "";
                            
                            chartData.points.forEach((pt, idx) => {
                              const { x, y } = getCoords(idx, pt.numericValue as number);
                              if (idx === 0) {
                                pathString += `M ${x} ${y}`;
                                areaPathString += `M ${x} 155 L ${x} ${y}`;
                              } else {
                                pathString += ` L ${x} ${y}`;
                                areaPathString += ` L ${x} ${y}`;
                              }

                              if (idx === chartData.points.length - 1) {
                                areaPathString += ` L ${x} 155 Z`;
                              }
                            });

                            return (
                              <>
                                {/* Fill gradient Area */}
                                {chartData.points.length > 1 && (
                                  <path d={areaPathString} fill="url(#chart-area-grad)" />
                                )}

                                {/* Line stroke */}
                                <path 
                                  d={pathString} 
                                  fill="none" 
                                  stroke="#059669" 
                                  strokeWidth="2.5" 
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />

                                {/* Interactive hover points dots */}
                                {chartData.points.map((pt, idx) => {
                                  const { x, y } = getCoords(idx, pt.numericValue as number);
                                  const isActive = activeDotsIndex === idx;
                                  return (
                                    <g key={idx} className="cursor-pointer group/dot">
                                      <circle 
                                        cx={x} 
                                        cy={y} 
                                        r={isActive ? "6" : "4.5"} 
                                        fill={isActive ? "#047857" : "#10b981"} 
                                        stroke="#ffffff" 
                                        strokeWidth={isActive ? "2" : "1.5"}
                                        onClick={() => setActiveDotsIndex(idx)}
                                        onMouseEnter={() => setActiveDotsIndex(idx)}
                                        style={{ transition: "all 0.15s ease-out" }}
                                      />
                                      <circle 
                                        cx={x} 
                                        cy={y} 
                                        r="12" 
                                        fill="transparent" 
                                        onClick={() => setActiveDotsIndex(idx)}
                                        onMouseEnter={() => setActiveDotsIndex(idx)}
                                      />
                                    </g>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </svg>

                        {/* Chart Day/Collection-Date labels at the bottom */}
                        <div className="absolute bottom-1.5 left-0 right-0 px-4 pl-14 flex justify-between text-[8px] font-mono text-stone-400">
                          {chartData.points.map((pt, idx) => {
                            const labelDate = new Date(pt.date).toLocaleDateString("en-US", {
                              month: "2-digit",
                              day: "2-digit"
                            });
                            return (
                              <span key={idx} className="text-center w-8 shrink-0">
                                {labelDate}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Dot details Tooltip display */}
                      <div className="bg-white border border-stone-200.5 rounded-xl p-4 min-h-[72px] flex items-center justify-between">
                        {activeDotsIndex !== null && chartData.points[activeDotsIndex] ? (() => {
                          const activePt = chartData.points[activeDotsIndex];
                          const flagStatusColor = getStatusColorClass(activePt.status);
                          return (
                            <div className="w-full flex items-start justify-between gap-4 animate-fadeIn">
                              <div className="space-y-1">
                                <p className="text-[10px] font-mono text-stone-400">
                                  Metric Point – {new Date(activePt.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                                </p>
                                <div className="flex items-center gap-2">
                                  <h5 className="text-xs font-semibold text-stone-900">
                                    {selectedParameter}:
                                  </h5>
                                  <p className="text-sm font-mono font-bold text-stone-950">
                                    {activePt.valueStr}
                                  </p>
                                  <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.2 border rounded ${flagStatusColor}`}>
                                    {activePt.status}
                                  </span>
                                </div>
                                {activePt.notes && (
                                  <p className="text-xs text-stone-500 font-light italic">
                                    Notes: {activePt.notes}
                                  </p>
                                )}
                              </div>
                              {activePt.referenceRange && (
                                <div className="text-right whitespace-nowrap bg-stone-50 border border-stone-100 p-2 rounded-lg">
                                  <p className="text-[9px] font-mono text-stone-400">Normal Range</p>
                                  <p className="text-xs font-mono font-medium text-stone-900">
                                    {activePt.referenceRange}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })() : (
                          <div className="w-full text-center py-2 text-stone-400 text-xs font-light flex items-center justify-center gap-2">
                            <Activity size={14} className="text-emerald-500" />
                            Hover over or click a timeline point on the trendline graph to interpret individual test results.
                          </div>
                        )}
                      </div>

                    </div>
                  ) : (
                    <div className="bg-stone-50 border border-stone-150 rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-2.5">
                      <Clock size={20} className="text-stone-400" />
                      <div>
                        <p className="text-xs font-semibold text-stone-850">Numeric Trendlines Pending</p>
                        <p className="text-[11px] text-stone-500 leading-normal max-w-sm font-light mt-0.5">
                          The current parameter "{selectedParameter}" does not contain structured numeric measurements (e.g. glucose "110 mg/dL"). Non-numeric properties are documented above inside the entry timeline log list.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Biomarker tracker notice */}
                  <div className="bg-emerald-50/40 rounded-xl border border-emerald-100 p-4 text-xs leading-relaxed text-stone-700 font-light flex items-start gap-3">
                    <UserCheck size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold text-emerald-950">How to populate longitudinal charts:</strong> Aegis scans all patient lab sheets chronologically. To trace progression, upload files of similar medical categories (for instance: consecutive CBC panel sheets or periodic glucose checks) across multiple calendar days.
                    </div>
                  </div>

                </div>
              ) : (
                <div className="space-y-4">
                  {isAnalyzing ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-11 w-11 border-4 border-emerald-100 border-t-emerald-600" />
                        <Sparkles size={16} className="absolute inset-x-0 inset-y-0 m-auto text-emerald-600 fill-emerald-100/20 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-stone-900">Synthesizing Patient Logs...</p>
                        <p className="text-xs text-stone-500 max-w-xs font-light">
                          Establishing chronological correlations across your records and testing parameters using {selectedModel}...
                        </p>
                      </div>
                    </div>
                  ) : analysisReport ? (
                    <div className="bg-stone-50/30 border border-stone-200.5 rounded-2xl p-6.5 space-y-5 animate-fadeIn">
                      
                      <div className="flex items-center justify-between border-b border-stone-150 pb-4 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
                            <Sparkles size={15} className="fill-emerald-100/20" />
                          </div>
                          <div>
                            <h4 className="text-sm font-serif font-bold text-stone-950">
                              AI Health Progression Report
                            </h4>
                            <p className="text-[10px] text-stone-400 font-mono">
                              GENERATED CHRONOLOGICALLY BY AEGIS-LOGS
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={triggerLongitudinalAIAnalysis}
                          className="px-3 py-1.5 bg-white border border-stone-200 hover:border-stone-400 text-stone-600 hover:text-stone-950 text-xs rounded-lg font-medium transition-all shadow-sm cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <RefreshCw size={11} /> Refresh Report
                        </button>
                      </div>

                      <div 
                        className="space-y-4.5 formatted-longitudinal-markdown"
                        dangerouslySetInnerHTML={{ __html: renderTimelineMarkdown(analysisReport) }}
                      />

                    </div>
                  ) : (
                    <div className="p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[300px]">
                      <div className="p-3 bg-stone-50 rounded-full border border-stone-150 text-stone-400">
                        <Sparkles size={22} className="stroke-[1.5]" />
                      </div>
                      <div className="max-w-xs">
                        <p className="text-sm font-semibold text-stone-900">Generate Progression Analysis</p>
                        <p className="text-xs text-stone-500 mt-1 font-light leading-relaxed">
                          Ask Gemini to compile and evaluate all {records.length} historical day records to find hidden correlations and health trends.
                        </p>
                        <button
                          onClick={triggerLongitudinalAIAnalysis}
                          className="mt-4 px-4 py-2 bg-stone-900 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                        >
                          Generate AI Trend Report
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
