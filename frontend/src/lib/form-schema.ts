// ============================================================
// Form schema — 11 sections (PRD §6.2). Drives the wizard UI.
// ============================================================

export type FieldType =
  | 'text' | 'number' | 'date' | 'datetime' | 'time'
  | 'email' | 'tel' | 'select' | 'radio' | 'checkbox-group' | 'textarea';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  unit?: string;
  half?: boolean;            // half-width on desktop grid
  conditionalOn?: { key: string; value: string }; // show only when condition met
}

export interface SectionDef {
  id: number;
  name: string;
  fields: FieldDef[];
}

export const SECTIONS: SectionDef[] = [
  {
    id: 1,
    name: 'Personal Details',
    fields: [
      { key: 'fullName', label: 'Full Name', type: 'text', required: true, half: true },
      { key: 'dob', label: 'Date of Birth', type: 'date', required: true, half: true },
      { key: 'age', label: 'Age', type: 'number', required: true, half: true },
      { key: 'gender', label: 'Gender', type: 'radio', required: true, options: ['Male', 'Female', 'Others'], half: true },
      { key: 'phone', label: 'Phone No.', type: 'tel', required: true, half: true },
      { key: 'email', label: 'Email ID', type: 'email', required: true, half: true },
      { key: 'state', label: 'State / City of Origin', type: 'text', required: true, half: true },
      { key: 'ethnicity', label: 'Ethnicity / Community', type: 'text', required: true, half: true },
      { key: 'primaryIndication', label: 'Primary Indication(s) for Semaglutide', type: 'checkbox-group', required: true,
        options: ['Type 2 Diabetes (T2DM)', 'Obesity / Weight Management', 'NASH / Fatty Liver', 'Cardiovascular Risk Reduction', 'Other'] },
    ],
  },
  {
    id: 2,
    name: 'Anthropometrics & Vitals',
    fields: [
      { key: 'height', label: 'Height', type: 'number', required: true, unit: 'cm', half: true },
      { key: 'weight', label: 'Weight', type: 'number', required: true, unit: 'kg', half: true },
      { key: 'bmi', label: 'BMI (auto-calculated)', type: 'number', required: true, half: true },
      { key: 'waistCirc', label: 'Waist Circumference', type: 'number', required: true, unit: 'cm', half: true },
      { key: 'bloodPressure', label: 'Blood Pressure', type: 'text', required: true, placeholder: '120/80', unit: 'mmHg', half: true },
      { key: 'heartRate', label: 'Heart Rate', type: 'number', required: true, unit: 'bpm', half: true },
      { key: 'spo2', label: 'SpO2', type: 'number', required: true, unit: '%', half: true },
    ],
  },
  {
    id: 3,
    name: 'Metabolic & Biochemistry Results',
    fields: [
      { key: 'hba1c', label: 'HbA1c', type: 'number', required: true, unit: '%', half: true },
      { key: 'fpg', label: 'Fasting Plasma Glucose', type: 'number', required: true, unit: 'mg/dl', half: true },
      { key: 'ppg', label: 'Postprandial Glucose (2h)', type: 'number', unit: 'mg/dl', half: true },
      { key: 'fastingInsulin', label: 'Fasting Insulin', type: 'number', half: true },
      { key: 'homaIr', label: 'HOMA-IR', type: 'number', half: true },
      { key: 'cPeptide', label: 'C-Peptide', type: 'number', half: true },
      { key: 'totalChol', label: 'Total Cholesterol', type: 'number', required: true, unit: 'mg/dl', half: true },
      { key: 'ldl', label: 'LDL Cholesterol', type: 'number', required: true, unit: 'mg/dl', half: true },
      { key: 'hdl', label: 'HDL Cholesterol', type: 'number', required: true, unit: 'mg/dl', half: true },
      { key: 'triglycerides', label: 'Triglycerides', type: 'number', required: true, unit: 'mg/dl', half: true },
      { key: 'ast', label: 'AST (SGOT)', type: 'number', required: true, unit: 'U/L', half: true },
      { key: 'alt', label: 'ALT (SGPT)', type: 'number', required: true, unit: 'U/L', half: true },
      { key: 'creatinine', label: 'Serum Creatinine', type: 'number', required: true, half: true },
      { key: 'egfr', label: 'eGFR (CKD-EPI)', type: 'number', required: true, unit: 'mL/min', half: true },
      { key: 'tsh', label: 'TSH', type: 'number', required: true, half: true },
      { key: 'vitD', label: '25-OH Vitamin D', type: 'number', required: true, unit: 'ng/mL', half: true },
      { key: 'vitB12', label: 'Vitamin B12', type: 'number', required: true, unit: 'pg/mL', half: true },
      { key: 'hsCrp', label: 'hsCRP', type: 'number', required: true, unit: 'mg/L', half: true },
      { key: 'albumin', label: 'Serum Albumin', type: 'number', half: true },
      { key: 'uricAcid', label: 'Serum Uric Acid', type: 'number', half: true },
      { key: 'cbc', label: 'CBC (Hb / WBC / Plt)', type: 'text', half: true },
    ],
  },
  {
    id: 4,
    name: 'Diabetes & Metabolic History',
    fields: [
      { key: 'durationT2dm', label: 'Duration of T2DM', type: 'text', required: true, half: true },
      { key: 'yearDiagnosis', label: 'Year of Diagnosis', type: 'text', half: true },
      { key: 'familyHistory', label: 'Family History of T2DM', type: 'radio', required: true, options: ['Yes', 'No', 'Unknown'], half: true },
      { key: 'priorAgents', label: 'Prior Anti-Diabetic Agents Used', type: 'checkbox-group',
        options: ['Metformin', 'SGLT-2 Inhibitor', 'DPP-4 Inhibitor', 'Insulin', 'Pioglitazone (TZD)', 'Alpha-Glucosidase Inhibitor', 'Prior GLP-1 Agonist', 'None'] },
      { key: 'glpAgent', label: 'Prior GLP-1 Agent', type: 'text', half: true, conditionalOn: { key: 'priorAgents', value: 'Prior GLP-1 Agonist' } },
      { key: 'glpReason', label: 'Reason Stopped', type: 'text', half: true, conditionalOn: { key: 'priorAgents', value: 'Prior GLP-1 Agonist' } },
      { key: 'lowestHba1c', label: 'Lowest HbA1c Ever', type: 'text', half: true },
      { key: 'highestHba1c', label: 'Highest HbA1c Ever', type: 'text', half: true },
    ],
  },
  {
    id: 5,
    name: 'Comorbidities & Medical History',
    fields: [
      { key: 'comorbidities', label: 'Comorbidities', type: 'checkbox-group',
        options: ['Hypertension', 'Dyslipidaemia', 'Diabetic Retinopathy', 'Coronary Artery Disease', 'Stroke / TIA', 'PCOS',
          'Prior Pancreatitis', 'NASH / NAFLD', 'CKD', 'Diabetic Neuropathy', 'Heart Failure', 'Hypothyroidism',
          'Obstructive Sleep Apnoea', 'Gallstones / Cholecystitis', 'GERD / Gastroparesis', 'Medullary Thyroid Cancer', 'MEN Type 2'] },
      { key: 'otherHistory', label: 'Other Significant History (Hospitalisations, Surgeries)', type: 'textarea' },
      { key: 'usgFindings', label: 'USG / Fibroscan Findings', type: 'text', half: true },
      { key: 'fundus', label: 'Fundus Examination Done', type: 'radio', options: ['Yes', 'No'], half: true },
    ],
  },
  {
    id: 6,
    name: 'Current Medications',
    fields: [
      // repeatable table handled specially in UI; stored as medications[]
      { key: 'supplements', label: 'Supplements / OTC / Herbal', type: 'text', half: true },
      { key: 'allergies', label: 'Known Drug Allergies (or None)', type: 'text', half: true },
    ],
  },
  {
    id: 7,
    name: 'Lifestyle & Environmental Factors',
    fields: [
      { key: 'occupation', label: 'Occupation', type: 'text', required: true, half: true },
      { key: 'dailySteps', label: 'Daily Steps (approx.)', type: 'number', half: true },
      { key: 'exerciseType', label: 'Exercise Type', type: 'text', half: true },
      { key: 'sessionDuration', label: 'Duration Per Session', type: 'text', half: true },
      { key: 'sleepDuration', label: 'Sleep Duration', type: 'text', required: true, half: true },
      { key: 'sleepQuality', label: 'Sleep Quality', type: 'select', required: true, options: ['Good', 'Fair', 'Poor'], half: true },
      { key: 'smoking', label: 'Smoking Status', type: 'select', required: true, options: ['Never', 'Ex-smoker', 'Current'], half: true },
      { key: 'activityLevel', label: 'Occupational Activity Level', type: 'select', required: true, options: ['Sedentary', 'Light', 'Moderate', 'Heavy'], half: true },
      { key: 'structuredExercise', label: 'Structured Exercise', type: 'select', required: true, options: ['None', 'Occasional', '1-2x/week', '3+x/week'], half: true },
      { key: 'alcohol', label: 'Alcohol Consumption', type: 'select', required: true, options: ['None', 'Occasional', 'Weekly', 'Daily'], half: true },
      { key: 'alcoholUnits', label: 'Units Per Week (Alcohol)', type: 'text', required: true, half: true },
      { key: 'waterIntake', label: 'Daily Water Intake', type: 'text', required: true, half: true },
      { key: 'stress', label: 'Psychosocial Stress Level', type: 'select', required: true, options: ['Low', 'Moderate', 'High'], half: true },
      { key: 'dietaryPattern', label: 'Dietary Pattern', type: 'checkbox-group', required: true, options: ['Vegan', 'Vegetarian', 'Eggetarian', 'Non-Vegetarian'] },
      { key: 'dominantDiet', label: 'Dominant Dietary Pattern', type: 'checkbox-group', required: true,
        options: ['High white rice/polished grains', 'High refined carbohydrates', 'High saturated / fried fat', 'Low dietary fibre',
          'High ultra-processed food', 'Irregular meal timing', 'High sugar / sweetened drinks', 'Balanced / Mediterranean-type'] },
    ],
  },
  {
    id: 8,
    name: 'Pharmacogenomics & Sample Information',
    fields: [
      { key: 'priorGenetic', label: 'Prior Genetic / Pharmacogenomic Testing', type: 'radio', required: true, options: ['Yes', 'No'], half: true },
      { key: 'genesTested', label: 'Gene(s) Tested and Results', type: 'text', half: true, conditionalOn: { key: 'priorGenetic', value: 'Yes' } },
      { key: 'sampleType', label: 'Sample Collected', type: 'checkbox-group', required: true, options: ['Buccal Swab (saliva)', 'Blood EDTA', 'DBS Card', 'Other'] },
      { key: 'kitId', label: 'Kit ID', type: 'text', required: true, half: true },
      { key: 'sampleDate', label: 'Date of Sample Collection', type: 'date', required: true, half: true },
      { key: 'sampleTime', label: 'Time of Sample Collection', type: 'time', required: true, half: true },
      { key: 'referringPhysician', label: 'Referring Physician', type: 'text', required: true, half: true },
    ],
  },
  {
    id: 9,
    name: 'Clinician Preliminary Assessment',
    fields: [
      { key: 'ascvdRisk', label: 'Overall ASCVD Risk', type: 'radio', required: true, options: ['Low', 'High'], half: true },
      { key: 'giRisk', label: 'GI Tolerability Risk', type: 'radio', required: true, options: ['Low', 'High'], half: true },
      { key: 'pancreatitisRisk', label: 'Pancreatitis Risk', type: 'radio', required: true, options: ['Low', 'High'], half: true },
      { key: 'contraindications', label: 'Absolute Contraindications Present', type: 'radio', options: ['Yes', 'No'], half: true },
      { key: 'contraDetails', label: 'Contraindication Details', type: 'text', conditionalOn: { key: 'contraindications', value: 'Yes' } },
      { key: 'startDose', label: 'Proposed Starting Dose', type: 'select', required: true, options: ['0.25 mg SC weekly', '0.5 mg SC weekly', 'Other'], half: true },
      { key: 'maintenanceDose', label: 'Target Maintenance Dose', type: 'select', required: true, options: ['0.5mg', '1.0mg', 'As tolerated'], half: true },
      { key: 'observations', label: 'Additional Observations', type: 'textarea' },
    ],
  },
  {
    id: 10,
    name: 'Key Variants — Genotyping',
    fields: [
      // editable gene table handled specially in UI; stored as geneVariants[]
    ],
  },
  {
    id: 11,
    name: 'Preview & Declaration',
    fields: [
      { key: 'signature', label: 'Patient Signature (type full name)', type: 'text', required: true, half: true },
      { key: 'signatureDate', label: 'Date & Time', type: 'datetime', required: true, half: true },
    ],
  },
];

export const GENE_VARIANTS = [
  'GLP1R rs10305420 (Ala316Thr)',
  'GLP1R rs6923761 (Gly168Ser)',
  'TCF7L2 rs7903146',
  'KCNQ1 rs2237892',
  'ADRB3 Trp64Arg (rs4994)',
  'FTO rs9939609',
];

export type FormData = Record<string, any>;
