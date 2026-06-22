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
  CheckCircle2
} from "lucide-react";
import { HistoricalRecord, MedicalData } from "../types";

interface ClinicalKnowledgeGraphProps {
  records: HistoricalRecord[];
  expertise?: string;
}

interface GraphNode {
  id: string;
  label: string;
  type: "PATIENT" | "RECORD" | "BIOMARKER" | "DIAGNOSIS" | "MEDICATION";
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

export default function ClinicalKnowledgeGraph({ records, expertise }: ClinicalKnowledgeGraphProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>("active");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeFilterType, setActiveFilterType] = useState<string>("ALL");

  // Determine active dataset (either user uploads or simulated cohort samples)
  const activeRecords = useMemo(() => {
    if (selectedPatientId === "active") return records;
    const match = SIMULATED_PATIENTS.find(p => p.id === selectedPatientId);
    return match?.records || [];
  }, [selectedPatientId, records]);

  const patientMeta = useMemo(() => {
    if (selectedPatientId === "active") {
      const activeName = records[0]?.medicalData.patientName || "Primary Subject (Active Profile)";
      return {
        name: activeName,
        birth: "Decentralized File Sync",
        gender: records[0]?.medicalData.patientGender || "Omitted",
        facility: records[0]?.medicalData.facilityName || "Primary Portal Care",
        status: records.length > 0 ? "Tracking Synchronized" : "Awaiting Submissions",
      };
    }
    return SIMULATED_PATIENTS.find(p => p.id === selectedPatientId) || SIMULATED_PATIENTS[0];
  }, [selectedPatientId, records]);

  // Construct structured Nodes and Edges from patient chronological files!
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // 1. Root Patient Node
    const patientNodeId = "NODE-PATIENT";
    nodes.push({
      id: patientNodeId,
      label: patientMeta.name,
      type: "PATIENT"
    });

    // Track duplicates to merge points into clean clusters
    const seenBiomarkers = new Set<string>();
    const seenDiagnoses = new Set<string>();
    const seenMedications = new Set<string>();

