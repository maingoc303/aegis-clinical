import React, { useState } from "react";
import { User, Cpu, BookOpen, Sparkles, Check, HelpCircle, FileSignature, Layers } from "lucide-react";
import { EXPERTISE_PROFILES, ExpertiseProfile } from "../data/clinicalSkills";

interface ClinicalCurationPanelProps {
  currentExpertise: string;
  onExpertiseChange: (roleId: string) => void;
  manualCurationGuidance: string;
  onGuidanceChange: (val: string) => void;
}

export default function ClinicalCurationPanel({
  currentExpertise,
  onExpertiseChange,
  manualCurationGuidance,
  onGuidanceChange,
}: ClinicalCurationPanelProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const activeProfile = EXPERTISE_PROFILES.find(p => p.id === currentExpertise) || EXPERTISE_PROFILES[0];

  // Suggested curation templates based on the current active profile to help user understand the power!
  const templateSuggestionsMap: { [key: string]: string[] } = {
    PATIENT: [
      "Translate all findings to 7th-grade reading level. Focus on actionable lifestyle improvements.",
      "Highlight dietary advice specifically for managing cardiovascular wellness.",
      "Convert blood pressure readings into simple status checks (e.g. Normal, Elevated)."
    ],
    MD_PRACTITIONER: [
      "Set High Alert flag for High-Sensitivity Troponin-I if over 0.04 ng/mL.",
      "Suggest secondary diagnostic checks for stable vs unstable angina if ischemic findings are present.",
      "Incorporate ACC/AHA guidelines for Stage 1 Hypertension in medications purpose."
    ],
    PHARMACIST: [
      "Flag potential competitive substrate inhibition on CYP2C19 when interpreting therapeutics.",
      "Calculate renal dosing checks for Metformin if GFR drops below 45 mL/min.",
      "Include chemical mechanism of action (MOA) and bioavialability curves for all blood-pressure medications."
    ],
    PATHOLOGIST: [
      "Classify atypical lymphocyte morphology as highly suggestive of viral etiology in the notes.",
      "Adjust Glucose reference interval to 65-105 mg/dL to match local laboratory calibration index.",
      "Evaluate microenvironmental cell margin cellular patterns precisely."
    ],
    RESEARCHER: [
      "Correlate all laboratory findings with SNOMED-CT clinical codes.",
      "Reference recent peer-reviewed longitudinal studies on diabetes cohort progressions.",
      "Output outcomes with phenotypic validation confidence scores."
    ]
  };

  const currentSuggestions = templateSuggestionsMap[currentExpertise] || templateSuggestionsMap.PATIENT;

  return (
    <div id="expertise-curation-workspace" className="bg-white border border-stone-200 rounded-xl p-5 md:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6">
      
      {/* Panel title */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-600 text-white rounded-md">
            <Cpu size={16} className="fill-emerald-100" />
          </div>
          <div>
            <h3 className="font-serif text-base font-semibold text-stone-950 flex items-center gap-1.5">
              Clinical Expertise &amp; Skills Curation
              <button 
                onClick={() => setShowTooltip(prev => !prev)}
                className="text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                title="Learn more about expertise roles"
              >
                <HelpCircle size={14} />
              </button>
            </h3>
            <p className="text-xs text-stone-500 font-light mt-0.5">
              Tailor interpretation filters with expert domain rules and manual curator guidance
            </p>
          </div>
        </div>
      </div>

      {showTooltip && (
        <div className="bg-emerald-50/50 border border-emerald-150 rounded-xl p-4 text-xs text-stone-700 space-y-2 animate-feed-in leading-relaxed">
          <p className="font-semibold text-emerald-800">Why configure Clinical Expertise?</p>
          <p className="font-light">
            Selecting a medical domain tells Aegis which specialized <strong>Clinical Knowledge Folder</strong> (e.g. pharmacology substrates, biopsy stains, genomic cohort matching) should guide the analysis. Conversations and document reads will adapt their language density, risk boundaries, and focus areas to fit your exact domain workflow.
          </p>
        </div>
      )}

      {/* Expertise Selection Cards Grid */}
      <div className="space-y-3">
        <label className="text-xs font-mono font-semibold text-stone-600 uppercase tracking-wider block">
          1. Select Expert Persona
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          {EXPERTISE_PROFILES.map((profile) => {
            const isSelected = currentExpertise === profile.id;
            return (
              <button
                key={profile.id}
                onClick={() => onExpertiseChange(profile.id)}
                className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between h-28 cursor-pointer relative group ${
                  isSelected
                    ? "bg-stone-950 border-stone-950 text-white shadow-md scale-[0.985]"
                    : "bg-stone-50/30 border-stone-200 hover:border-stone-400 text-stone-800"
                }`}
              >
                <div>
                  <span className="text-xs select-none block mb-1">
                    {profile.badge.split(" ")[0]}
                  </span>
                  <h4 className="font-sans text-xs font-bold leading-tight uppercase tracking-wide">
                    {profile.name.replace(/Expertise|Expert|Advocate|Practitioner/g, "").trim()}
                  </h4>
                  <p className={`text-[10px] mt-1.5 leading-snug line-clamp-2 ${
                    isSelected ? "text-stone-300 font-light" : "text-stone-400 font-light"
                  }`}>
                    {profile.description}
                  </p>
                </div>

                {isSelected && (
                  <span className="absolute bottom-3 right-3 p-0.5 bg-emerald-500 text-white rounded-full">
                    <Check size={10} className="stroke-[3.5]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Triggered Clinical Folders list */}
      <div className="bg-stone-50/50 border border-stone-200 rounded-xl p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold text-stone-600 uppercase tracking-widest flex items-center gap-1.5">
            <Layers size={13} className="text-emerald-600" />
            2. Triggered Clinical Skills Folders ({activeProfile.skills.length})
          </span>
          <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-700 border border-emerald-500/15 rounded-md px-1.5 py-0.5 font-bold animate-pulse">
            ACTIVE FOR CHAT &amp; COMPILATION
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeProfile.skills.map((skill) => (
            <div 
              key={skill.id} 
              className="bg-white border border-stone-200 rounded-lg p-3 space-y-2 text-xs shadow-sm hover:border-emerald-500 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${skill.badgeColor}`}>
                  {skill.name}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-light leading-normal">
                <strong>Focus:</strong> {skill.focus}
              </p>
              <div className="space-y-1 pt-1.5 border-t border-stone-100">
                <p className="text-[9px] text-stone-400 uppercase tracking-wider font-bold">Domain Guidance Protocols:</p>
                <ul className="list-disc pl-3 text-[10.5px] text-stone-600 space-y-0.5 font-light">
                  {skill.guidelines.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Curation Overrides Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono font-semibold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
            <FileSignature size={14} className="text-emerald-600" />
            3. Manual Curation Guidance &amp; Overrides (Your Custom Inputs)
          </label>
          <span className="text-[10px] text-stone-400 font-mono">
            Overwrites default thresholds
          </span>
        </div>

        <textarea
          value={manualCurationGuidance}
          onChange={(e) => onGuidanceChange(e.target.value)}
          placeholder={`Enter custom rules like: "Always flag HbA1c as BORDERLINE if between 5.7% and 6.4%", "Include research citations for coronary flow reserve ratios", or other notes...`}
          className="w-full text-xs font-light p-3 border border-stone-200 rounded-xl bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-all min-h-[82px] leading-relaxed"
        />

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          <span className="text-[10px] text-stone-400 font-mono font-medium">Quick copy template prompts:</span>
          {currentSuggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => onGuidanceChange(suggestion)}
              className="px-2.5 py-1 bg-stone-50 border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-stone-600 hover:text-emerald-950 text-[10.5px] rounded-lg font-light transition-all cursor-pointer shadow-sm text-left truncate max-w-[280px]"
              title={suggestion}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[10.5px] text-stone-400 font-light">
        <span className="flex items-center gap-1">
          <Sparkles size={11} className="text-emerald-600" />
          Settings will sync to both the scanner parser and the conversation sandbox.
        </span>
        {manualCurationGuidance && (
          <button 
            onClick={() => onGuidanceChange("")}
            className="text-stone-500 hover:text-stone-900 underline font-mono text-[9px] cursor-pointer"
          >
            Clear Guidance
          </button>
        )}
      </div>

    </div>
  );
}
