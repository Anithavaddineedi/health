/**
 * Medical text analysis module.
 * Parses OCR-extracted text to identify medicines, dosages, diagnoses,
 * test values, reference ranges, and dates. Generates health summaries
 * in English and Telugu.
 *
 * NOTE: This is NOT a substitute for professional medical advice.
 */

interface ParsedMedication {
  name: string;
  dosage: string;
  frequency: string;
  prescribed_for: string;
}

interface ParsedRecord {
  record_type: string;
  fhir_resource_type: string;
  code: string;
  display_name: string;
  value: string;
  unit: string;
  reference_range: string;
  status: string;
  is_abnormal: boolean;
  notes: string;
}

interface AbnormalFinding {
  test_name: string;
  value: string;
  reference_range: string;
  explanation: string;
}

export interface AnalysisResult {
  medications: ParsedMedication[];
  records: ParsedRecord[];
  diagnoses: string[];
  dates: string[];
  document_type: string;
  summary_english: string;
  summary_telugu: string;
  abnormal_findings: AbnormalFinding[];
  key_findings: string[];
  recommendations: string[];
}

// Common medical test names and their reference ranges
const TEST_REFERENCE_RANGES: Record<string, { min: number; max: number; unit: string; range: string }> = {
  'hemoglobin': { min: 12, max: 17, unit: 'g/dL', range: '12.0 - 17.0 g/dL' },
  'hba1c': { min: 4, max: 5.6, unit: '%', range: '4.0% - 5.6%' },
  'glucose': { min: 70, max: 99, unit: 'mg/dL', range: '70 - 99 mg/dL' },
  'fasting glucose': { min: 70, max: 99, unit: 'mg/dL', range: '70 - 99 mg/dL' },
  'cholesterol': { min: 0, max: 200, unit: 'mg/dL', range: '< 200 mg/dL' },
  'total cholesterol': { min: 0, max: 200, unit: 'mg/dL', range: '< 200 mg/dL' },
  'ldl': { min: 0, max: 100, unit: 'mg/dL', range: '< 100 mg/dL' },
  'hdl': { min: 40, max: 100, unit: 'mg/dL', range: '40 - 100 mg/dL' },
  'triglycerides': { min: 0, max: 150, unit: 'mg/dL', range: '< 150 mg/dL' },
  'creatinine': { min: 0.6, max: 1.2, unit: 'mg/dL', range: '0.6 - 1.2 mg/dL' },
  'urea': { min: 7, max: 20, unit: 'mg/dL', range: '7 - 20 mg/dL' },
  'blood urea': { min: 7, max: 20, unit: 'mg/dL', range: '7 - 20 mg/dL' },
  'bilirubin': { min: 0.1, max: 1.2, unit: 'mg/dL', range: '0.1 - 1.2 mg/dL' },
  'platelet': { min: 150, max: 450, unit: 'x10^3/µL', range: '150 - 450 x10^3/µL' },
  'wbc': { min: 4, max: 11, unit: 'x10^3/µL', range: '4.0 - 11.0 x10^3/µL' },
  'rbc': { min: 4.2, max: 5.9, unit: 'x10^6/µL', range: '4.2 - 5.9 x10^6/µL' },
  'sodium': { min: 135, max: 145, unit: 'mmol/L', range: '135 - 145 mmol/L' },
  'potassium': { min: 3.5, max: 5.0, unit: 'mmol/L', range: '3.5 - 5.0 mmol/L' },
  'thyroid': { min: 0.4, max: 4.0, unit: 'mIU/L', range: '0.4 - 4.0 mIU/L' },
  'tsh': { min: 0.4, max: 4.0, unit: 'mIU/L', range: '0.4 - 4.0 mIU/L' },
  'vitamin d': { min: 30, max: 100, unit: 'ng/mL', range: '30 - 100 ng/mL' },
  'vitamin b12': { min: 200, max: 900, unit: 'pg/mL', range: '200 - 900 pg/mL' },
  'alt': { min: 7, max: 56, unit: 'U/L', range: '7 - 56 U/L' },
  'ast': { min: 10, max: 40, unit: 'U/L', range: '10 - 40 U/L' },
  'esr': { min: 0, max: 22, unit: 'mm/hr', range: '0 - 22 mm/hr' },
  'crp': { min: 0, max: 3, unit: 'mg/L', range: '0 - 3 mg/L' },
};

