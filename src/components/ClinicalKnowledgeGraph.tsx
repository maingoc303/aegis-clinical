import React, { useState, useMemo } from "react";
import { 
  Network, 
  User, 
  Database, 
  Activity, 
  ShieldCheck, 
  Info, 
  Search, 
  Sparkles, 
  Calendar,
  Pill,
  BookOpen,
  Filter,
  CheckCircle2,
  LineChart as ChartIcon
} from "lucide-react";
import { HistoricalRecord, MedicalData, ChatMessage } from "../types";

interface ClinicalKnowledgeGraphProps {
  records: HistoricalRecord[];
  expertise?: string;
  onViewTrend?: (paramName: string) => void;
}

interface GraphNode {
  id: string;
  label: string;
  type: "PATIENT" | "RECORD" | "BIOMARKER" | "DIAGNOSIS" | "MEDICATION" | "DEMOGRAPHIC" | "COUNT_RX" | "COUNT_LAB";
  val?: string;
  date?: string;
  sourceRecordId?: string;
}

interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
}

// Simulated biobank alternative patient templates
const SIMULATED_PATIENTS = [
  {
    id: "active",
    name: "Primary Patient EHR (Active Uploads)",
    birth: "1968-04-12",
    gender: "Female",
    facility: "General Biobank Unit",
    status: "Active Tracking",
  },
  {
    id: "pat-cardio-992",
    name: "Patient AEGIS-992 (Cardiovascular Study)",
    birth: "1954-11-23",
    gender: "Male",
    facility: "Metabolic Research Inst.",
    status: "Cohort Enrolled",
    records: [
      {
        id: "sim-1",
        date: "2026-01-10",
        fileName: "Cardio_Stress_Lab.pdf",
        medicalData: {
          patientName: "EHR-992 Participant",
          patientAge: 71,
          patientGender: "Male",
          documentType: "Cardiorespiratory Stress report",
          documentDate: "2026-01-10",
          facilityName: "Vascular Core Lab",
          providerName: "Dr. Amanda Chen",
          summary: "Patient demonstrates moderate myocardial perfusion discrepancy during active treadmill stress cycle. Left ventriclar hypertrophy noted on visual diagnostic ultrasound scans.",
          imageObservations: "Visual echography indicates concentric myocardial hypertrophy with minor left atrial enlargement. Rest-stress perfusion is suboptimal.",
          findings: [
            { parameter: "Troponin-T", value: "0.04 ng/mL", referenceRange: "< 0.01 ng/mL", status: "HIGH", notes: "Mild systemic ischemic stress marker detected." },
            { parameter: "Systolic BP", value: "158 mmHg", referenceRange: "90-120 mmHg", status: "HIGH", notes: "Hypertensive stress response peak." },
            { parameter: "LVEF", value: "48 %", referenceRange: "55-70 %", status: "LOW", notes: "Systolic ejecting fractional impairment." }
          ],
          diagnoses: ["Arterial Hypertension", "Ischemic Heart Stress Profile", "Mild Systolic Dysfunction"],
          medicationsAndRecommendations: [
            { item: "Lisinopril 10mg", dosageOrInstructions: "Take 1 tablet daily in the morning", purpose: "Reduce peripheral vascular resistance and manage blood pressure." },
            { item: "Coenzyme Q10", dosageOrInstructions: "100mg once daily with meal", purpose: "Myocardial oxidative metabolism enhancement support." }
          ],
          criticalAlerts: ["Eleveated Troponin-T requires cardiology follow-up"]
        }
      },
      {
        id: "sim-2",
        date: "2026-03-12",
        fileName: "Cardio_Followup_Lab.pdf",
        medicalData: {
          patientName: "EHR-992 Participant",
          patientAge: 71,
          patientGender: "Male",
          documentType: "Cardiac Lab Panels",
          documentDate: "2026-03-12",
          facilityName: "Vascular Core Lab",
          providerName: "Dr. Amanda Chen",
          summary: "Followup biochemistry panels indicate reduction in circulatory troponins and stabilization of systemic blood pressure following Lisinopril administration.",
          findings: [
            { parameter: "Troponin-T", value: "0.01 ng/mL", referenceRange: "< 0.01 ng/mL", status: "NORMAL", notes: "Troponin has returned to reference baseline." },
            { parameter: "Systolic BP", value: "128 mmHg", referenceRange: "90-120 mmHg", status: "ABNORMAL", notes: "Substantially decreased, near borderline normal." },
            { parameter: "Heart Rate", value: "68 bpm", referenceRange: "60-100 bpm", status: "NORMAL" }
          ],
          diagnoses: ["Arterial Hypertension (Stabilized)"],
          medicationsAndRecommendations: [
            { item: "Lisinopril 10mg", dosageOrInstructions: "Continue daily intake", purpose: "Maintain anti-hypertensive control." }
          ],
          criticalAlerts: []
        }
      }
    ]
  },
  {
    id: "pat-metabolic-082",
    name: "Patient AEGIS-082 (Biometabolic Diabetes Cohort)",
    birth: "1983-09-02",
    gender: "Female",
    facility: "EHR Endocrine Registries",
    status: "Sub-cohort Synced",
    records: [
      {
        id: "sim-3",
        date: "2026-02-15",
        fileName: "Metabolic_Metrix.xlsx",
        medicalData: {
          patientName: "EHR-082 Female Patient",
          patientAge: 42,
          patientGender: "Female",
          documentType: "Comprehensive Metabolic Panel",
          documentDate: "2026-02-15",
          facilityName: "Northside Biodiagnostics",
          providerName: "Dr. Arthur Pendelton",
          summary: "Elevated serum fasting glucose with parallel high HbA1c indicative of underlying Insulin Resistance or prediabetic state progression. Serum lipids are moderately aberrant.",
          findings: [
            { parameter: "Fasting Glucose", value: "135 mg/dL", referenceRange: "70-100 mg/dL", status: "HIGH", notes: "Consistent fasting hyperglycemia." },
            { parameter: "HbA1c", value: "6.8 %", referenceRange: "4.0-5.6 %", status: "HIGH", notes: "Within clinical diabetic threshold parameters." },
            { parameter: "LDL Cholesterol", value: "142 mg/dL", referenceRange: "< 100 mg/dL", status: "HIGH", notes: "Elevated hypercholesterolemia threat." }
          ],
          diagnoses: ["Type 2 Diabetes Mellitus", "Dyslipidemia"],
          medicationsAndRecommendations: [
            { item: "Metformin 500mg ER", dosageOrInstructions: "Take 1 tablet twice daily with lunch/dinner", purpose: "Enhance peripheral insulin responsiveness." },
            { item: "Lifestyle: Glycemic Cutback", dosageOrInstructions: "Limit simple carbohydrates under 50g per day", purpose: "Lower glycation hemoglobin index." }
          ],
          criticalAlerts: ["HbA1c indicates pre-diabetes / diabetic threshold state"]
        }
      }
    ]
  }
];

