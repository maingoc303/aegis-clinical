import React, { useState, useEffect } from "react";
import { User, Cpu, BookOpen, Sparkles, Check, HelpCircle, FileSignature, Layers, Edit2, Plus, Save, RotateCw, FileText } from "lucide-react";
import { EXPERTISE_PROFILES } from "../data/clinicalSkills";

interface SkillFile {
  id: string; // e.g. "pharmacology.md"
  name: string; // Display name
  content: string; // Markdown text
}

interface ClinicalCurationPanelProps {
  currentExpertise: string;
  onExpertiseChange: (roleId: string) => void;
  manualCurationGuidance: string;
  onGuidanceChange: (val: string) => void;
  activeSkills: string[];
  onActiveSkillsChange: (skills: string[]) => void;
}

export default function ClinicalCurationPanel({
  currentExpertise,
  onExpertiseChange,
  manualCurationGuidance,
  onGuidanceChange,
  activeSkills,
  onActiveSkillsChange,
}: ClinicalCurationPanelProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Real physical skill md files from backend
  const [skillsList, setSkillsList] = useState<SkillFile[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillFile | null>(null);
  const [newSkillName, setNewSkillName] = useState("");
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const activeProfile = EXPERTISE_PROFILES.find(p => p.id === currentExpertise) || EXPERTISE_PROFILES[0];

  // Load real files from /api/skills
  const fetchSkillsList = async () => {
    setIsLoadingSkills(true);
    try {
      const res = await fetch("/api/skills");
      if (res.ok) {
        const data = await res.json();
        setSkillsList(data);
      }
    } catch (e) {
      console.error("Failed to load workspace skill files:", e);
    } finally {
      setIsLoadingSkills(false);
    }
  };

  useEffect(() => {
    fetchSkillsList();
  }, []);

  // Sync standard files based on the chosen expert profile unless the user customized selection
  const syncStandardFilesForExpertise = (roleId: string) => {
    const defaultMap: { [key: string]: string[] } = {
      PATIENT: ["patient_care.md"],
      MD_PRACTITIONER: ["differential_diagnostics.md", "pharmacology.md"],
      PHARMACIST: ["pharmacology.md", "differential_diagnostics.md"],
      PATHOLOGIST: ["laboratory_pathology.md", "cohort_statistics.md"],
    };
    const defaultFiles = defaultMap[roleId] || [];
    onActiveSkillsChange(defaultFiles);
  };

  const handleProfileSelect = (roleId: string) => {
    onExpertiseChange(roleId);
    syncStandardFilesForExpertise(roleId);
  };

  // Add a new custom skill file
  const handleCreateSkillFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    let filename = newSkillName.trim().toLowerCase().replace(/\s+/g, "_");
    filename = filename.replace(/[^a-z0-9_\-]/g, ""); // strip weird characters
    if (!filename.endsWith(".md")) {
      filename += ".md";
    }

    const cleanTitle = newSkillName.trim();
    const defaultContent = `# ${cleanTitle} Domain Guidelines\n\nThis clinical guidelines skill folder is custom tailored for specialized workflows.\n\n## Actionable Clinical Protocols\n- **Guideline 1**: Add your dynamic medical guidance metrics here.\n- **Guideline 2**: Ensure status alerts are mapped to custom reference standards.\n- **Guideline 3**: Direct conversational chatbot behaviors based on this instruction.\n`;

    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: filename, content: defaultContent }),
      });

      if (res.ok) {
        setNewSkillName("");
        setSyncStatus(`Created physical folder: /skills/${filename}`);
        setTimeout(() => setSyncStatus(null), 3000);
        await fetchSkillsList();
        
        // Auto-activate this newly created file
        if (!activeSkills.includes(filename)) {
          onActiveSkillsChange([...activeSkills, filename]);
        }

        // Immediately load it into the Markdown Editor
        setEditingSkill({
          id: filename,
          name: cleanTitle,
          content: defaultContent,
        });
      }
    } catch (e) {
      console.error("Failed to write new skill file to disk:", e);
    }
  };

  // Save the currently modified skill
  const handleSaveSkillEdit = async () => {
    if (!editingSkill) return;

    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingSkill.id, content: editingSkill.content }),
      });

      if (res.ok) {
        setSyncStatus(`Guidelines saved directly to repository at "/skills/${editingSkill.id}"`);
        setTimeout(() => setSyncStatus(null), 4000);
        await fetchSkillsList();
      }
    } catch (e) {
      console.error("Failed to save edited skill folder markdown:", e);
    }
  };

  // Toggle active guideline file selections
  const handleToggleSkillFile = (filename: string) => {
    if (activeSkills.includes(filename)) {
      onActiveSkillsChange(activeSkills.filter(s => s !== filename));
    } else {
      onActiveSkillsChange([...activeSkills, filename]);
    }
  };

  // Template suggestions triggers
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
              Select expert domains, check active skill folder files, or edit markdown rules dynamically
            </p>
          </div>
        </div>
      </div>

      {showTooltip && (
        <div className="bg-emerald-50/50 border border-emerald-150 rounded-xl p-4 text-xs text-stone-700 space-y-2 animate-feed-in leading-relaxed">
          <p className="font-semibold text-emerald-800">Why configure Clinical Expertise &amp; Skill Files?</p>
          <p className="font-light">
            Selecting a medical profile tells Aegis which clinical guidelines file folders (e.g. `pharmacology.md`, `laboratory_pathology.md`, etc.) to trigger. You can edit the markdown guidelines directly, or create completely new files (RAG source folders) to customize parameters and trigger-points dynamically!
          </p>
        </div>
      )}

      {/* Clinical RAG Guideline Folders */}
      {currentExpertise !== "PATIENT" && (
        <div className="bg-stone-50/50 border border-stone-250 rounded-xl p-4.5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-3">
            <div>
              <span className="text-xs font-mono font-bold text-stone-700 uppercase tracking-widest flex items-center gap-1.5">
                <Layers size={14} className="text-emerald-600" />
                Clinical RAG Guideline Folders (In /skills Folder)
              </span>
            <p className="text-[10px] text-stone-500 font-light mt-0.5">
              Toggle checkboxes to load multiple files into active RAG memory. Click the pencil to edit markdown.
            </p>
          </div>
          <button 
            type="button"
            onClick={fetchSkillsList}
            className="self-start sm:self-center flex items-center gap-1 text-[10px] font-mono border border-stone-300 bg-white hover:bg-stone-50 text-stone-600 px-2 py-1 rounded"
            title="Reload files from workspace storage"
          >
            <RotateCw size={10} className={isLoadingSkills ? "animate-spin" : ""} />
            Reload Files
          </button>
        </div>

        {/* Sync / Success alert lines */}
        {syncStatus && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-150 p-2.5 rounded-lg text-xs leading-none font-mono animate-pulse flex items-center gap-2">
            <Sparkles size={12} className="text-emerald-600 shrink-0" />
            {syncStatus}
          </div>
        )}

        {/* Files Checklist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {skillsList.map((file) => {
            const isChecked = activeSkills.includes(file.id);
            return (
              <div 
                key={file.id}
                className={`bg-white border rounded-xl p-3 flex items-start gap-2.5 shadow-sm transition-all relative group ${
                  isChecked ? "border-emerald-500 ring-1 ring-emerald-500/20" : "border-stone-200"
                }`}
              >
                {/* Checkbox */}
                <input 
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleSkillFile(file.id)}
                  className="w-4 h-4 mt-0.5 rounded cursor-pointer accent-emerald-600"
                  id={`check-${file.id}`}
                />
                
                <div className="flex-1 min-w-0 pr-6">
                  <label htmlFor={`check-${file.id}`} className="font-mono text-[11px] font-bold text-stone-850 truncate block cursor-pointer select-none">
                    {file.id}
                  </label>
                  <p className="text-[10px] text-stone-400 font-light truncate mt-0.5">
                    {file.content.length} characters of rules
                  </p>
                </div>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => setEditingSkill(file)}
                  className="absolute right-2.5 top-2.5 p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-50 border border-transparent hover:border-stone-200 rounded transition-all cursor-pointer"
                  title="Edit guideline file markdown directly"
                >
                  <Edit2 size={11} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Add custom brand-new file form */}
        <form onSubmit={handleCreateSkillFile} className="flex gap-2 pt-2 items-center">
          <FileText size={13} className="text-stone-400 shrink-0" />
          <input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="E.g. Pediatric Care, Gerontology Staging, Surgical Advisory..."
            className="flex-1 text-xs px-2.5 py-1.5 border border-stone-200 bg-white rounded-lg text-stone-800 placeholder:text-stone-400/80 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-light"
          />
          <button
            type="submit"
            disabled={!newSkillName.trim()}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[11px] font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-all cursor-pointer shrink-0"
          >
            <Plus size={11} /> Add Skill File
          </button>
        </form>

        {/* Direct Markdown Interactive Editor Slate */}
        {editingSkill && (
          <div className="bg-stone-900 border border-stone-850 rounded-xl p-4 mt-4 space-y-3 text-white animate-feed-in">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-xs text-stone-300">
                  Editing file: <strong className="text-white">skills/{editingSkill.id}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveSkillEdit}
                  className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-mono font-bold text-[10.5px] px-2.5 py-1 rounded transition-colors cursor-pointer"
                >
                  <Save size={11} className="stroke-[2.5]" />
                  Save File
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSkill(null)}
                  className="text-stone-400 hover:text-white text-[10.5px] font-mono px-1 py-0.5 hover:underline"
                >
                  Close Editor
                </button>
              </div>
            </div>

            <textarea
              value={editingSkill.content}
              onChange={(e) => setEditingSkill({ ...editingSkill, content: e.target.value })}
              className="w-full h-48 bg-stone-950 text-stone-200 font-mono text-xs p-3 rounded-lg focus:outline-none border border-stone-800 placeholder:text-stone-600 leading-relaxed resize-y"
              placeholder="# Markdown header..."
            />
            
            <p className="text-[10px] text-stone-400 font-light italic leading-normal">
              Note: Writing edits will immediately update the physically stored file on disk in "/skills". When you run analysis or trigger chatbot questions, these precise markdown guidelines are retrieved and synthesized directly.
            </p>
          </div>
        )}

      </div>
      )}

      {/* Manual Curation Overrides Section */}
      {currentExpertise !== "PATIENT" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-semibold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
              <FileSignature size={14} className="text-emerald-600" />
              Manual Curation Guidance &amp; Overrides (Your Custom Inputs)
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
      )}

      {currentExpertise !== "PATIENT" && (
        <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[10.5px] text-stone-400 font-light">
          <span className="flex items-center gap-1">
            <Sparkles size={11} className="text-emerald-600" />
            Both active custom files and overrides will sync directly with the models.
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
      )}

    </div>
  );
}