// Common medicine name patterns
const MEDICINE_KEYWORDS = [
  'tablet', 'tab', 'capsule', 'cap', 'syrup', 'injection', 'cream',
  'drops', 'suspension', 'ointment',
];

const COMMON_MEDICINES = [
  'metformin', 'amoxicillin', 'azithromycin', 'paracetamol', 'acetaminophen',
  'ibuprofen', 'aspirin', 'atorvastatin', 'omeprazole', 'pantoprazole',
  'amlodipine', 'metoprolol', 'losartan', 'telmisartan', 'rosuvastatin',
  'cephalexin', 'ciprofloxacin', 'doxycycline', 'prednisolone', 'dexamethasone',
  'insulin', 'glimepiride', 'gliclazide', 'montelukast', 'levocetirizine',
  'cetirizine', 'ranitidine', 'famotidine', 'diclofenac', 'naproxen',
  'tramadol', 'alprazolam', 'diazepam', 'furosemide', 'spironolactone',
  'hydrochlorothiazide', 'warfarin', 'clopidogrel', 'heparin',
];

// Telugu translations for common medical terms and summary phrases
const TELUGU_MEDICAL_TERMS: Record<string, string> = {
  'Hemoglobin': 'హిమోగ్లోబిన్',
  'Glucose': 'గ్లూకోస్ (రక్తంలో చక్కెర)',
  'Cholesterol': 'కొలెస్ట్రాల్',
  'Blood Pressure': 'రక్తపోటు',
  'Diabetes': 'మధుమేహం',
  'Thyroid': 'థైరాయిడ్',
  'Medication': 'మందు',
  'Dosage': 'మోతాదు',
  'Prescription': 'ప్రిస్క్రిప్షన్ (వైద్య నిర్దేశం)',
  'Diagnosis': 'వ్యాధి నిర్ధారణ',
  'Normal': 'సాధారణ (ప్రకృతికం)',
  'Abnormal': 'అసాధారణ (ప్రకృతికం కాదు)',
  'Reference Range': 'సాధారణ పరిధి',
  'No significant abnormalities detected': 'పెద్ద తిరోగమనాలు ఏవీ కనుగొనబడలేదు',
  'Please consult your doctor': 'దయచేసి మీ వైద్యుడిని సంప్రదించండి',
  'Health Summary': 'ఆరోగ్య సారాంశం',
  'Key Findings': 'ముఖ్య అంశాలు',
  'Recommendations': 'సూచనలు',
  'Medicines identified': 'గుర్తించబడిన మందులు',
  'Tests identified': 'గుర్తించబడిన పరీక్షలు',
  'Diagnoses identified': 'గుర్తించబడిన వ్యాధులు',
};

function toTelugu(text: string): string {
  let result = text;
  for (const [english, telugu] of Object.entries(TELUGU_MEDICAL_TERMS)) {
    result = result.split(english).join(telugu);
  }
  return result;
}

function extractDates(text: string): string[] {
  const datePatterns = [
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g,
    /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/gi,
    /\b(\d{4}-\d{2}-\d{2})\b/g,
  ];

  const dates = new Set<string>();
  for (const pattern of datePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      dates.add(match[0]);
    }
  }

  return Array.from(dates);
}

