import React, { useState, useEffect, useMemo } from "react";
import { 
  Database, 
  Search, 
  User, 
  ShieldAlert, 
  ShieldCheck, 
  Network, 
  RefreshCw, 
  Info, 
  Activity, 
  ArrowRight, 
  Sparkles,
  FileText,
  AlertTriangle,
  UserCheck
} from "lucide-react";
import { HistoricalRecord } from "../types";

interface Patient {
  id: string;
  name: string;
  birth: string;
  gender: string;
  facility: string;
  status: string;
  records: HistoricalRecord[];
}

interface PatientDatabaseConsoleProps {
  currentExpertise: string;
  onLoadRecords: (patientId: string, records: HistoricalRecord[]) => void;
  activePatientId: string | null;
  setActivePatientId: (id: string | null) => void;
  historyRecords: HistoricalRecord[];
}

export default function PatientDatabaseConsole({
  currentExpertise,
  onLoadRecords,
  activePatientId,
  setActivePatientId,
  historyRecords
}: PatientDatabaseConsoleProps) {
  const [searchId, setSearchId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSuccess, setSearchSuccess] = useState<string | null>(null);
  const [selectedDbNode, setSelectedDbNode] = useState<string | null>(null);

  // Load the full patients list with their linked diagnoses for the knowledge network figure
  const fetchPatientsList = async () => {
    setIsLoadingPatients(true);
    try {
      const res = await fetch(`/api/patients?expertise=${currentExpertise}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPatients(data.patients || []);
        }
      }
    } catch (e) {
      console.error("Failed to fetch patient database index:", e);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  useEffect(() => {
    fetchPatientsList();
  }, [currentExpertise, historyRecords]); // reload when role changes or new records are saved

  // Determine current active patient details if loaded
  const currentLoadedPatient = useMemo(() => {
    if (!activePatientId) return null;
    return patients.find(p => p.id === activePatientId) || null;
  }, [activePatientId, patients]);

  // Handle patient retrieval
  const handleRetrievePatient = async (idToSearch: string) => {
    if (!idToSearch.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    setSearchSuccess(null);

    try {
      const trimmedId = idToSearch.trim();
      const res = await fetch(`/api/patient/${trimmedId}?expertise=${currentExpertise}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "The patient database query failed.");
      }

      if (data.exists) {
        onLoadRecords(data.patient.id, data.patient.records || []);
        setActivePatientId(data.patient.id);
        setSearchId(data.patient.id);
        
        // Let's check if the ID is masked due to policy
        const isMasked = data.patient.id.includes("****");
        setSearchSuccess(
          `Dossier history successfully retrieved. Loaded ${data.patient.records?.length || 0} previous report entries ${
            isMasked ? "(Anonymized Patient Profile loaded under security protocol)" : ""
          }.`
        );
      } else {
        // If user is new, it means no data yet
        onLoadRecords(trimmedId, []);
        setActivePatientId(trimmedId);
        setSearchSuccess(
          `Patient ID "${trimmedId}" is brand new. No pre-existing clinical dossiers found. Any new processed dossiers will be securely saved under this ID.`
        );
      }
      fetchPatientsList();
    } catch (err: any) {
      setSearchError(err.message || "An unexpected error occurred while looking up patient dossier.");
    } finally {
      setIsSearching(false);
    }
  };

  // Construct a database-wide relation graph mapping patients to their diagnostic criteria & clinical findings
  const databaseGraph = useMemo(() => {
    const nodes: Array<{ id: string; label: string; type: "PATIENT" | "CONDITION" | "FACILITY"; patientId?: string }> = [];
    const edges: Array<{ source: string; target: string; type: string }> = [];

    const seenConditions = new Set<string>();
    const seenFacilities = new Set<string>();

    patients.forEach((p) => {
      // 1. Patient Node
      nodes.push({
        id: `db-pat-${p.id}`,
        label: p.name,
        type: "PATIENT",
        patientId: p.id
      });

      // 2. Facility Node
      if (p.facility) {
        const facId = `db-fac-${p.facility.replace(/\s+/g, "-")}`;
        if (!seenFacilities.has(facId)) {
          nodes.push({
            id: facId,
            label: p.facility,
            type: "FACILITY"
          });
          seenFacilities.add(facId);
        }
        edges.push({
          source: `db-pat-${p.id}`,
          target: facId,
          type: "LOCATED_AT"
        });
      }

      // Collect diagnoses from records
      if (p.records && Array.isArray(p.records)) {
        p.records.forEach((rec) => {
          if (rec.medicalData && Array.isArray(rec.medicalData.diagnoses)) {
            rec.medicalData.diagnoses.forEach((diag) => {
              const diagId = `db-diag-${diag.replace(/\s+/g, "-")}`;
              if (!seenConditions.has(diagId)) {
                nodes.push({
                  id: diagId,
                  label: diag,
                  type: "CONDITION"
                });
                seenConditions.add(diagId);
              }
              // Edge: Patient -> HAS_CONDITION -> Condition
              edges.push({
                source: `db-pat-${p.id}`,
                target: diagId,
                type: "DIAGNOSED_WITH"
              });
            });
          }
        });
      }
    });

    return { nodes, edges };
  }, [patients]);

  // Layout calculations for Database Graph Figure (Deterministic Circular arrangement)
  const dbGraphCoordinates = useMemo(() => {
    const coords: { [key: string]: { x: number; y: number } } = {};
    const center = { x: 250, y: 150 };

    const patientsNodes = databaseGraph.nodes.filter(n => n.type === "PATIENT");
    const conditionNodes = databaseGraph.nodes.filter(n => n.type === "CONDITION");
    const facilityNodes = databaseGraph.nodes.filter(n => n.type === "FACILITY");

    // Patients placed in inner circle
    patientsNodes.forEach((n, i) => {
      const angle = (i / Math.max(1, patientsNodes.length)) * 2 * Math.PI - Math.PI / 2;
      coords[n.id] = {
        x: center.x + 65 * Math.cos(angle),
        y: center.y + 65 * Math.sin(angle)
      };
    });

    // Conditions placed in outer Left hemisphere
    conditionNodes.forEach((n, i) => {
      const angle = Math.PI / 2 + (i / Math.max(1, conditionNodes.length)) * Math.PI;
      coords[n.id] = {
        x: center.x + 155 * Math.cos(angle),
        y: center.y + 115 * Math.sin(angle)
      };
    });

    // Facilities placed in outer Right hemisphere
    facilityNodes.forEach((n, i) => {
      const angle = -Math.PI / 2 + (i / Math.max(1, facilityNodes.length)) * Math.PI;
      coords[n.id] = {
        x: center.x + 155 * Math.cos(angle),
        y: center.y + 115 * Math.sin(angle)
      };
    });

    return coords;
  }, [databaseGraph]);

  // Handle click on DB node
  const handleDbNodeClick = (nodeId: string) => {
    setSelectedDbNode(prev => prev === nodeId ? null : nodeId);
    const node = databaseGraph.nodes.find(n => n.id === nodeId);
    if (node && node.type === "PATIENT" && node.patientId) {
      // Check if it's already masked (we search by raw patient ID by mapping)
      const matchedPatient = patients.find(p => p.name === node.label || p.id === node.patientId);
      if (matchedPatient) {
        handleRetrievePatient(matchedPatient.id);
      }
    }
  };

  // Mask status definitions
  const isSecurityMasked = currentExpertise === "PHARMACIST" || currentExpertise === "RESEARCHER";

  return (
    <div id="patient-database-console" className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12">
      
      {/* LEFT: Search Controls & Status Overview */}
      <div className="lg:col-span-5 p-6 border-b lg:border-b-0 lg:border-r border-stone-200 space-y-5 bg-stone-50/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-stone-900 text-white rounded-md">
              <Database size={15} className="text-emerald-400" />
            </div>
            <h3 className="font-serif text-base font-semibold text-stone-950">
              Patient Archive &amp; Verification
            </h3>
          </div>
          <p className="text-xs text-stone-500 font-light">
            Enter a Patient ID or select an existing record to retrieve previous diagnostic dossiers from our secure ledger.
          </p>
        </div>

        {/* Security / Compliance Notice Badge */}
        <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
          isSecurityMasked 
            ? "bg-amber-50/40 border-amber-200 text-amber-800" 
            : "bg-emerald-50/40 border-emerald-100 text-emerald-800"
        }`}>
          {isSecurityMasked ? (
            <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <span className="font-semibold uppercase tracking-wider text-[10px] block font-mono">
              {isSecurityMasked ? "Secondary User Access Policy Active" : "Primary Clinical Verification Granted"}
            </span>
            <p className="text-[11px] font-light text-stone-600 leading-normal">
              {isSecurityMasked 
                ? "Your current role lacks authority to see personal Patient IDs or full names. Sensitive parameters are masked." 
                : "Full primary medical/patient authority active. Patient IDs and full records are visible."}
            </p>
          </div>
        </div>

        {/* Input & Action */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center text-stone-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder={isSecurityMasked ? "pat-xxxx" : "Enter Patient ID (e.g. pat-cardio-992)"}
                className="w-full text-xs font-mono pl-9 pr-3 py-2.5 border border-stone-200 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>
            <button
              onClick={() => handleRetrievePatient(searchId)}
              disabled={isSearching || !searchId.trim()}
              className="px-4 py-2.5 bg-stone-900 hover:bg-emerald-700 disabled:bg-stone-100 disabled:text-stone-400 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {isSearching ? <RefreshCw size={12} className="animate-spin" /> : <ArrowRight size={12} />}
              Verify &amp; Sync
            </button>
          </div>

          {/* Feedback messages */}
          {searchError && (
            <div className="p-3 bg-rose-50 border border-rose-150 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-fadeIn">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <p>{searchError}</p>
            </div>
          )}
          {searchSuccess && (
            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-start gap-2 animate-fadeIn">
              <UserCheck size={14} className="shrink-0 mt-0.5 text-emerald-600" />
              <p>{searchSuccess}</p>
            </div>
          )}
        </div>

        {/* Active Patient Details Banner if loaded */}
        {activePatientId && (
          <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold block">
                Active Patient Context
              </span>
              <button 
                onClick={() => {
                  setActivePatientId(null);
                  onLoadRecords("", []);
                  setSearchId("");
                  setSearchSuccess(null);
                }}
                className="text-[10px] font-mono text-stone-400 hover:text-rose-600 transition-colors"
              >
                Unload
              </button>
            </div>
            
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-stone-850 flex items-center gap-1.5">
                <User size={13} className="text-emerald-600" />
                {currentLoadedPatient ? currentLoadedPatient.name : "New Patient Profile"}
              </h4>
              <p className="text-[11px] font-mono text-stone-500 font-light leading-none">
                Patient ID: <span className="font-semibold text-stone-700">{activePatientId}</span>
              </p>
              {currentLoadedPatient && (
                <p className="text-[11px] text-stone-400 font-light leading-normal">
                  {currentLoadedPatient.gender} • Born: {currentLoadedPatient.birth} • {currentLoadedPatient.facility}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-stone-100 flex justify-between items-center text-[10px]">
              <span className="text-stone-400 font-light">
                Ledger entries: <span className="font-semibold text-stone-700">{historyRecords.length} report(s)</span>
              </span>
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                Dossier Synced
              </span>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: SVG Database-Wide Patient Relations Map */}
      <div className="lg:col-span-7 relative bg-stone-950 p-4 text-white min-h-[300px] flex flex-col justify-between">
        
        {/* Map Headers */}
        <div className="absolute top-4 left-4 z-10 space-y-1 pointer-events-none">
          <p className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1">
            <Network size={11} />
            Ledger-Wide Knowledge Map
          </p>
          <h4 className="text-xs font-serif font-semibold text-stone-200">
            Patients &amp; Diagnostic Correlations
          </h4>
          <p className="text-[9px] text-stone-500 font-mono font-light">
            Nodes: {databaseGraph.nodes.length} | Edges: {databaseGraph.edges.length}
          </p>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 bg-stone-900/80 backdrop-blur border border-stone-800 p-2 rounded-lg text-[8.5px] font-mono text-stone-400 flex gap-2 pointer-events-none">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Patients
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Impressions
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Clinics
          </div>
        </div>

        {patients.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10 text-center space-y-2 text-stone-500">
            <RefreshCw size={18} className="animate-spin text-stone-700" />
            <p className="text-[11px] font-mono">Initializing relational ledger figure...</p>
          </div>
        ) : (
          <div className="flex-1 w-full relative pt-10">
            <svg 
              className="w-full h-full min-h-[250px]" 
              viewBox="0 0 500 300"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Edges */}
              {databaseGraph.edges.map((edge, idx) => {
                const sourcePos = dbGraphCoordinates[edge.source];
                const targetPos = dbGraphCoordinates[edge.target];
                if (!sourcePos || !targetPos) return null;

                const isSelectedState = selectedDbNode !== null;
                const isEdgeActive = isSelectedState && (edge.source === selectedDbNode || edge.target === selectedDbNode);

                let strokeColor = "#262524";
                let strokeWidth = "0.7";
                let dash = "2 2";

                if (isEdgeActive) {
                  strokeColor = "#34d399";
                  strokeWidth = "1.5";
                  dash = "0";
                } else if (isSelectedState) {
                  strokeColor = "#11100f";
                  strokeWidth = "0.3";
                }

                return (
                  <line
                    key={`db-edge-${idx}`}
                    x1={sourcePos.x}
                    y1={sourcePos.y}
                    x2={targetPos.x}
                    y2={targetPos.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dash}
                    className="transition-all duration-300 animate-fadeIn"
                  />
                );
              })}

              {/* Nodes */}
              {databaseGraph.nodes.map((node) => {
                const pos = dbGraphCoordinates[node.id];
                if (!pos) return null;

                const isSelected = selectedDbNode === node.id;
                const isDimmed = selectedDbNode !== null && selectedDbNode !== node.id && 
                  !databaseGraph.edges.some(e => 
                    (e.source === selectedDbNode && e.target === node.id) || 
                    (e.target === selectedDbNode && e.source === node.id)
                  );

                let nodeColor = "fill-emerald-400";
                let strokeColor = "stroke-emerald-800";
                let size = 9;

                if (node.type === "CONDITION") {
                  nodeColor = "fill-amber-400";
                  strokeColor = "stroke-amber-800";
                  size = 7;
                } else if (node.type === "FACILITY") {
                  nodeColor = "fill-purple-400";
                  strokeColor = "stroke-purple-800";
                  size = 7;
                }

                if (isSelected) {
                  size += 3;
                }

                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="cursor-pointer"
                    onClick={() => handleDbNodeClick(node.id)}
                  >
                    {isSelected && (
                      <circle
                        r={size + 4}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        className="animate-spin-slow"
                      />
                    )}
                    <circle
                      r={size}
                      className={`${nodeColor} ${strokeColor} stroke-[1] transition-all duration-300 ${
                        isDimmed ? "opacity-20" : "opacity-100"
                      }`}
                    />
                    
                    {/* Background rectangle for high-contrast tag rendering */}
                    <g transform="translate(0, 11)" className="pointer-events-none">
                      <rect
                        x={-35}
                        y={-6}
                        width={70}
                        height={10}
                        rx="2"
                        fill="#09090b"
                        fillOpacity="0.85"
                        stroke={isSelected ? "#10b981" : "transparent"}
                        strokeWidth="0.5"
                        className={`transition-all duration-300 ${isDimmed ? "opacity-20" : "opacity-100"}`}
                      />
                      <text
                        textAnchor="middle"
                        fill={isSelected ? "#34d399" : "#e4e4e7"}
                        className={`text-[6.5px] font-mono leading-none tracking-tight transition-all duration-300 ${
                          isDimmed ? "opacity-20" : "opacity-100"
                        }`}
                      >
                        {node.label.length > 12 ? `${node.label.substring(0, 10)}..` : node.label}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* Instruction footnote overlay */}
            <div className="absolute right-3 top-3 bg-stone-900/60 backdrop-blur border border-stone-800 rounded px-2 py-1 text-[8px] font-mono text-stone-400 pointer-events-none">
              Click patient node to quick-retrieve records
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
