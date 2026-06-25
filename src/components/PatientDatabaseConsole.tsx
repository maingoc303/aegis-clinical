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
  UserCheck,
  Check,
  Send,
  Sliders,
  Filter,
  Users
} from "lucide-react";
import { HistoricalRecord } from "../types";
import { EXPERTISE_PROFILES } from "../data/clinicalSkills";
import ClinicalKnowledgeGraph from "./ClinicalKnowledgeGraph";

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
  onExpertiseChange: (roleId: string) => void;
  onLoadRecords: (patientId: string, records: HistoricalRecord[]) => void;
  activePatientId: string | null;
  setActivePatientId: (id: string | null) => void;
  historyRecords: HistoricalRecord[];
}

export default function PatientDatabaseConsole({
  currentExpertise,
  onExpertiseChange,
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
  const [selectedCohortCondition, setSelectedCohortCondition] = useState("");

  // Cohort Chat State (Researcher Only)
  const [cohortQuery, setCohortQuery] = useState("");
  const [cohortLoading, setCohortLoading] = useState(false);
  const [cohortChat, setCohortChat] = useState<Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    inclusion?: string[];
    exclusion?: string[];
    matchedPatients?: Patient[];
  }>>([
    {
      id: "init",
      role: "assistant",
      content: "Welcome, Lead Clinical Investigator. Please enter your natural-language Cohort screening parameters (Inclusion/Exclusion criteria) below. Our engine will securely scan patient profiles in the encrypted ledger, apply security masking policies, and return matching anonymized records.",
    }
  ]);

  // Extract all unique diagnostic conditions for secondary researchers to query
  const allConditions = useMemo(() => {
    const conditionsSet = new Set<string>();
    patients.forEach(p => {
      if (p.records) {
        p.records.forEach(rec => {
          if (rec.medicalData && Array.isArray(rec.medicalData.diagnoses)) {
            rec.medicalData.diagnoses.forEach(diag => {
              conditionsSet.add(diag);
            });
          }
        });
      }
    });
    return Array.from(conditionsSet);
  }, [patients]);

  const cohortPatients = useMemo(() => {
    if (!selectedCohortCondition) return [];
    return patients.filter(p => {
      return p.records && p.records.some(rec => 
        rec.medicalData && Array.isArray(rec.medicalData.diagnoses) && rec.medicalData.diagnoses.includes(selectedCohortCondition)
      );
    });
  }, [selectedCohortCondition, patients]);

  // Load the full patients list with their linked diagnoses
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
        
        const isMasked = data.patient.id.includes("****");
        setSearchSuccess(
          `Dossier history successfully retrieved. Loaded ${data.patient.records?.length || 0} previous report entries ${
            isMasked ? "(Anonymized Patient Profile loaded under security protocol)" : ""
          }.`
        );
      } else {
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

  // Cohort Criteria Submission Handler (Researcher Chat Box)
  const handleCohortSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cohortQuery.trim() || cohortLoading) return;

    const userMsg = cohortQuery.trim();
    setCohortQuery("");
    setCohortLoading(true);

    const newUserMessage = {
      id: `msg-${Date.now()}`,
      role: "user" as const,
      content: userMsg,
    };
    setCohortChat(prev => [...prev, newUserMessage]);

    try {
      const res = await fetch("/api/researcher/cohort-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg }),
      });
      const data = await res.json();
      if (data.success) {
        const aiMessage = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant" as const,
          content: data.explanation,
          inclusion: data.inclusion,
          exclusion: data.exclusion,
          matchedPatients: data.matchedPatients,
        };
        setCohortChat(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || "Cohort screening failed.");
      }
    } catch (err: any) {
      const errMsg = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant" as const,
        content: `Screening Protocol Halt: ${err.message || "An unexpected error occurred during cohort screening."}`,
      };
      setCohortChat(prev => [...prev, errMsg]);
    } finally {
      setCohortLoading(false);
    }
  };

  const isSecurityMasked = currentExpertise === "PHARMACIST" || currentExpertise === "RESEARCHER";
  const hasExistedPatient = !!activePatientId && historyRecords.length > 0;

  return (
    <div id="patient-database-console" className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
      
      {/* Combined structural layout: Left column (Lookup + Persona) & Right column (Graph / Screener Chatbox) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-200 flex-1">
        
        {/* LEFT Column: Patient Verification & Persona Selection (lg:col-span-5) */}
        <div className="lg:col-span-5 p-6 space-y-5 bg-stone-50/10">
          
          {/* Sub-section 1: Patient Verification Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-stone-900 text-white rounded-md">
                <Database size={15} className="text-emerald-400" />
              </div>
              <h3 className="font-serif text-base font-semibold text-stone-950">
                Patient Ledger &amp; Verification
              </h3>
            </div>
            <p className="text-xs text-stone-500 font-light">
              Lookup a Patient ID in the secure medical registry to synchronize current context.
            </p>
          </div>

          {/* Sub-section 2: Input & Search Action */}
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
                  placeholder={isSecurityMasked ? "Enter masked ID (e.g. pat-cardio-992)" : "Enter Patient ID (e.g. pat-cardio-992)"}
                  className="w-full text-xs font-mono pl-9 pr-3 py-2.5 border border-stone-200 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-stone-900"
                />
              </div>
              <button
                onClick={() => handleRetrievePatient(searchId)}
                disabled={isSearching || !searchId.trim()}
                className="px-4 py-2.5 bg-stone-900 hover:bg-emerald-700 disabled:bg-stone-100 disabled:text-stone-400 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer animate-fadeIn"
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

          {/* Sub-section 3: Active Patient Details Banner if loaded */}
          {activePatientId && (
            <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-2.5 shadow-sm animate-fadeIn">
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
                  className="text-[10px] font-mono text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
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

          {/* Sub-section 4: Expert Persona Selection (Comes AFTER Patient ID input) */}
          <div className="pt-5 border-t border-stone-200 space-y-3.5">
            <div>
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
                <Sliders size={14} className="text-emerald-600" />
                Expertise &amp; Compliance Persona
              </h3>
              <p className="text-xs text-stone-500 font-light mt-0.5 leading-normal">
                Select your persona to activate compliance protocols, load custom guidelines, and render dynamic analytics tools.
              </p>
            </div>

            <div className="space-y-2">
              {EXPERTISE_PROFILES.map((profile) => {
                const isSelected = currentExpertise === profile.id;
                return (
                  <button
                    key={profile.id}
                    onClick={() => onExpertiseChange(profile.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer relative ${
                      isSelected
                        ? "bg-stone-900 border-stone-900 text-white shadow-sm scale-[0.995]"
                        : "bg-white border-stone-200 hover:border-stone-400 text-stone-850 hover:bg-stone-50/50"
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wide truncate">
                          {profile.name.replace(/Expertise|Expert|Advocate|Practitioner/g, "").trim()}
                        </span>
                        {isSelected && (
                          <span className="px-1.5 py-0.25 bg-emerald-550 text-white text-[9px] font-mono font-medium rounded-full shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] mt-1 leading-normal line-clamp-1 ${
                        isSelected ? "text-stone-300 font-light" : "text-stone-500 font-light"
                      }`}>
                        {profile.description}
                      </p>
                    </div>
                    <div className="shrink-0 ml-1.5">
                      {isSelected ? (
                        <span className="p-0.5 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                          <Check size={10} className="stroke-[3.5]" />
                        </span>
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-stone-300" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-section 5: Security / Compliance Notice Badge */}
          {currentExpertise && (
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
                  {isSecurityMasked ? "Anonymized Access Policy Active" : "Primary Verification Granted"}
                </span>
                <p className="text-[11px] font-light text-stone-600 leading-normal">
                  {isSecurityMasked 
                    ? "Your role enforces strict de-identification rules. Identifiers and names are securely masked." 
                    : "Full clinical privileges active. Patient identity parameters are unmasked."}
                </p>
              </div>
            </div>
          )}

          {/* Sub-section 6: Cohort Query dropdown list - Exclusively for RESEARCHER */}
          {currentExpertise === "RESEARCHER" && allConditions.length > 0 && (
            <div className="p-4 bg-emerald-50/20 border border-emerald-500/15 rounded-xl space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-800 font-mono flex items-center gap-1.5">
                <Filter size={12} className="text-emerald-600" />
                Ledger Diagnostic Directory
              </h4>
              <p className="text-[11px] text-stone-500 leading-tight">
                Quick-select a condition detected in patient records to filter matching de-identified IDs:
              </p>
              <div className="space-y-2">
                <select
                  value={selectedCohortCondition}
                  onChange={(e) => setSelectedCohortCondition(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-200 rounded-lg bg-white text-stone-800"
                >
                  <option value="">-- Choose Diagnostic Condition --</option>
                  {allConditions.map((cond, idx) => (
                    <option key={idx} value={cond}>{cond}</option>
                  ))}
                </select>
              </div>

              {selectedCohortCondition && (
                <div className="space-y-2 pt-2 border-t border-stone-100 animate-fadeIn">
                  <span className="text-[10px] font-mono text-stone-500 font-semibold block">
                    Matching Cohort IDs ({cohortPatients.length})
                  </span>
                  {cohortPatients.length === 0 ? (
                    <p className="text-xs text-stone-400 italic">No matching records in active ledger.</p>
                  ) : (
                    <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1">
                      {cohortPatients.map((cp) => (
                        <div key={cp.id} className="flex items-center justify-between p-1.5 bg-white border border-stone-150 rounded text-xs">
                          <span className="font-mono text-[11px] font-semibold text-stone-700">{cp.id}</span>
                          <button
                            onClick={() => {
                              setSearchId(cp.id);
                              handleRetrievePatient(cp.id);
                            }}
                            className="px-2 py-0.5 bg-stone-900 hover:bg-emerald-700 text-white text-[10px] rounded cursor-pointer transition-all"
                          >
                            Select
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT Column: Dynamic Analytics Area (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-stone-950 text-white min-h-[480px] flex flex-col overflow-hidden relative">
          
          {!currentExpertise ? (
            /* STATE 1: No role selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-500">
              <Activity size={24} className="text-stone-700 animate-pulse mb-3" />
              <p className="text-sm font-serif font-semibold text-stone-300">No Expert Persona Selected</p>
              <p className="text-xs text-stone-500 font-light max-w-sm mt-1 leading-normal">
                Please select your clinical authority role above to activate compliance protocols and load the Clinical Knowledge Graph.
              </p>
            </div>
          ) : currentExpertise === "RESEARCHER" ? (
            /* STATE 2: Medical Researcher - Cohort Query Chat Box (No graph visible!) */
            <div className="flex-1 flex flex-col h-full bg-stone-950 text-stone-200">
              {/* Header */}
              <div className="border-b border-stone-800 p-4.5 bg-stone-900/40 backdrop-blur flex items-center justify-between shrink-0">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
                    <Network size={12} className="text-emerald-500 animate-pulse" />
                    Cohort Criteria Query Screener
                  </p>
                  <h4 className="text-xs font-serif font-semibold text-stone-200">
                    Interactive I/E Eligibility Analysis Box
                  </h4>
                </div>
                <div className="text-[9px] font-mono text-stone-400 bg-stone-800 px-2 py-1 rounded">
                  Regulatory Security: HIPAA Masked
                </div>
              </div>

              {/* Chat Message Thread */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[380px]">
                {cohortChat.map((msg) => (
                  <div key={msg.id} className={`flex flex-col space-y-1.5 animate-fadeIn ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-mono text-stone-500 uppercase tracking-wider px-1">
                      {msg.role === "user" ? "Researcher Request" : "Aegis Screening Agent"}
                    </span>
                    <div className={`p-4 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                      msg.role === "user" 
                        ? "bg-emerald-650 text-white font-medium shadow-sm" 
                        : "bg-stone-900 border border-stone-800 text-stone-100"
                    }`}>
                      <p>{msg.content}</p>
                      
                      {/* Inclusion / Exclusion Tags */}
                      {(msg.inclusion || msg.exclusion) && (
                        <div className="mt-3.5 pt-3 border-t border-stone-800/80 flex flex-wrap gap-2">
                          {msg.inclusion && msg.inclusion.map((inc, i) => (
                            <span key={`inc-${i}`} className="text-[9px] font-mono px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-900/40 rounded-full flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              Inclusion: {inc}
                            </span>
                          ))}
                          {msg.exclusion && msg.exclusion.map((exc, i) => (
                            <span key={`exc-${i}`} className="text-[9px] font-mono px-2 py-0.5 bg-rose-950/80 text-rose-300 border border-rose-900/40 rounded-full flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                              Exclusion: {exc}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Matched Patients list */}
                    {msg.matchedPatients && (
                      <div className="w-full max-w-[90%] bg-stone-900/30 border border-stone-800 rounded-xl p-4 space-y-3 mt-1.5 shadow-inner">
                        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400 font-semibold flex items-center gap-1.5">
                            <Users size={12} className="text-emerald-500 animate-pulse" />
                            Anonymized Ledger Cohort Matches ({msg.matchedPatients.length})
                          </span>
                          <span className="text-[9px] text-stone-500 font-light font-mono">HIPAA compliant</span>
                        </div>
                        
                        {msg.matchedPatients.length === 0 ? (
                          <p className="text-xs text-stone-500 italic font-light">No patient records in active registry match these criteria.</p>
                        ) : (
                          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                            {msg.matchedPatients.map((pat) => (
                              <div key={pat.id} className="p-3 bg-stone-950 border border-stone-850 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-800 transition-all">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs text-emerald-400 font-bold">{pat.id}</span>
                                    <span className="text-[9.5px] px-1.5 py-0.25 bg-stone-800 border border-stone-750 text-stone-300 rounded font-mono">
                                      {pat.gender} • Born {pat.birth}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {pat.records && pat.records[0]?.medicalData?.diagnoses?.map((d: string, i: number) => (
                                      <span key={i} className="text-[8.5px] px-1.5 py-0.25 bg-stone-900 border border-stone-850 text-stone-400 rounded font-light">
                                        {d}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setSearchId(pat.id);
                                    handleRetrievePatient(pat.id);
                                  }}
                                  className="px-3 py-1 bg-emerald-650 hover:bg-emerald-700 hover:text-white text-white text-[10.5px] font-mono rounded-lg cursor-pointer transition-all shrink-0 flex items-center gap-1"
                                >
                                  Sync Dossier
                                  <ArrowRight size={10} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {cohortLoading && (
                  <div className="flex items-center gap-2 text-xs text-stone-400 font-mono pl-1 py-1">
                    <RefreshCw size={12} className="animate-spin text-emerald-500" />
                    Scanning secure patient databases...
                  </div>
                )}
              </div>

              {/* Chat Form */}
              <form onSubmit={handleCohortSubmit} className="p-3 border-t border-stone-800 bg-stone-900/30 flex gap-2 shrink-0">
                <input
                  type="text"
                  value={cohortQuery}
                  onChange={(e) => setCohortQuery(e.target.value)}
                  disabled={cohortLoading}
                  placeholder="Enter criteria (e.g., 'Inclusion: heart failure and hypertension, exclusion: diabetes')..."
                  className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-600 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={cohortLoading || !cohortQuery.trim()}
                  className="p-2.5 bg-emerald-650 hover:bg-emerald-700 disabled:bg-stone-800 disabled:text-stone-600 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                >
                  <Send size={13} />
                </button>
              </form>
            </div>
          ) : (
            /* STATE 3: Clinical Roles - Clinical Knowledge Graph */
            <>
              {hasExistedPatient ? (
                <ClinicalKnowledgeGraph 
                  records={historyRecords}
                  expertise={currentExpertise}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400 bg-stone-950 min-h-[460px]">
                  <Database size={22} className="text-stone-700 mb-2.5 animate-pulse" />
                  <p className="text-xs font-mono text-stone-300">Compliance Verification Required</p>
                  <p className="text-[11px] text-stone-500 font-light max-w-xs mt-1 leading-normal">
                    Search for a Patient ID on the left to verify active medical consent and retrieve previous diagnostic records.
                  </p>
                </div>
              )}
            </>
          )}

        </div>
      </div>

    </div>
  );
}