function extractMedications(text: string): ParsedMedication[] {
  const medications: ParsedMedication[] = [];
  const lines = text.split('\n');
  const foundMeds = new Set<string>();

  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim();
    if (!lowerLine) continue;

    // Check if line mentions a medicine form
    const hasMedKeyword = MEDICINE_KEYWORDS.some((kw) => lowerLine.includes(kw));

    // Check if line mentions a known medicine
    for (const med of COMMON_MEDICINES) {
      if (lowerLine.includes(med) && !foundMeds.has(med)) {
        foundMeds.add(med);

        // Try to extract dosage
        const dosageMatch = line.match(/(\d+(?:\.\d+)?)\s*(mg|ml|mcg|gm|g|IU|units?)\b/i);
        const dosage = dosageMatch ? `${dosageMatch[1]}${dosageMatch[2]}` : '';

        // Try to extract frequency
        const freqMatch = line.match(/(\d+[-–]?times?|once|twice|thrice|daily|bid|tid|qid|od|bd|hs|prn|sos)/i);
        let frequency = '';
        if (freqMatch) {
          const f = freqMatch[1].toLowerCase();
          if (f === 'od' || f === 'once' || f === '1-time' || f === '1time') frequency = 'Once daily';
          else if (f === 'bd' || f === 'bid' || f === 'twice' || f === '2-times' || f === '2times') frequency = 'Twice daily';
          else if (f === 'tid' || f === 'thrice' || f === '3-times' || f === '3times') frequency = 'Three times daily';
          else if (f === 'qid') frequency = 'Four times daily';
          else if (f === 'hs') frequency = 'At bedtime';
          else if (f === 'prn' || f === 'sos') frequency = 'As needed';
          else frequency = freqMatch[1];
        }

        // Capitalize medicine name
        const medName = med.charAt(0).toUpperCase() + med.slice(1);

        medications.push({
          name: medName,
          dosage,
          frequency,
          prescribed_for: '',
        });
      }
    }

    // Also try to extract from "Tablet/Capsule XYZ" patterns
    if (hasMedKeyword) {
      const tabMatch = line.match(/(?:tablet|tab|capsule|cap|syrup)\s+([A-Za-z][A-Za-z\s\-]+?)(?:\s+\d|\s+mg|\s+ml|$)/i);
      if (tabMatch) {
        const medName = tabMatch[1].trim();
        if (medName.length > 2 && !foundMeds.has(medName.toLowerCase())) {
          foundMeds.add(medName.toLowerCase());
          const dosageMatch = line.match(/(\d+(?:\.\d+)?)\s*(mg|ml|mcg|gm|g|IU|units?)\b/i);
          const dosage = dosageMatch ? `${dosageMatch[1]}${dosageMatch[2]}` : '';
          medications.push({
            name: medName,
            dosage,
            frequency: '',
            prescribed_for: '',
          });
        }
      }
    }
  }

  return medications;
}

function extractTestValues(text: string): ParsedRecord[] {
  const records: ParsedRecord[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim();
    if (!lowerLine) continue;

    for (const [testName, refRange] of Object.entries(TEST_REFERENCE_RANGES)) {
      if (lowerLine.includes(testName)) {
        // Try to extract numeric value
        const valueMatch = line.match(/(\d+(?:\.\d+)?)\s*(mg\/dl|g\/dl|mmol\/l|miu\/l|ng\/ml|pg\/ml|u\/l|mm\/hr|mg\/l|%|x10\^3\/µl|x10\^6\/µl|x10\^3\/uL|x10\^6\/uL)?/i);

        if (valueMatch) {
          const numericValue = parseFloat(valueMatch[1]);
          const unit = valueMatch[2] || refRange.unit;
          const isAbnormal = numericValue < refRange.min || numericValue > refRange.max;

          const displayName = testName
            .split(' ')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

          records.push({
            record_type: 'observation',
            fhir_resource_type: 'Observation',
            code: testName,
            display_name: displayName,
            value: valueMatch[1],
            unit,
            reference_range: refRange.range,
            status: isAbnormal ? 'abnormal' : 'normal',
            is_abnormal: isAbnormal,
            notes: isAbnormal
              ? `Value ${valueMatch[1]} ${unit} is outside the reference range of ${refRange.range}`
              : `Value is within normal range`,
          });
        }
      }
    }
  }

  return records;
}

