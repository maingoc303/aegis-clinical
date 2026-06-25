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
  Users,
  Dna,
  FlaskConical,
  Image as ImageIcon
} from "lucide-react";
import { HistoricalRecord, Patient } from "../types";
import { EXPERTISE_PROFILES } from "../data/clinicalSkills";
import ClinicalKnowledgeGraph from "./ClinicalKnowledgeGraph";

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

  // Load the full patients list
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

  const isSecurityMasked = currentExpertise === "PHARMACIST" || currentExpertise === "PATHOLOGIST";
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

              {currentLoadedPatient && (
                <div className="mt-3 pt-2.5 border-t border-stone-100 space-y-3.5">
                  {/* Biobank Sub-section */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold flex items-center gap-1">
                        <FlaskConical size={11} className="text-emerald-600 animate-pulse" />
                        Biobank Registry
                      </span>
                      {currentLoadedPatient.biobankConsent ? (
                        <span className="px-1.5 py-0.25 bg-emerald-50 border border-emerald-200 text-emerald-850 text-[8.5px] font-mono font-bold rounded">
                          ✓ Consented
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.25 bg-stone-100 border border-stone-200 text-stone-500 text-[8.5px] font-mono font-bold rounded">
                          ✗ No Consent
                        </span>
                      )}
                    </div>
                    {currentLoadedPatient.biobankConsent && currentLoadedPatient.biobankInfo ? (
                      <div className="bg-stone-50/70 rounded-xl p-2.5 border border-stone-200 text-[10.5px] space-y-2">
                        <div className="grid grid-cols-2 gap-1.5 text-stone-600 font-light">
                          <div className="bg-white p-1.5 rounded-lg border border-stone-150 shadow-sm">
                            <span className="text-[8px] font-mono text-stone-400 block uppercase leading-tight">Blood Aliquots</span>
                            <span className="font-semibold text-stone-800">{currentLoadedPatient.biobankInfo.bloodTubesCount || 0} Tubes Stored</span>
                          </div>
                          <div className="bg-white p-1.5 rounded-lg border border-stone-150 shadow-sm">
                            <span className="text-[8px] font-mono text-stone-400 block uppercase leading-tight">Urine / Stool</span>
                            <span className="font-semibold text-stone-800 text-[9.5px]">
                              {currentLoadedPatient.biobankInfo.urineSample ? "✓ Urine" : "✗ Urine"} • {currentLoadedPatient.biobankInfo.stoolSample ? "✓ Stool" : "✗ Stool"}
                            </span>
                          </div>
                        </div>
                        {currentLoadedPatient.biobankInfo.otherSamples && currentLoadedPatient.biobankInfo.otherSamples.length > 0 && (
                          <div className="pt-1 border-t border-stone-150">
                            <span className="text-[8.5px] font-mono text-stone-400 block uppercase mb-1">Additional Specimens:</span>
                            <div className="flex flex-wrap gap-1">
                              {currentLoadedPatient.biobankInfo.otherSamples.map((sample, idx) => (
                                <span key={idx} className="px-1.5 py-0.25 bg-white border border-stone-150 text-[9px] text-stone-700 rounded font-mono shadow-sm">
                                  {sample}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-[8.5px] font-mono text-stone-400 pt-1.5 border-t border-stone-150">
                          <span>Authorization:</span>
                          <span className="font-semibold text-stone-600">{currentLoadedPatient.biobankConsentDate}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10.5px] text-stone-500 font-light leading-normal bg-stone-50/50 p-2.5 rounded-xl border border-stone-200">
                        The patient has not granted permission to distribute clinical biosamples (Serum, Tissue block, or genetic markers) to any secondary academic biobanks.
                      </p>
                    )}
                  </div>

                  {/* Multi-Omics Subsection */}
                  {currentLoadedPatient.omicsData && (
                    <div className="space-y-1.5 pt-2 border-t border-stone-100">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold flex items-center gap-1">
                        <Dna size={11} className="text-purple-600" />
                        Multi-Omics Datasets
                      </span>
                      <div className="bg-stone-50/70 rounded-xl p-2.5 border border-stone-200 text-[10.5px] space-y-2">
                        <div className="flex flex-wrap gap-1">
                          <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-medium border ${currentLoadedPatient.omicsData.dnaSequenced ? "bg-purple-50 text-purple-800 border-purple-200" : "bg-stone-100 text-stone-450 border-stone-200"}`}>
                            DNA
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-medium border ${currentLoadedPatient.omicsData.rnaSequenced ? "bg-purple-50 text-purple-800 border-purple-200" : "bg-stone-100 text-stone-450 border-stone-200"}`}>
                            RNA
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-medium border ${currentLoadedPatient.omicsData.proteinProfiling ? "bg-purple-50 text-purple-800 border-purple-200" : "bg-stone-100 text-stone-450 border-stone-200"}`}>
                            Proteins
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-medium border ${currentLoadedPatient.omicsData.metabolomics ? "bg-purple-50 text-purple-800 border-purple-200" : "bg-stone-100 text-stone-450 border-stone-200"}`}>
                            Metabolic
                          </span>
                        </div>
                        {currentLoadedPatient.omicsData.details && (
                          <div className="bg-white p-2.5 rounded-lg border border-stone-150 space-y-1.5 text-stone-700 shadow-sm">
                            {currentLoadedPatient.omicsData.details.dnaVariantCount && (
                              <p className="flex justify-between text-[10px] font-mono leading-tight">
                                <span className="text-stone-400 font-medium">GENOME VARIANT</span>
                                <span className="font-semibold text-stone-800">{currentLoadedPatient.omicsData.details.dnaVariantCount}</span>
                              </p>
                            )}
                            {currentLoadedPatient.omicsData.details.rnaExpressedGenes && (
                              <p className="flex justify-between text-[10px] font-mono leading-tight">
                                <span className="text-stone-400 font-medium font-sans">EXPRESSED TRANSCRIPTS</span>
                                <span className="font-semibold text-stone-850">{currentLoadedPatient.omicsData.details.rnaExpressedGenes}</span>
                              </p>
                            )}
                            {currentLoadedPatient.omicsData.details.proteinBiomarkers && (
                              <div>
                                <span className="text-[8.5px] font-mono text-stone-400 block uppercase leading-none mb-1">Assayed Protein Targets:</span>
                                <span className="font-medium text-stone-850 text-[10px] block leading-tight bg-stone-50/50 p-1 rounded border border-stone-100 font-mono">{currentLoadedPatient.omicsData.details.proteinBiomarkers.join(", ")}</span>
                              </div>
                            )}
                            {currentLoadedPatient.omicsData.details.metabolitesIdentified && (
                              <p className="flex justify-between text-[10px] font-mono leading-tight pt-1.5 border-t border-stone-100">
                                <span className="text-stone-400 font-medium">METABOLOMICS DETECTED</span>
                                <span className="font-semibold text-stone-800">{currentLoadedPatient.omicsData.details.metabolitesIdentified}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Clinical Imaging Logs Subsection */}
                  {currentLoadedPatient.images && currentLoadedPatient.images.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-stone-100">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold flex items-center gap-1">
                        <ImageIcon size={11} className="text-blue-600 animate-pulse" />
                        Clinical Scan Repositories
                      </span>
                      <div className="space-y-2">
                        {currentLoadedPatient.images.map((image) => (
                          <div key={image.id} className="bg-stone-50/70 rounded-xl p-2.5 border border-stone-200 text-[10.5px] space-y-1.5 shadow-sm">
                            <div className="flex items-center justify-between border-b border-stone-150 pb-1">
                              <span className="px-1.5 py-0.25 bg-blue-50 text-blue-800 border border-blue-150 rounded text-[8.5px] font-mono font-bold uppercase">
                                {image.type} SCAN
                              </span>
                              <span className="text-[9px] font-mono text-stone-400">{image.date}</span>
                            </div>
                            <p className="font-bold text-stone-800 font-mono text-[10px] leading-snug">
                              Region: {image.bodyPart}
                            </p>
                            <p className="text-[10px] text-stone-600 font-light leading-normal bg-white p-2 rounded-lg border border-stone-150 shadow-inner">
                              <strong className="font-semibold text-stone-700">Findings:</strong> {image.findings}
                            </p>
                            {image.visualDescription && (
                              <p className="text-[9.5px] text-stone-400 italic">
                                Scan Overlay: "{image.visualDescription}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

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
          ) : (
            /* STATE 3: Clinical Roles - Clinical Knowledge Graph */
            <>
              {hasExistedPatient ? (
                <ClinicalKnowledgeGraph 
                  records={historyRecords}
                  expertise={currentExpertise}
                  patient={currentLoadedPatient}
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
