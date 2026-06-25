export interface ClinicalSkill {
  id: string;
  name: string;
  focus: string;
  badgeColor: string;
  guidelines: string[];
}

export interface ExpertiseProfile {
  id: string;
  name: string;
  badge: string;
  description: string;
  skills: ClinicalSkill[];
  defaultPrompt: string;
}

export const CLINICAL_SKILLS: { [key: string]: ClinicalSkill } = {
  pharma_interaction: {
    id: "pharma_interaction",
    name: "Pharmacology & Drug Safety Folder",
    focus: "Drug-drug interactions, CYP450 metabolism, contraindications, and dosage protocols",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    guidelines: [
      "Evaluate high-risk drug-drug/drug-food interactions.",
      "Identify renal or hepatic clearance pathways (estimating GFR/Creatinine safety).",
      "Highlight active pharmacological mechanisms of action (MOA).",
      "List safety alerts matching FDA Black Box Warnings or guidelines."
    ]
  },
  diagnostic_reasoning: {
    id: "diagnostic_reasoning",
    name: "Differential Diagnostics Folder",
    focus: "Pathophysiological staging, clinical diagnostics, prognosis metrics, and differential markers",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    guidelines: [
      "Interpret clinical symptom progression under standard EHR guidelines.",
      "Calculate potential risk indices (e.g., CHA2DS2-VASc, MELD, ASCVD) where applicable.",
      "Suggest differential diagnoses to verify via secondary tests.",
      "Correlate imaging scans with physiological indicators."
    ]
  },
  pathology_histology: {
    id: "pathology_histology",
    name: "Laboratory & Histopathology Folder",
    focus: "Cytological stains, biopsy analyses, biomarker thresholds, and morphology anomalies",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    guidelines: [
      "Evaluate microenvironment structures, H&E/immunohistochemical (IHC) stain patterns, or cellular morphology.",
      "Flag biochemical parameter variance based on strict clinical laboratory thresholds.",
      "Interpret tumor-microenvironment markers, lymphocyte counts, or flow cytometry parameters.",
      "Focus on specimen integrity, biopsy margins, and specific assay techniques used."
    ]
  },
  cohort_meta: {
    id: "cohort_meta",
    name: "Clinical Cohort & Phenotypic Statistics Folder",
    focus: "Genomic/phenotypic associations, peer study meta-analysis references, and cohort mapping",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    guidelines: [
      "Correlate patient biomarkers with peer scientific cohort datasets.",
      "Map findings to OMOP common data models or standard vocabulary classifications (SNOMED, RxNorm, LOINC).",
      "Evaluate validation standards, sample parameters, and research replication vectors.",
      "Reference relevant meta-analyses or peer studies associated with patient phenotypes."
    ]
  },
  patient_care: {
    id: "patient_care",
    name: "Layman Translation & Patient Adherence Folder",
    focus: "Compassionate, simple translations of clinical jargon, patient support, and everyday action items",
    badgeColor: "bg-stone-100 text-stone-700 border-stone-200",
    guidelines: [
      "Translate highly dense clinical terminology into clear, accessible everyday wording.",
      "Ensure an empathetic, supportive, and non-alarmist communication flow.",
      "Formulate safe lifestyle, nutrition, hydration, and sleep advisory suggestions.",
      "Highlight explicit questions for the patient to ask their primary healthcare provider."
    ]
  }
};

export const EXPERTISE_PROFILES: ExpertiseProfile[] = [
  {
    id: "PATIENT",
    name: "Patient / Layman Owner",
    badge: "👤 Patient Advocate",
    description: "Personalized translations, gentle vocabulary, clear action plans, and supportive educational dialog.",
    skills: [CLINICAL_SKILLS.patient_care],
    defaultPrompt: `You are communicating with a patient. Use gentle, layman-friendly vocabulary. Demystify all complex clinical acronyms and lab readings (e.g. explain LVEF, Troponin-T, HbA1c in simple terms). Focus heavily on general support, educational definitions, lifestyle tips, and questions they can ask their doctor. Avoid intimidating biochem jargon.`
  },
  {
    id: "MD_PRACTITIONER",
    name: "Clinical Practitioner (MD/DO/NP)",
    badge: "🩺 Medical Expertise (MD)",
    description: "Advanced differential diagnostics, clinical indicators, pathophysiologicalstaging, and physician-oriented guidance.",
    skills: [CLINICAL_SKILLS.diagnostic_reasoning, CLINICAL_SKILLS.pharma_interaction],
    defaultPrompt: `You are communicating with a licensed medical practitioner. Use advanced medical vocabulary and clinical terminology (e.g., hemodynamics, ischemic penumbra, concentric remodeling). Discuss differential diagnoses, pathophysiological correlations, potential diagnostic staging pathways, and clinical indicators to inspect. Highlight critical prognostic values.`
  },
  {
    id: "PHARMACIST",
    name: "Clinical Pharmacist (PharmD)",
    badge: "💊 Pharmacist Expert",
    description: "Detailed drug-drug interactions, Cyp450 substrate pathways, therapeutic ranges, and biometabolic profiles.",
    skills: [CLINICAL_SKILLS.pharma_interaction, CLINICAL_SKILLS.diagnostic_reasoning],
    defaultPrompt: `You are communicating with a clinical pharmacist. Focus on pharmacotherapy, chemical mechanism of action (MOA), active metabolites, potential drug-drug/drug-food interactions (e.g., CYP3A4 pathway competitors, competitive inhibition), renal/hepatic dosing adjustments, and therapeutic equivalents. Cite pharmacokinetics and pharmacokinetic variables.`
  },
  {
    id: "PATHOLOGIST",
    name: "Lab Scientist / Pathologist",
    badge: "🔬 Lab Pathologist",
    description: "Biomarker analytical tolerances, histological morphology, stain variables, and biochemical limits.",
    skills: [CLINICAL_SKILLS.pathology_histology, CLINICAL_SKILLS.cohort_meta],
    defaultPrompt: `You are communicating with a clinical pathologist or laboratory scientist. Focus on histological stain features (e.g. H&E, immunohistochemistry, cytological grading), biological tissue morphology anomalies, fluid biochemistry limits, reference range calibrators, cell counts, and specimen-assay variances.`
  }
];