function extractDiagnoses(text: string): string[] {
  const diagnoses = new Set<string>();
  const lowerText = text.toLowerCase();

  const knownDiagnoses = [
    'diabetes', 'hypertension', 'thyroid', 'hypothyroidism', 'hyperthyroidism',
    'anemia', 'asthma', 'copd', 'pneumonia', 'dengue', 'malaria', 'typhoid',
    'covid', 'influenza', 'bronchitis', 'gastritis', 'acid reflux', 'gerd',
    'arthritis', 'osteoporosis', 'migraine', 'epilepsy', 'depression',
    'anxiety', 'cholesterol', 'cardiac', 'kidney disease', 'liver disease',
    'hepatitis', 'appendicitis', 'dyslipidemia',
  ];

  for (const diagnosis of knownDiagnoses) {
    if (lowerText.includes(diagnosis)) {
      diagnoses.add(diagnosis.charAt(0).toUpperCase() + diagnosis.slice(1));
    }
  }

  // Also look for "Diagnosis:" patterns
  const diagMatch = text.match(/diagnos[ie]s?\s*[:\-]\s*([A-Za-z\s,]+?)(?:\n|$)/gi);
  if (diagMatch) {
    for (const match of diagMatch) {
      const parts = match.split(/[:\-]/)[1]?.trim().split(/[,;]/) || [];
      for (const part of parts) {
        const cleaned = part.trim();
        if (cleaned.length > 2 && cleaned.length < 50) {
          diagnoses.add(cleaned);
        }
      }
    }
  }

  return Array.from(diagnoses);
}

function detectDocumentType(text: string): string {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('prescription') || lowerText.includes('rx') || lowerText.includes('medicines')) {
    return 'prescription';
  }
  if (lowerText.includes('discharge') || lowerText.includes('discharged')) {
    return 'discharge';
  }
  if (lowerText.includes('report') || lowerText.includes('test') || lowerText.includes('laboratory') || lowerText.includes('lab')) {
    return 'report';
  }
  return 'other';
}

function generateSummary(
  medications: ParsedMedication[],
  records: ParsedRecord[],
  diagnoses: string[],
  documentType: string
): { english: string; telugu: string; abnormal: AbnormalFinding[]; keyFindings: string[]; recommendations: string[] } {
  const abnormalRecords = records.filter((r) => r.is_abnormal);
  const normalRecords = records.filter((r) => !r.is_abnormal);

  // Build English summary
  let english = `Health Document Analysis Summary\n\n`;
  english += `Document Type: ${documentType.charAt(0).toUpperCase() + documentType.slice(1)}\n\n`;

  if (diagnoses.length > 0) {
    english += `Identified Diagnoses: ${diagnoses.join(', ')}\n\n`;
  }

  if (medications.length > 0) {
    english += `Medications Found (${medications.length}):\n`;
    for (const med of medications) {
      english += `  - ${med.name}${med.dosage ? ` ${med.dosage}` : ''}${med.frequency ? `, ${med.frequency}` : ''}\n`;
    }
    english += '\n';
  }

  if (records.length > 0) {
    english += `Test Results (${records.length}):\n`;
    for (const rec of records) {
      const flag = rec.is_abnormal ? ' [ABNORMAL]' : ' [Normal]';
      english += `  - ${rec.display_name}: ${rec.value} ${rec.unit} (Ref: ${rec.reference_range})${flag}\n`;
    }
    english += '\n';
  }

  if (abnormalRecords.length > 0) {
    english += `Abnormal Findings (${abnormalRecords.length}):\n`;
    for (const rec of abnormalRecords) {
      english += `  - ${rec.display_name}: ${rec.value} ${rec.unit} is outside the normal range of ${rec.reference_range}. ${rec.notes}\n`;
    }
  } else if (records.length > 0) {
    english += `No significant abnormalities detected in the test results.\n`;
  }

  english += `\nDISCLAIMER: This AI-generated summary is for informational purposes only and does not replace professional medical advice. Please consult your doctor for proper interpretation and treatment.`;

  // Build Telugu summary
  let telugu = `ఆరోగ్య పత్రం విశ్లేషణ సారాంశం\n\n`;

  if (diagnoses.length > 0) {
    telugu += `గుర్తించబడిన వ్యాధులు: ${diagnoses.join(', ')}\n\n`;
  }

  if (medications.length > 0) {
    telugu += `గుర్తించబడిన మందులు (${medications.length}):\n`;
    for (const med of medications) {
      telugu += `  - ${med.name}${med.dosage ? ` ${med.dosage}` : ''}${med.frequency ? `, ${med.frequency}` : ''}\n`;
    }
    telugu += '\n';
  }

  if (records.length > 0) {
    telugu += `పరీక్ష ఫలితాలు (${records.length}):\n`;
    for (const rec of records) {
      const flag = rec.is_abnormal ? ' [అసాధారణ]' : ' [సాధారణ]';
      telugu += `  - ${rec.display_name}: ${rec.value} ${rec.unit} (సాధారణ పరిధి: ${rec.reference_range})${flag}\n`;
    }
    telugu += '\n';
  }

  if (abnormalRecords.length > 0) {
    telugu += `అసాధారణ ఫలితాలు (${abnormalRecords.length}):\n`;
    for (const rec of abnormalRecords) {
      telugu += `  - ${rec.display_name}: ${rec.value} ${rec.unit} సాధారణ పరిధి (${rec.reference_range}) నుండి బయట ఉంది.\n`;
    }
  } else if (records.length > 0) {
    telugu += `పెద్ద తిరోగమనాలు ఏవీ కనుగొనబడలేదు.\n`;
  }

  telugu += `\nహెచ్చరిక: ఈ AI సారాంశం కేవలం సమాచార ప్రయోజనాల కోసం మాత్రమే. ఇది వైద్య సలహాకు ప్రత్యామ్నాయం కాదు. దయచేసి మీ వైద్యుడిని సంప్రదించండి.`;

  // Abnormal findings detail
  const abnormal: AbnormalFinding[] = abnormalRecords.map((rec) => ({
    test_name: rec.display_name,
    value: `${rec.value} ${rec.unit}`,
    reference_range: rec.reference_range,
    explanation: rec.notes,
  }));

  // Key findings
  const keyFindings: string[] = [];
  if (diagnoses.length > 0) keyFindings.push(`${diagnoses.length} diagnosis(es) identified: ${diagnoses.join(', ')}`);
  if (medications.length > 0) keyFindings.push(`${medications.length} medication(s) found`);
  if (records.length > 0) keyFindings.push(`${records.length} test result(s) analyzed`);
  if (abnormalRecords.length > 0) keyFindings.push(`${abnormalRecords.length} abnormal value(s) need attention`);
  if (keyFindings.length === 0) keyFindings.push('No structured medical data could be extracted from this document');

  // Recommendations
  const recommendations: string[] = [];
  if (abnormalRecords.length > 0) {
    recommendations.push('Consult your doctor about the abnormal test values highlighted above');
  }
  if (medications.length > 0) {
    recommendations.push('Review your medication list with your pharmacist or doctor for interactions');
  }
  if (diagnoses.some((d) => d.toLowerCase().includes('diabetes'))) {
    recommendations.push('Monitor blood sugar regularly and follow a diabetic-friendly diet');
  }
  if (diagnoses.some((d) => d.toLowerCase().includes('hypertension'))) {
    recommendations.push('Monitor blood pressure daily and reduce salt intake');
  }
  recommendations.push('Keep all medical documents organized for future reference');
  recommendations.push('Follow up with your healthcare provider for a complete interpretation');

  return { english, telugu, abnormal, keyFindings, recommendations };
}