    // 2. Add each date/Report record node and branch out connections
    const sortedRecords = [...activeRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedRecords.forEach((rec, rIdx) => {
      const recDateId = `NODE-REC-${rec.id}`;
      nodes.push({
        id: recDateId,
        label: rec.medicalData.documentType || `Study on ${rec.date}`,
        val: rec.date,
        type: "RECORD",
        sourceRecordId: rec.id
      });

      // Connect Patient -> [has_record] -> Record Date Node
      edges.push({
        source: patientNodeId,
        target: recDateId,
        relationship: "HAS_RECORD"
      });

      // Connect diagnostic biomarkers findings
      if (rec.medicalData.findings) {
        rec.medicalData.findings.forEach((finding, fIdx) => {
          const paramName = finding.parameter || "";
          if (!paramName) return;

          const bioNodeId = `NODE-BIO-${paramName.replace(/\s+/g, "-")}`;
          
          if (!seenBiomarkers.has(bioNodeId)) {
            nodes.push({
              id: bioNodeId,
              label: paramName,
              val: `${finding.value} (${finding.status})`,
              type: "BIOMARKER",
              sourceRecordId: rec.id
            });
            seenBiomarkers.add(bioNodeId);
          }

          // Edge: Record -> [measured] -> Biomarker Node
          edges.push({
            source: recDateId,
            target: bioNodeId,
            relationship: `MEASURED (${finding.value})`
          });
        });
      }

      // Connect impressions / diagnosed conditions
      if (rec.medicalData.diagnoses) {
        rec.medicalData.diagnoses.forEach((diag, dIdx) => {
          const diagNodeId = `NODE-DIAG-${diag.replace(/\s+/g, "-")}`;
          
          if (!seenDiagnoses.has(diagNodeId)) {
            nodes.push({
              id: diagNodeId,
              label: diag,
              type: "DIAGNOSIS",
              sourceRecordId: rec.id
            });
            seenDiagnoses.add(diagNodeId);
          }

          // Edge: Record -> [documents] -> Clinical Impression Node
          edges.push({
            source: recDateId,
            target: diagNodeId,
            relationship: "CONFIRMED_CASE"
          });

          // Edge from biomarkers to relevant diagnoses if they co-exist
          if (rec.medicalData.findings) {
            rec.medicalData.findings.forEach((f) => {
              if (["HIGH", "LOW", "ABNORMAL"].includes((f.status || "").toUpperCase())) {
                const bioNodeId = `NODE-BIO-${f.parameter.replace(/\s+/g, "-")}`;
                edges.push({
                  source: bioNodeId,
                  target: diagNodeId,
                  relationship: "INDICATES"
                });
              }
            });
          }
        });
      }

      // Connect therapeutic recommendations
      if (rec.medicalData.medicationsAndRecommendations) {
        rec.medicalData.medicationsAndRecommendations.forEach((med, mIdx) => {
          const medName = med.item || "";
          if (!medName) return;

          const medNodeId = `NODE-MED-${medName.replace(/\s+/g, "-")}`;

          if (!seenMedications.has(medNodeId)) {
            nodes.push({
              id: medNodeId,
              label: medName,
              val: med.dosageOrInstructions,
              type: "MEDICATION",
              sourceRecordId: rec.id
            });
            seenMedications.add(medNodeId);
          }

          // Edge: Record or Diagnosis -> [prescribed] -> Intervention Node
          edges.push({
            source: recDateId,
            target: medNodeId,
            relationship: "THERAPY_PLAN"
          });
        });
      }
    });

    return { nodes, edges };
  }, [activeRecords, patientMeta]);

  // Layout Algorithm: Deterministic Orbital arrangement for stunning layout structure & clarity
  const arrangedNodes = useMemo(() => {
    const nodes = graphData.nodes;
    const center = { x: 250, y: 190 }; // Root Patient Center

    // Separate nodes by layers to assign orbits
    const recordNodes = nodes.filter(n => n.type === "RECORD");
    const biomarkerNodes = nodes.filter(n => n.type === "BIOMARKER");
    const diagnosisNodes = nodes.filter(n => n.type === "DIAGNOSIS");
    const medicationNodes = nodes.filter(n => n.type === "MEDICATION");

    const layoutMap: { [key: string]: { x: number; y: number } } = {};

    // Patient Node (Root Center)
    layoutMap["NODE-PATIENT"] = { x: center.x, y: center.y };

    // Orbit 1: Medical Records (Closer orbit, d = 75px)
    recordNodes.forEach((n, idx) => {
      const total = recordNodes.length;
      const angle = total === 1 ? -Math.PI / 2 : (idx / total) * 2 * Math.PI - Math.PI / 2;
      const d = 72;
      layoutMap[n.id] = {
        x: center.x + d * Math.cos(angle),
        y: center.y + d * Math.sin(angle)
      };
    });

    // Orbit 2: Biomarkers (Middle orbit, d = 145px)
    biomarkerNodes.forEach((n, idx) => {
      const total = biomarkerNodes.length;
      const angle = (idx / total) * 2 * Math.PI;
      const d = 138;
      layoutMap[n.id] = {
        x: center.x + d * Math.cos(angle),
        y: center.y + d * Math.sin(angle)
      };
    });

    // Orbit 3: Diagnoses & Conditions (Outer orbit Left hemisphere, d = 210px)
    diagnosisNodes.forEach((n, idx) => {
      const total = diagnosisNodes.length;
      const angle = Math.PI/2 + (idx / Math.max(1, total)) * Math.PI; // Arrange on Left-semi circle
      const d = 205;
      layoutMap[n.id] = {
        x: center.x + d * Math.cos(angle),
        y: center.y + d * Math.sin(angle)
      };
    });

    // Orbit 3: Therapeutics & Medications (Outer orbit Right hemisphere, d = 210px)
    medicationNodes.forEach((n, idx) => {
      const total = medicationNodes.length;
      const angle = -Math.PI/2 + (idx / Math.max(1, total)) * Math.PI; // Arrange on Right-semi circle
      const d = 205;
      layoutMap[n.id] = {
        x: center.x + d * Math.cos(angle),
        y: center.y + d * Math.sin(angle)
      };
    });

    return layoutMap;
  }, [graphData, patientMeta]);

  // Determine active highlighted connections if user clicks on a particular node
  const activeRelationships = useMemo(() => {
    if (!selectedNodeId) return null;

    // Filter edges connected directly to this selected node
    const adjacentEdges = graphData.edges.filter(
      edge => edge.source === selectedNodeId || edge.target === selectedNodeId
    );

    // Get all connected nodes
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

  // Handle click on node
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
      case "RECORD":
        fill = "fill-emerald-600";
        stroke = isSelected ? "stroke-emerald-400 stroke-[2.5]" : (expertise === "RESEARCHER" ? "stroke-emerald-400 stroke-2" : "stroke-emerald-700");
        size = expertise === "RESEARCHER" ? 16 : 14;
        break;
      case "BIOMARKER":
        fill = "fill-sky-500";
        stroke = isSelected ? "stroke-sky-300 stroke-[2.5]" : (expertise === "PATHOLOGIST" ? "stroke-sky-300 stroke-2 animate-pulse" : "stroke-sky-600");
        size = expertise === "PATHOLOGIST" ? 13 : 11;
        break;
      case "DIAGNOSIS":
        fill = "fill-amber-500";
        stroke = isSelected ? "stroke-amber-300 stroke-[2.5]" : (expertise === "MD_PRACTITIONER" ? "stroke-amber-300 stroke-2" : "stroke-amber-600");
        size = expertise === "MD_PRACTITIONER" ? 14 : 12;
        break;
      case "MEDICATION":
        fill = "fill-purple-500";
        stroke = isSelected ? "stroke-purple-300 stroke-[2.5]" : (expertise === "PHARMACIST" ? "stroke-purple-300 stroke-2" : "stroke-purple-600");
        size = expertise === "PHARMACIST" ? 14 : 12;
        break;
    }

    const opacity = isDimmed ? "opacity-20" : "opacity-100";
    return {
      circleStyle: `${baseClass} ${fill} ${stroke} ${opacity}`,
      r: size
    };
  };

  const filteredNodes = useMemo(() => {
    if (activeFilterType === "ALL") return graphData.nodes;
    return graphData.nodes.filter(n => n.type === activeFilterType);
  }, [graphData, activeFilterType]);

  const selectedNodeDetails = useMemo(() => {
    if (!selectedNodeId) return null;
    return graphData.nodes.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId, graphData]);

  return (
    <div id="knowledge-graph-box" className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12">
      
      {/* 1. SIDEBAR Controls & Cohort Registry (EHR Biobank Directory) */}
      <div className="md:col-span-4 p-5 border-b md:border-b-0 md:border-r border-stone-200 bg-stone-50/40 flex flex-col justify-between space-y-5">
        
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <Database size={13} className="text-emerald-600" />
              Patient Biobank Registry
            </h4>
            <p className="text-[11px] text-stone-500 font-light">
              Select patient metadata logs to map distinct dynamic health relation pathways in our federated schema.
            </p>
          </div>

          {/* Active Selector buttons */}
          <div className="space-y-2">
            {SIMULATED_PATIENTS.map((p) => {
              const isSelected = selectedPatientId === p.id;
              // Override active patient template labeled
              const labelName = p.id === "active" ? patientMeta.name : p.name;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPatientId(p.id);
                    setSelectedNodeId(null);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border-emerald-500 text-stone-950 shadow-[0_2px_8px_rgba(16,185,129,0.06)] ring-1 ring-emerald-500/30"
                      : "bg-white/50 border-stone-200 text-stone-600 hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold block truncate max-w-[190px]">
                      {labelName}
                    </span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                    )}
                  </div>
                  <span className="block text-[10px] text-stone-400 font-light mt-0.5">
                    {p.gender} • {p.facility}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Node Category Toggles */}
          <div className="space-y-1.5 pt-2 border-t border-stone-150">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-semibold block">
              Node Visibility Filters
            </span>
            <div className="grid grid-cols-2 gap-1 font-mono text-[9px]">
              {[
                { label: "Patient", type: "PATIENT", color: "bg-stone-900" },
                { label: "Records", type: "RECORD", color: "bg-emerald-600" },
                { label: "Biomarkers", type: "BIOMARKER", color: "bg-sky-500" },
                { label: "Impressions", type: "DIAGNOSIS", color: "bg-amber-500" },
                { label: "Therapeutics", type: "MEDICATION", color: "bg-purple-500" }
              ].map((filter) => (
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
              ))}
              {activeFilterType !== "ALL" && (
                <button
                  onClick={() => setActiveFilterType("ALL")}
                  className="px-2 py-1 border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 rounded-md text-center cursor-pointer font-bold"
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
                  selectedNodeDetails.type === "RECORD" ? "bg-emerald-50 text-emerald-800 border border-emerald-150" :
                  selectedNodeDetails.type === "BIOMARKER" ? "bg-sky-50 text-sky-800 border border-sky-150" :
                  selectedNodeDetails.type === "DIAGNOSIS" ? "bg-amber-50 text-amber-800 border border-amber-150" :
                  "bg-purple-50 text-purple-800 border border-purple-150"
                }`}>
                  {selectedNodeDetails.type}
                </span>
                <p className="text-sm font-semibold text-stone-900 leading-tight">
                  {selectedNodeDetails.label}
                </p>
                {selectedNodeDetails.val && (
                  <p className="text-xs font-mono text-stone-500 font-light truncate">
                    Value/Metrics: {selectedNodeDetails.val}
                  </p>
                )}
                {selectedNodeDetails.date && (
                  <p className="text-xs text-stone-400 font-light">
                    Annotated At: {selectedNodeDetails.date}
                  </p>
                )}
              </div>

              {activeRelationships && (
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
              <p>Select any node in the SVG canvas network diagram on the right to walk health pathways and relationship edges.</p>
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
                {expertise}
              </span>
            )}
          </div>
          <h3 className="text-xs font-serif font-semibold text-stone-200 pt-0.5">
            {patientMeta.name} Relations Network
          </h3>
          <p className="text-[9.5px] text-stone-400 font-mono font-light">
            Nodes: {graphData.nodes.length} | Edges: {graphData.edges.length}
          </p>
          {expertise && (
            <div className="pt-1.5 mt-1 border-t border-stone-850 text-[9px] text-stone-400 font-sans leading-tight">
              <span className="font-semibold text-emerald-500 flex items-center gap-1">
                <Sparkles size={8} /> Focus Folder Sync:
              </span>
              <p className="italic mt-0.5">
                {expertise === "PATIENT" && "Layman translation & patient adherence ruleset triggered."}
                {expertise === "MD_PRACTITIONER" && "Differential diagnostics & cardiovascular staging guidelines folder active."}
                {expertise === "PHARMACIST" && "CYP metabolic path + pharmacokinetics folder active."}
                {expertise === "PATHOLOGIST" && "Cell staining + fluid chemical thresholds folder active."}
                {expertise === "RESEARCHER" && "Cohort phenotypic LOINC/SNOMED indexing folder active."}
              </p>
            </div>
          )}
        </div>

        {/* Legend block overlay */}
        <div className="absolute bottom-4 left-4 z-10 bg-stone-900/80 backdrop-blur border border-stone-800 p-2.5 rounded-xl text-[9px] font-mono text-stone-400 flex flex-wrap gap-2 pointer-events-none shadow-sm max-w-[280px] sm:max-w-none">
          <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white" /> Patient</div>
          <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Records</div>
          <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Biomarkers</div>
          <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Impressions</div>
          <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Therapeutics</div>
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
              {graphData.edges.map((edge, index) => {
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
              Click node to trace direct edge walker paths
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