export default function ClinicalKnowledgeGraph({ records, expertise, onViewTrend }: ClinicalKnowledgeGraphProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeFilterType, setActiveFilterType] = useState<string>("ALL");

  // Determine active dataset (only user uploads, no simulated cohorts)
  const activeRecords = records;

  const patientMeta = useMemo(() => {
    const activeName = records[0]?.medicalData.patientName || "Primary Subject (Active Profile)";
    return {
      name: activeName,
      birth: "Decentralized Sync",
      gender: records[0]?.medicalData.patientGender || "Omitted",
      facility: records[0]?.medicalData.facilityName || "Primary Portal Care",
      status: records.length > 0 ? "Tracking Synchronized" : "Awaiting Submissions",
    };
  }, [records]);

  // Construct structured Nodes and Edges from patient chronological files tailored per clinical expertise role!
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // 1. Root Patient Node (Always exists)
    const patientNodeId = "NODE-PATIENT";
    nodes.push({
      id: patientNodeId,
      label: patientMeta.name,
      type: "PATIENT"
    });

    if (activeRecords.length === 0) {
      return { nodes, edges };
    }

    // A. Demographic Node
    const demoId = "NODE-DEMOGRAPHIC";
    const pAge = activeRecords[0]?.medicalData.patientAge || "Unknown Age";
    nodes.push({
      id: demoId,
      label: "Demographics",
      val: `Gender: ${patientMeta.gender} | Age: ${pAge}`,
      type: "DEMOGRAPHIC"
    });
    edges.push({
      source: patientNodeId,
      target: demoId,
      relationship: "HAS_DEMOGRAPHICS"
    });

    // B. Visit Nodes
    activeRecords.forEach(rec => {
      const recId = `NODE-REC-${rec.id}`;
      nodes.push({
        id: recId,
        label: rec.medicalData.documentType || `Visit ${rec.date}`,
        val: rec.date,
        type: "RECORD",
        sourceRecordId: rec.id
      });
      edges.push({
        source: patientNodeId,
        target: recId,
        relationship: "HAD_VISIT"
      });
    });

    // Extract unique medical entities across records
    const uniqueDiagnoses = new Set<string>();
    const uniqueMeds = new Set<string>();
    const uniqueFindings = new Set<string>();

    const medsMap: { [key: string]: { item: string; dosage?: string; purpose?: string } } = {};
    const findingsMap: { [key: string]: { parameter: string; value: string; status: string } } = {};

    activeRecords.forEach(rec => {
      if (rec.medicalData.diagnoses) {
        rec.medicalData.diagnoses.forEach(d => uniqueDiagnoses.add(d.trim()));
      }
      if (rec.medicalData.medicationsAndRecommendations) {
        rec.medicalData.medicationsAndRecommendations.forEach(m => {
          if (m.item) {
            const medName = m.item.trim();
            uniqueMeds.add(medName);
            medsMap[medName] = {
              item: medName,
              dosage: m.dosageOrInstructions,
              purpose: m.purpose
            };
          }
        });
      }
      if (rec.medicalData.findings) {
        rec.medicalData.findings.forEach(f => {
          if (f.parameter) {
            const fName = f.parameter.trim();
            uniqueFindings.add(fName);
            findingsMap[fName] = {
              parameter: fName,
              value: f.value,
              status: f.status || "NORMAL"
            };
          }
        });
      }
    });

    // C. Diagnosis Nodes
    uniqueDiagnoses.forEach(diag => {
      const diagId = `NODE-DIAG-${diag.replace(/\s+/g, "-")}`;
      nodes.push({
        id: diagId,
        label: diag,
        type: "DIAGNOSIS"
      });
      edges.push({
        source: patientNodeId,
        target: diagId,
        relationship: "DIAGNOSED_WITH"
      });
    });

    // D. Conditional Follow-up Nodes (drugs / lab tests based on active clinical user role)
    const showDrugs = expertise === "PHARMACIST" || expertise === "MD_PRACTITIONER" || expertise === "RESEARCHER";
    const showLabs = expertise === "PATHOLOGIST" || expertise === "MD_PRACTITIONER" || expertise === "RESEARCHER";

    if (showDrugs) {
      uniqueMeds.forEach(med => {
        const medId = `NODE-MED-${med.replace(/\s+/g, "-")}`;
        const medInfo = medsMap[med];
        nodes.push({
          id: medId,
          label: med,
          val: medInfo.dosage,
          type: "MEDICATION"
        });

        // Link diagnosis to medications
        uniqueDiagnoses.forEach(diag => {
          const diagId = `NODE-DIAG-${diag.replace(/\s+/g, "-")}`;
          edges.push({
            source: diagId,
            target: medId,
            relationship: "TREATMENT_DRUG"
          });
        });
      });
    }

    if (showLabs) {
      uniqueFindings.forEach(param => {
        const bioId = `NODE-BIO-${param.replace(/\s+/g, "-")}`;
        const fInfo = findingsMap[param];
        nodes.push({
          id: bioId,
          label: param,
          val: `${fInfo.value} (${fInfo.status})`,
          type: "BIOMARKER"
        });

        // Link diagnosis to biomarkers
        uniqueDiagnoses.forEach(diag => {
          const diagId = `NODE-DIAG-${diag.replace(/\s+/g, "-")}`;
          edges.push({
            source: diagId,
            target: bioId,
            relationship: "EVALUATED_BY"
          });
        });
      });
    }

    return { nodes, edges };
  }, [activeRecords, patientMeta, expertise]);

  // Layout Algorithm: Deterministic Layered Coordinates
  const arrangedNodes = useMemo(() => {
    const nodes = graphData.nodes;
    const layoutMap: { [key: string]: { x: number; y: number } } = {};

    // Layer 0: Root Patient Node (Center top)
    layoutMap["NODE-PATIENT"] = { x: 250, y: 35 };

    // Layer 1: Demographics and Visits/Records (y = 115)
    layoutMap["NODE-DEMOGRAPHIC"] = { x: 130, y: 115 };

    const recNodes = nodes.filter(n => n.type === "RECORD");
    const totalRecs = recNodes.length;
    recNodes.forEach((n, idx) => {
      const xSpan = 200;
      const xStart = 250;
      const x = totalRecs <= 1 
        ? 350 
        : xStart + (idx / (totalRecs - 1)) * xSpan;
      layoutMap[n.id] = { x, y: 115 };
    });

    // Layer 2: Diagnosis Nodes (y = 200)
    const diagNodes = nodes.filter(n => n.type === "DIAGNOSIS");
    const totalDiags = diagNodes.length;
    diagNodes.forEach((n, idx) => {
      const xSpan = 380;
      const xStart = 250 - xSpan / 2;
      const x = totalDiags <= 1 
        ? 250 
        : xStart + (idx / (totalDiags - 1)) * xSpan;
      layoutMap[n.id] = { x, y: 200 };
    });

    // Layer 3: Follow-up Nodes (y = 285)
    const followUpNodes = nodes.filter(n => n.type === "MEDICATION" || n.type === "BIOMARKER");
    const totalFollowUp = followUpNodes.length;
    followUpNodes.forEach((n, idx) => {
      const xSpan = 420;
      const xStart = 250 - xSpan / 2;
      const x = totalFollowUp <= 1 
        ? 250 
        : xStart + (idx / (totalFollowUp - 1)) * xSpan;
      const yOffset = idx % 2 === 0 ? 0 : 15;
      layoutMap[n.id] = { x, y: 285 + yOffset };
    });

    // Fallback coordinates for any remaining nodes
    nodes.forEach(n => {
      if (!layoutMap[n.id]) {
        layoutMap[n.id] = { x: 250, y: 150 };
      }
    });

    return layoutMap;
  }, [graphData, expertise]);

  // All constructed nodes are shown immediately in this reactive layout
  const visibleNodes = useMemo(() => {
    return graphData.nodes;
  }, [graphData.nodes]);

  // Active highlighted relationships when user selects a node
  const activeRelationships = useMemo(() => {
    if (!selectedNodeId) return null;

    const adjacentEdges = graphData.edges.filter(
      edge => edge.source === selectedNodeId || edge.target === selectedNodeId
    );

    const adjacentNodeIds = new Set<string>();
    adjacentNodeIds.add(selectedNodeId);
    adjacentEdges.forEach(e => {
      adjacentNodeIds.add(e.source);
      adjacentNodeIds.add(e.target);
    });

    return {
      connectedNodeIds: adjacentNodeIds,
      connectedEdges: adjacentEdges
    };
  }, [selectedNodeId, graphData]);

  // Handle click on node: Toggle selection
  const handleNodeClick = (id: string) => {
    setSelectedNodeId(prev => prev === id ? null : id);
  };

  const getStyleForNodeType = (type: string, isDimmed: boolean, isSelected: boolean) => {
    const baseClass = "transition-all duration-300 stroke-[1.5] cursor-pointer cursor-hand";
    let fill = "";
    let stroke = "";
    let size = 18;

    switch (type) {
      case "PATIENT":
        fill = "fill-stone-950";
        stroke = isSelected ? "stroke-emerald-400 stroke-[3]" : "stroke-stone-800";
        size = 22;
        break;
      case "DEMOGRAPHIC":
        fill = "fill-indigo-500";
        stroke = isSelected ? "stroke-indigo-300 stroke-[2.5]" : "stroke-indigo-700";
        size = 15;
        break;
      case "RECORD":
        fill = "fill-emerald-600";
        stroke = isSelected ? "stroke-emerald-400 stroke-[2.5]" : "stroke-emerald-700";
        size = 14;
        break;
      case "BIOMARKER":
        fill = "fill-sky-500";
        stroke = isSelected ? "stroke-sky-300 stroke-[2.5]" : "stroke-sky-600";
        size = 12;
        break;
      case "DIAGNOSIS":
        fill = "fill-amber-500";
        stroke = isSelected ? "stroke-amber-300 stroke-[2.5]" : "stroke-amber-600";
        size = 13;
        break;
      case "MEDICATION":
        fill = "fill-purple-500";
        stroke = isSelected ? "stroke-purple-300 stroke-[2.5]" : "stroke-purple-600";
        size = 13;
        break;
      case "COUNT_RX":
        fill = "fill-pink-500";
        stroke = isSelected ? "stroke-pink-300 stroke-[2.5]" : "stroke-pink-600";
        size = 14;
        break;
      case "COUNT_LAB":
        fill = "fill-teal-500";
        stroke = isSelected ? "stroke-teal-300 stroke-[2.5]" : "stroke-teal-600";
        size = 14;
        break;
    }

    const opacity = isDimmed ? "opacity-20" : "opacity-100";
    return {
      circleStyle: `${baseClass} ${fill} ${stroke} ${opacity}`,
      r: size
    };
  };

  const filteredNodes = useMemo(() => {
    if (activeFilterType === "ALL") return visibleNodes;
    return visibleNodes.filter(n => n.type === activeFilterType);
  }, [visibleNodes, activeFilterType]);

  const visibleEdges = useMemo(() => {
    const visibleIds = new Set(visibleNodes.map(n => n.id));
    return graphData.edges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));
  }, [graphData.edges, visibleNodes]);

  const selectedNodeDetails = useMemo(() => {
    if (!selectedNodeId) return null;
    return graphData.nodes.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId, graphData]);

  return (
    <div id="knowledge-graph-box" className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12 animate-fadeIn">
      
      {/* 1. SIDEBAR Controls & Active Patient Profile */}
      <div className="md:col-span-4 p-5 border-b md:border-b-0 md:border-r border-stone-200 bg-stone-50/40 flex flex-col justify-between space-y-5">
        
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <User size={13} className="text-emerald-600" />
              Active Patient Profile
            </h4>
            <p className="text-[11px] text-stone-500 font-light">
              Interactive relationship pathways mapped dynamically for the synchronized clinical dossier.
            </p>
          </div>

          {/* Active Patient Info Card */}
          <div className="bg-white border border-stone-200 rounded-xl p-3.5 space-y-2 shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
              <span className="font-semibold text-xs text-stone-900 block truncate">
                {patientMeta.name}
              </span>
            </div>
            <div className="text-[10px] text-stone-500 space-y-1.5 font-light pt-0.5 border-t border-stone-100">
              <p className="flex items-center justify-between">
                <span className="font-medium text-stone-400 font-mono text-[9.5px]">GENDER</span>
                <span className="text-stone-700 font-medium">{patientMeta.gender}</span>
              </p>
              <p className="flex items-center justify-between gap-4">
                <span className="font-medium text-stone-400 font-mono text-[9.5px]">FACILITY</span>
                <span className="text-stone-700 font-medium truncate max-w-[130px]">{patientMeta.facility}</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="font-medium text-stone-400 font-mono text-[9.5px]">STATUS</span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">{patientMeta.status}</span>
              </p>
            </div>
          </div>

          {/* Node Category Toggles */}
          <div className="space-y-1.5 pt-2 border-t border-stone-150">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-semibold block">
              Node Visibility Filters
            </span>
            <div className="grid grid-cols-2 gap-1 font-mono text-[9px]">
              {[
                { label: "Patient", type: "PATIENT", color: "bg-stone-900" },
                { label: "Demographics", type: "DEMOGRAPHIC", color: "bg-indigo-500" },
                { label: "Biomarkers", type: "BIOMARKER", color: "bg-sky-500" },
                { label: "Impressions", type: "DIAGNOSIS", color: "bg-amber-500" },
                { label: "Therapeutics", type: "MEDICATION", color: "bg-purple-500" }
              ].map((filter) => {
                // If it's a role that doesn't have certain types, hide filters
                if (filter.type === "DEMOGRAPHIC" && expertise !== "PATIENT" && expertise !== "MD_PRACTITIONER") return null;
                if (filter.type === "BIOMARKER" && expertise === "PHARMACIST") return null;
                if (filter.type === "MEDICATION" && expertise === "PATHOLOGIST") return null;

                return (
                  <button
                    key={filter.type}
                    onClick={() => setActiveFilterType(prev => prev === filter.type ? "ALL" : filter.type)}
                    className={`px-2 py-1 border rounded-md flex items-center gap-1 cursor-pointer truncate ${
                      activeFilterType === filter.type 
                        ? "border-stone-900 bg-stone-100 font-semibold text-stone-950" 
                        : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${filter.color}`} />
                    {filter.label}
                  </button>
                );
              })}
              {activeFilterType !== "ALL" && (
                <button
                  onClick={() => setActiveFilterType("ALL")}
                  className="px-2 py-1 border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 rounded-md text-center cursor-pointer font-bold col-span-2"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Selected Node Drawer / Info Card */}
        <div className="bg-white border border-stone-200 rounded-xl p-3.5 space-y-2 pb-4">
          {selectedNodeDetails ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-stone-100 pb-1.5 mb-1.5">
                <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400 font-bold block">
                  Interactive Node walk
                </span>
                <button 
                  onClick={() => setSelectedNodeId(null)}
                  className="text-stone-400 hover:text-stone-900 text-[10px] font-mono cursor-pointer"
                >
                  Deselect
                </button>
              </div>

              <div className="space-y-1">
                <span className={`inline-block px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold uppercase tracking-wider ${
                  selectedNodeDetails.type === "PATIENT" ? "bg-stone-950 text-white" :
                  selectedNodeDetails.type === "DEMOGRAPHIC" ? "bg-indigo-50 text-indigo-800 border border-indigo-150" :
                  selectedNodeDetails.type === "RECORD" ? "bg-emerald-50 text-emerald-800 border border-emerald-150" :
                  selectedNodeDetails.type === "BIOMARKER" ? "bg-sky-50 text-sky-800 border border-sky-150" :
                  selectedNodeDetails.type === "DIAGNOSIS" ? "bg-amber-50 text-amber-800 border border-amber-150" :
                  selectedNodeDetails.type === "COUNT_RX" ? "bg-pink-50 text-pink-800 border border-pink-150" :
                  selectedNodeDetails.type === "COUNT_LAB" ? "bg-teal-50 text-teal-800 border border-teal-150" :
                  "bg-purple-50 text-purple-800 border border-purple-150"
                }`}>
                  {selectedNodeDetails.type.replace("_", " ")}
                </span>
                <p className="text-sm font-semibold text-stone-900 leading-tight">
                  {selectedNodeDetails.label}
                </p>
                {selectedNodeDetails.val && (
                  <p className="text-xs font-mono text-stone-500 font-light">
                    {selectedNodeDetails.val}
                  </p>
                )}
                {selectedNodeDetails.date && (
                  <p className="text-xs text-stone-400 font-light">
                    Annotated At: {selectedNodeDetails.date}
                  </p>
                )}
              </div>

              {/* VIEW GRAPH ON CLICK (Option to click to have graph for longitudinal changes) */}
              {onViewTrend && selectedNodeDetails.type === "BIOMARKER" && (
                <button
                  onClick={() => onViewTrend(selectedNodeDetails.label)}
                  className="w-full mt-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 shadow-sm cursor-pointer transition-all"
                >
                  <ChartIcon size={12} />
                  View Longitudinal Trend
                </button>
              )}

              {onViewTrend && selectedNodeDetails.type === "MEDICATION" && (
                <button
                  onClick={() => onViewTrend(`💊 ${selectedNodeDetails.label}`)}
                  className="w-full mt-2 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 shadow-sm cursor-pointer transition-all"
                >
                  <Pill size={12} />
                  View Refill Timeline
                </button>
              )}

              {activeRelationships && activeRelationships.connectedEdges.length > 0 && (
                <div className="pt-2 border-t border-stone-100 space-y-1">
                  <span className="text-[9px] font-mono text-stone-400">DIRECT RELATIONSHIPS ({activeRelationships.connectedEdges.length})</span>
                  <div className="space-y-1.5 max-h-[110px] overflow-y-auto">
                    {activeRelationships.connectedEdges.map((edge, idx) => {
                      const isSource = edge.source === selectedNodeId;
                      const partnerNodeId = isSource ? edge.target : edge.source;
                      const partnerNode = graphData.nodes.find(n => n.id === partnerNodeId);
                      
                      return (
                        <div key={idx} className="bg-stone-50 p-1.5 rounded text-[10.5px] border border-stone-150 flex items-center justify-between gap-1 leading-normal">
                          <span className="text-stone-400 shrink-0 uppercase font-mono text-[8px] font-bold">
                            {isSource ? "Out ➔" : "In ➔"}
                          </span>
                          <span className="font-semibold px-1 rounded bg-stone-200/50 text-stone-700 italic font-mono text-[8.5px]">
                            {edge.relationship}
                          </span>
                          <span className="font-medium text-stone-850 truncate max-w-[90px]" title={partnerNode?.label}>
                            {partnerNode?.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-5 text-stone-400 text-xs font-light flex flex-col items-center justify-center space-y-1">
              <Network size={16} className="text-stone-300 stroke-[1.5]" />
              <p>Click on any node in the canvas. Demographics and downstream clinical findings will cascade sequentially!</p>
            </div>
          )}
        </div>

      </div>

      {/* 2. MAIN SVG GRAPH CANVAS */}
      <div className="md:col-span-8 relative min-h-[460px] bg-stone-950 text-white overflow-hidden p-3 flex flex-col justify-between">
        
        {/* Graph Header details overlay */}
        <div className="absolute top-4 left-4 z-10 space-y-1 bg-stone-900/90 backdrop-blur border border-stone-800 p-3.5 rounded-xl pointer-events-none shadow-md max-w-[260px] sm:max-w-[320px]">
          <div className="flex items-center gap-1.5 justify-between">
            <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1 leading-none">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Knowledge Graph
            </p>
            {expertise && (
              <span className="text-[8.5px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded">
                {expertise === "PATIENT" ? "LAYMAN" : expertise.replace("_", " ")}
              </span>
            )}
          </div>
          <h3 className="text-xs font-serif font-semibold text-stone-200 pt-0.5">
            {patientMeta.name} Relations Network
          </h3>
          <p className="text-[9.5px] text-stone-400 font-mono font-light">
            Nodes Visible: {visibleNodes.length} / {graphData.nodes.length} | Edges: {visibleEdges.length}
          </p>
          {expertise && (
            <div className="pt-1.5 mt-1 border-t border-stone-850 text-[9px] text-stone-400 font-sans leading-tight">
              <span className="font-semibold text-emerald-500 flex items-center gap-1">
                <Sparkles size={8} /> Layout Schema:
              </span>
              <p className="italic mt-0.5">
                {expertise === "PATIENT" && "Patient -> Demographic -> Symptoms/Diagnosis -> Rx/Lab counts."}
                {expertise === "MD_PRACTITIONER" && "Patient -> Demographic -> Symptoms/Diagnosis -> Rx/Lab counts."}
                {expertise === "PHARMACIST" && "Patient -> Disease/Diagnosis -> Drugs & Refills."}
                {expertise === "PATHOLOGIST" && "Patient -> Disease/Diagnosis -> Lab Work Category."}
                {expertise === "RESEARCHER" && "Cohort phenotypic LOINC/SNOMED indexing active."}
              </p>
            </div>
          )}
        </div>

        {/* Legend block overlay */}
        <div className="absolute bottom-4 left-4 z-10 bg-stone-900/80 backdrop-blur border border-stone-800 p-2.5 rounded-xl text-[9px] font-mono text-stone-400 flex flex-wrap gap-2 pointer-events-none shadow-sm max-w-[280px] sm:max-w-none">
          <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white" /> Patient</div>
          {(expertise === "PATIENT" || expertise === "MD_PRACTITIONER") && (
            <>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Demographics</div>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Symptoms/Diagnosis</div>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-pink-500" /> Prescriptions</div>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Lab Tests</div>
            </>
          )}
          {expertise === "PHARMACIST" && (
            <>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Disease</div>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Drug</div>
            </>
          )}
          {expertise === "PATHOLOGIST" && (
            <>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Disease</div>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Lab Category</div>
            </>
          )}
          {expertise === "RESEARCHER" && (
            <>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Records</div>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Biomarkers</div>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Impressions</div>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Therapeutics</div>
            </>
          )}
        </div>

        {activeRecords.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 shrink-0">
            <div className="p-3 bg-stone-900 text-stone-500 rounded-full border border-stone-800">
              <Network size={24} className="stroke-[1.3] animate-pulse" />
            </div>
            <div className="max-w-xs">
              <p className="text-xs font-semibold text-stone-200">Awaiting Submissions</p>
              <p className="text-[10px] text-stone-500 mt-1 leading-normal font-light">
                Please submit clinical files or consult simulated cohorts to activate the knowledge relation diagram node pathways.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 w-full relative">
            
            <svg 
              className="w-full h-full min-h-[420px]" 
              viewBox="0 0 500 380"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* SVG Edge connections Lines */}
              {visibleEdges.map((edge, index) => {
                const sourcePos = arrangedNodes[edge.source];
                const targetPos = arrangedNodes[edge.target];

                if (!sourcePos || !targetPos) return null;

                // Check active highlighting state
                const isSelectedState = selectedNodeId !== null;
                const isEdgeActive = isSelectedState && 
                  (edge.source === selectedNodeId || edge.target === selectedNodeId);
                
                let strokeColor = "#333231"; // dark gray inactive edge
                let strokeWidth = "1";
                let dashArray = "3 3";

                if (isEdgeActive) {
                  strokeColor = "#10b981"; // vibrant green active edge connection
                  strokeWidth = "2.2";
                  dashArray = "0"; // solid active edge connection
                } else if (isSelectedState) {
                  strokeColor = "#1a1817"; // highly faded during passive state
                  strokeWidth = "0.5";
                }

                return (
                  <g key={index}>
                    <line
                      x1={sourcePos.x}
                      y1={sourcePos.y}
                      x2={targetPos.x}
                      y2={targetPos.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={dashArray}
                      className="transition-all duration-300"
                    />
                    
                    {/* Render minor text details directly on hovered active edge */}
                    {isEdgeActive && (
                      <g className="pointer-events-none">
                        <rect
                          x={(sourcePos.x + targetPos.x)/2 - 40}
                          y={(sourcePos.y + targetPos.y)/2 - 7}
                          width="80"
                          height="14"
                          align="center"
                          rx="4"
                          fill="#181716"
                          stroke="#10b981"
                          strokeWidth="0.5"
                        />
                        <text
                          x={(sourcePos.x + targetPos.x)/2}
                          y={(sourcePos.y + targetPos.y)/2 + 3}
                          textAnchor="middle"
                          fill="#10b981"
                          className="font-mono text-[7px] font-bold tracking-tight text-center"
                        >
                          {edge.relationship.length > 18 ? `${edge.relationship.substring(0,16)}..` : edge.relationship}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* SVG Nodes */}
              {filteredNodes.map((node) => {
                const pos = arrangedNodes[node.id];
                if (!pos) return null;

                // Highlight/dim logic
                const isSelected = selectedNodeId === node.id;
                const isDimmed = selectedNodeId !== null && 
                  activeRelationships !== null && 
                  !activeRelationships.connectedNodeIds.has(node.id);

                const { circleStyle, r } = getStyleForNodeType(node.type, isDimmed, isSelected);

                return (
                  <g 
                    key={node.id} 
                    transform={`translate(${pos.x},${pos.y})`}
                    onClick={() => handleNodeClick(node.id)}
                    className="group"
                  >
                    {/* Subtle outer glow ring on selection or active type */}
                    {isSelected && (
                      <circle
                        r={r + 6}
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="1.2"
                        strokeDasharray="2 2"
                        className="animate-spin-slow origin-center"
                        style={{ transformOrigin: "0 0" }}
                      />
                    )}

                    {/* Base Node circle sphere */}
                    <circle
                      r={r}
                      className={circleStyle}
                    />

                    {/* Node content visual icons overlay */}
                    <g 
                      className={`pointer-events-none ${isDimmed ? "opacity-20" : "opacity-100"}`}
                      transform="translate(-6, -6)"
                    >
                      {node.type === "PATIENT" && (
                        <path d="M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1ZM1 13a5 5 0 0 1 10 0Z" fill="#ffffff" transform="scale(0.85)" />
                      )}
                      {node.type === "RECORD" && (
                        <path d="M3 1h6a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Z" fill="#ffffff" transform="scale(0.8)" className="stroke-[1]" />
                      )}
                    </g>

                    {/* Readable Text label below/above nodes */}
                    <g className="cursor-pointer">
                      {/* background card for absolute readability on black map */}
                      <rect
                        y={r + 4}
                        x={-45}
                        width={90}
                        height={12}
                        rx="3"
                        fill="#0c0a09"
                        fillOpacity="0.8"
                        stroke={isSelected ? "#10b981" : "transparent"}
                        strokeWidth="0.5"
                        className={`transition-all ${isDimmed ? "opacity-20" : "opacity-100"}`}
                      />
                      <text
                        y={r + 12}
                        textAnchor="middle"
                        fill={isSelected ? "#34d399" : "#e7e5e4"}
                        className={`text-[8px] font-mono leading-none font-medium truncate ${
                          isDimmed ? "opacity-20" : "opacity-100"
                        }`}
                        style={{ pointerEvents: "none" }}
                      >
                        {node.label.length > 15 ? `${node.label.substring(0, 13)}..` : node.label}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* Micro instruction badge overlay */}
            <div className="absolute right-4 top-4 bg-stone-900/40 backdrop-blur border border-stone-800 rounded-lg px-2 py-1 text-[8.5px] font-mono text-stone-400 font-light pointer-events-none">
              Click any node to expand clinical paths and trace details
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