/**
 * Main analysis function — takes OCR text and returns structured medical data.
 */
export function analyzeMedicalText(text: string): AnalysisResult {
  if (!text || text.trim().length < 10) {
    return {
      medications: [],
      records: [],
      diagnoses: [],
      dates: [],
      document_type: 'other',
      summary_english:
        'No readable text was found in the uploaded document. The image may be unclear or the text may be too small. Try uploading a clearer image.',
      summary_telugu:
        'అప్‌లోడ్ చేసిన పత్రంలో చదవగలిగే టెక్స్ట్ కనుగొనబడలేదు. చిత్రం స్పష్టంగా లేకపోవచ్చు. స్పష్టమైన చిత్రాన్ని అప్‌లోడ్ చేయండి.',
      abnormal_findings: [],
      key_findings: ['No readable text found in document'],
      recommendations: ['Try uploading a clearer or higher-resolution image'],
    };
  }

  const medications = extractMedications(text);
  const records = extractTestValues(text);
  const diagnoses = extractDiagnoses(text);
  const dates = extractDates(text);
  const documentType = detectDocumentType(text);
  const { english, telugu, abnormal, keyFindings, recommendations } = generateSummary(
    medications,
    records,
    diagnoses,
    documentType
  );

  return {
    medications,
    records,
    diagnoses,
    dates,
    document_type: documentType,
    summary_english: english,
    summary_telugu: telugu,
    abnormal_findings: abnormal,
    key_findings: keyFindings,
    recommendations,
  };
}
