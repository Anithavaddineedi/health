export type Language = 'en' | 'te';

export interface Translation {
  // App / Sidebar
  appName: string;
  appTagline: string;
  navDashboard: string;
  navUpload: string;
  navRecords: string;
  navMedications: string;
  navAppointments: string;
  navHealthTrends: string;
  navInsurance: string;
  navTimeline: string;
  navSummaries: string;
  navProfile: string;
  navSettings: string;
  signOut: string;

  // Navbar
  welcome: string;

  // Login page
  loginTitle: string;
  loginSubtitle: string;
  signIn: string;
  signUp: string;
  fullName: string;
  fullNamePlaceholder: string;
  email: string;
  password: string;
  passwordPlaceholder: string;
  passwordShort: string;
  createAccount: string;
  forgotPassword: string;
  sendResetEmail: string;
  backToSignIn: string;
  noAccount: string;
  haveAccount: string;
  signupEmailSent: string;
  resetEmailSent: string;
  newPassword: string;
  updatePassword: string;
  passwordUpdated: string;
  continue: string;
  privacyNotice: string;
  privacyNoticeText: string;

  // Disclaimer
  disclaimerTitle: string;
  disclaimerCompact: string;
  disclaimerBody1: string;
  disclaimerNot: string;
  disclaimerBody2: string;
  disclaimerOcr: string;

  // Dashboard
  dashboardTitle: string;
  dashboardSubtitle: string;
  documents: string;
  activeMedications: string;
  medicalRecords: string;
  abnormalValues: string;
  recentDocuments: string;
  upload: string;
  noDocumentsYet: string;
  uploadFirstDocument: string;
  quickActions: string;
  uploadDocument: string;
  bookDoctor: string;
  viewTimeline: string;
  aiSummaries: string;
  updateProfile: string;
  summaryStats: string;
  summariesGenerated: string;
  totalRecords: string;
  abnormalFlags: string;

  // Upload page
  uploadMedicalDocument: string;
  uploadSubtitle: string;
  clickToUpload: string;
  fileTypes: string;
  remove: string;
  processDocument: string;
  statusIdle: string;
  statusUploading: string;
  statusOcr: string;
  statusAnalyzing: string;
  statusSaving: string;
  statusDone: string;
  statusError: string;
  documentProcessed: string;
  extractedCount: string;
  medicationsFound: string;
  testResults: string;
  aiHealthSummaryEn: string;
  aiHealthSummaryTe: string;
  uploadAnother: string;
  medicine: string;
  dosage: string;
  frequency: string;
  test: string;
  value: string;
  referenceRange: string;
  status: string;
  abnormal: string;
  normal: string;

  // Medical Records page
  recordsTitle: string;
  recordsSubtitle: string;
  searchTest: string;
  allRecords: string;
  abnormalOnly: string;
  normalOnly: string;
  noRecordsYet: string;
  noRecordsMatch: string;
  fhirType: string;
  testName: string;
  date: string;
  showingRecords: string;
  deleteRecordConfirm: string;

  // Medications page
  medicationsTitle: string;
  medicationsSubtitle: string;
  addMedication: string;
  editMedication: string;
  addNewMedication: string;
  medicineName: string;
  startDate: string;
  endDate: string;
  prescribedFor: string;
  notes: string;
  addMedicationBtn: string;
  updateMedication: string;
  noMedicationsYet: string;
  addFirstMedication: string;
  activeMeds: string;
  pastMeds: string;
  active: string;
  completed: string;
  discontinued: string;
  ongoing: string;
  edit: string;
  deleteMedConfirm: string;
  select: string;
  male: string;
  female: string;
  other: string;

  // Appointments page
  appointmentsTitle: string;
  appointmentsSubtitle: string;
  scheduleAppointment: string;
  doctor: string;
  specialty: string;
  hospital: string;
  experience: string;
  appointmentDate: string;
  preferredTime: string;
  visitType: string;
  symptoms: string;
  bookAppointment: string;
  upcomingAppointments: string;
  noAppointmentsYet: string;
  cancelAppointment: string;
  inPerson: string;
  videoConsult: string;
  selectDoctor: string;
  medicationReminder: string;
  setReminder: string;
  updateReminder: string;
  removeReminder: string;
  reminderEnabled: string;
  reminderPermissionHelp: string;
  startVideoCall: string;
  waitingForPatient: string;
  videoCall: string;
  callArjun: string;
  directCallSubtitle: string;
  incomingCallsForArjun: string;
  noIncomingCalls: string;
  answerCall: string;
  refreshCalls: string;
  incomingPatientCall: string;
  callConnecting: string;
  callConnected: string;
  callEnd: string;

  // Timeline page
  timelineTitle: string;
  timelineSubtitle: string;
  addEvent: string;
  addTimelineEvent: string;
  eventType: string;
  title: string;
  description: string;
  eventVisit: string;
  eventTest: string;
  eventPrescription: string;
  eventProcedure: string;
  eventDiagnosis: string;
  noTimelineEvents: string;
  addFirstEvent: string;
  deleteEventConfirm: string;

  // Profile page
  profileTitle: string;
  profileSubtitle: string;
  yourName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  phone: string;
  emergencyContact: string;
  allergies: string;
  allergiesPlaceholder: string;
  chronicConditions: string;
  chronicConditionsPlaceholder: string;
  abhaLinking: string;
  linked: string;
  abhaDescription: string;
  noAbhaLinked: string;
  linkAbha: string;
  relinkAbha: string;
  saveProfile: string;
  profileSaved: string;
  profileSummary: string;
  notSet: string;
  noneRecorded: string;
  notLinked: string;
  privacy: string;
  privacyText: string;

  // Summaries page
  summariesTitle: string;
  summariesSubtitle: string;
  noSummariesYet: string;
  healthSummary: string;
  english: string;
  telugu: string;
  abnormalFindings: string;
  keyFindings: string;
  recommendations: string;

  // Settings page
  settingsTitle: string;
  settingsSubtitle: string;
  languageSection: string;
  languageEn: string;
  languageTe: string;
  languageEnDesc: string;
  languageTeDesc: string;
  currentLanguage: string;
  aboutSection: string;
  aboutText: string;
  version: string;

  // Generic
  loading: string;
  cancel: string;
  confirm: string;
  delete: string;
}

export const translations: Record<Language, Translation> = {
  en: {
    appName: 'Health Copilot',
    appTagline: 'AI Health Assistant',
    navDashboard: 'Dashboard',
    navUpload: 'Upload Document',
    navRecords: 'Medical Records',
    navMedications: 'Medications',
    navAppointments: 'Book Doctor',
    navHealthTrends: 'Health Trends',
    navInsurance: 'Insurance Recommendations',
    navTimeline: 'Timeline',
    navSummaries: 'AI Summaries',
    navProfile: 'Health Profile',
    navSettings: 'Settings',
    signOut: 'Sign Out',
    welcome: 'Welcome',
    loginTitle: 'AI Health Copilot',
    loginSubtitle: 'Your personal AI-powered health assistant',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter your full name',
    email: 'Email',
    password: 'Password',
    passwordPlaceholder: 'At least 6 characters',
    passwordShort: 'Password must be at least 6 characters long.',
    createAccount: 'Create Account',
    forgotPassword: 'Forgot password?',
    sendResetEmail: 'Send reset link',
    backToSignIn: 'Back to sign in',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    signupEmailSent: 'Check your email to confirm your account before signing in.',
    resetEmailSent: 'If an account exists for this email, a password reset link has been sent.',
    newPassword: 'New password',
    updatePassword: 'Update password',
    passwordUpdated: 'Your password has been updated.',
    continue: 'Continue',
    privacyNotice: 'Privacy Notice:',
    privacyNoticeText: 'Your health data is protected with row-level security. Only you can access your own records.',
    disclaimerTitle: 'Medical Disclaimer:',
    disclaimerCompact: 'AI summaries are informational only — not a substitute for professional medical advice.',
    disclaimerBody1: 'This application provides AI-generated health summaries for informational and educational purposes only. They are',
    disclaimerNot: 'not',
    disclaimerBody2: 'a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider with any questions about your medical condition. Never disregard professional medical advice because of information found in this app.',
    disclaimerOcr: 'OCR extraction may contain errors. Always verify extracted data against your original documents.',
    dashboardTitle: 'Health Dashboard',
    dashboardSubtitle: 'Overview of your health records and activity',
    documents: 'Documents',
    activeMedications: 'Active Medications',
    medicalRecords: 'Medical Records',
    abnormalValues: 'Abnormal Values',
    recentDocuments: 'Recent Documents',
    upload: 'Upload',
    noDocumentsYet: 'No documents uploaded yet',
    uploadFirstDocument: 'Upload your first document',
    quickActions: 'Quick Actions',
    uploadDocument: 'Upload Document',
    bookDoctor: 'Book Doctor',
    viewTimeline: 'View Timeline',
    aiSummaries: 'AI Summaries',
    updateProfile: 'Update Profile',
    summaryStats: 'Summary Stats',
    summariesGenerated: 'AI Summaries Generated',
    totalRecords: 'Total Records',
    abnormalFlags: 'Abnormal Flags',
    uploadMedicalDocument: 'Upload Medical Document',
    uploadSubtitle: 'Upload prescriptions, lab reports, or discharge summaries as PDF or images. OCR will extract text and AI will analyze the content.',
    clickToUpload: 'Click to upload or drag and drop',
    fileTypes: 'PDF, PNG, JPG, JPEG, BMP, TIFF, WebP (max 10MB)',
    remove: 'Remove',
    processDocument: 'Process Document with OCR & AI',
    statusIdle: 'Ready to process',
    statusUploading: 'Uploading file to secure storage...',
    statusOcr: 'Extracting text with OCR...',
    statusAnalyzing: 'Analyzing medical content with AI...',
    statusSaving: 'Saving extracted data to your health records...',
    statusDone: 'Processing complete!',
    statusError: 'Processing failed',
    documentProcessed: 'Document processed successfully!',
    extractedCount: 'Extracted',
    medicationsFound: 'Medications Found',
    testResults: 'Test Results',
    aiHealthSummaryEn: 'AI Health Summary (English)',
    aiHealthSummaryTe: 'AI Health Summary (Telugu)',
    uploadAnother: 'Upload Another Document',
    medicine: 'Medicine',
    dosage: 'Dosage',
    frequency: 'Frequency',
    test: 'Test',
    value: 'Value',
    referenceRange: 'Reference Range',
    status: 'Status',
    abnormal: 'Abnormal',
    normal: 'Normal',
    recordsTitle: 'Medical Records',
    recordsSubtitle: 'FHIR-style structured health records extracted from your documents',
    searchTest: 'Search by test name or code...',
    allRecords: 'All Records',
    abnormalOnly: 'Abnormal Only',
    normalOnly: 'Normal Only',
    noRecordsYet: 'No medical records yet. Upload a document to get started.',
    noRecordsMatch: 'No records match your search.',
    fhirType: 'FHIR Type',
    testName: 'Test / Name',
    date: 'Date',
    showingRecords: 'Showing',
    deleteRecordConfirm: 'Delete this medical record?',
    medicationsTitle: 'Medications',
    medicationsSubtitle: 'Track your medicines and prescription history',
    addMedication: 'Add Medication',
    editMedication: 'Edit Medication',
    addNewMedication: 'Add New Medication',
    medicineName: 'Medicine Name *',
    startDate: 'Start Date',
    endDate: 'End Date',
    prescribedFor: 'Prescribed For',
    notes: 'Notes',
    addMedicationBtn: 'Add Medication',
    updateMedication: 'Update Medication',
    noMedicationsYet: 'No medications tracked yet.',
    addFirstMedication: 'Add your first medication',
    activeMeds: 'Active Medications',
    pastMeds: 'Past Medications',
    active: 'Active',
    completed: 'Completed',
    discontinued: 'Discontinued',
    ongoing: 'Ongoing',
    edit: 'Edit',
    deleteMedConfirm: 'Delete this medication?',
    select: 'Select',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    appointmentsTitle: 'Book a Doctor',
    appointmentsSubtitle: 'Schedule a consultation or telemedicine visit with a specialist.',
    scheduleAppointment: 'Schedule Appointment',
    doctor: 'Doctor',
    specialty: 'Specialty',
    hospital: 'Hospital',
    experience: 'Experience',
    appointmentDate: 'Appointment Date',
    preferredTime: 'Preferred Time',
    visitType: 'Visit Type',
    symptoms: 'Symptoms / Reason for Visit',
    bookAppointment: 'Book Appointment',
    upcomingAppointments: 'Upcoming Appointments',
    noAppointmentsYet: 'No appointments booked yet.',
    cancelAppointment: 'Cancel',
    inPerson: 'In-Person',
    videoConsult: 'Video Consult',
    selectDoctor: 'Select a doctor',
    medicationReminder: 'Medicine reminder',
    setReminder: 'Set reminder',
    updateReminder: 'Update reminder',
    removeReminder: 'Remove reminder',
    reminderEnabled: 'Reminder set',
    reminderPermissionHelp: 'Keep Health Copilot open and allow browser notifications to receive reminders.',
    startVideoCall: 'Start video call',
    waitingForPatient: 'Waiting for the patient to start the call.',
    videoCall: 'Video call',
    callArjun: 'Call Dr. Arjun',
    directCallSubtitle: 'Call Dr. Arjun directly. He must be signed in and accept the call.',
    incomingCallsForArjun: 'Incoming calls for Dr. Arjun',
    noIncomingCalls: 'No incoming calls right now. Keep this page open to receive calls.',
    answerCall: 'Answer',
    refreshCalls: 'Refresh',
    incomingPatientCall: 'Patient video call',
    callConnecting: 'Connecting...',
    callConnected: 'Connected',
    callEnd: 'End call',
    timelineTitle: 'Medical Timeline',
    timelineSubtitle: 'Chronological history of your medical events',
    addEvent: 'Add Event',
    addTimelineEvent: 'Add Timeline Event',
    eventType: 'Event Type',
    title: 'Title *',
    description: 'Description',
    eventVisit: 'Visit',
    eventTest: 'Test',
    eventPrescription: 'Prescription',
    eventProcedure: 'Procedure',
    eventDiagnosis: 'Diagnosis',
    noTimelineEvents: 'No timeline events yet.',
    addFirstEvent: 'Add your first event',
    deleteEventConfirm: 'Delete this timeline event?',
    profileTitle: 'Health Profile',
    profileSubtitle: 'Your personal health information and ABHA ID linking',
    yourName: 'Your Name',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    bloodGroup: 'Blood Group',
    phone: 'Phone',
    emergencyContact: 'Emergency Contact',
    allergies: 'Allergies (comma-separated)',
    allergiesPlaceholder: 'e.g., Penicillin, Dust',
    chronicConditions: 'Chronic Conditions (comma-separated)',
    chronicConditionsPlaceholder: 'e.g., Diabetes, Hypertension',
    abhaLinking: 'ABHA ID Linking',
    linked: 'ID saved (not verified)',
    abhaDescription: 'Enter an ABHA ID you already have. This app saves the ID to your profile but does not verify or link with the ABHA system.',
    noAbhaLinked: 'No ABHA ID linked yet',
    linkAbha: 'Link ABHA',
    relinkAbha: 'Relink',
    saveProfile: 'Save Profile',
    profileSaved: 'Profile saved successfully!',
    profileSummary: 'Profile Summary',
    notSet: 'Not set',
    noneRecorded: 'None recorded',
    notLinked: 'Not linked',
    privacy: 'Privacy',
    privacyText: 'Your health data is protected with row-level security. Only you can access your records. All data is encrypted and stored securely.',
    summariesTitle: 'AI Health Summaries',
    summariesSubtitle: 'AI-generated summaries of your medical documents in English and Telugu',
    noSummariesYet: 'No AI summaries yet. Upload a medical document to generate one.',
    healthSummary: 'Health Summary',
    english: 'English',
    telugu: 'Telugu',
    abnormalFindings: 'Abnormal Findings',
    keyFindings: 'Key Findings',
    recommendations: 'Recommendations',
    settingsTitle: 'Settings',
    settingsSubtitle: 'Manage your language and app preferences',
    languageSection: 'Language / భాష',
    languageEn: 'English',
    languageTe: 'తెలుగు (Telugu)',
    languageEnDesc: 'View the entire app in English',
    languageTeDesc: 'మొత్తం యాప్‌ను తెలుగులో చూడండి',
    currentLanguage: 'Current language',
    aboutSection: 'About',
    aboutText: 'AI Health Copilot is a personal health assistant that helps you manage medical documents, track medications, and get AI-generated health summaries. Built for hackathon demonstration purposes.',
    version: 'Version 1.0.0',
    loading: 'Loading...',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
  },

  te: {
    appName: 'హెల్త్ కోపైలట్',
    appTagline: 'AI ఆరోగ్య సహాయకుడు',
    navDashboard: 'డాష్‌బోర్డ్',
    navUpload: 'పత్రం అప్‌లోడ్',
    navRecords: 'వైద్య రికార్డులు',
    navMedications: 'మందులు',
    navAppointments: 'డాక్టర్ బుక్ చేయండి',
    navHealthTrends: 'ఆరోగ్య ధోరణులు',
    navInsurance: 'ఆరోగ్య బీమా సూచనలు',
    navTimeline: 'కాలక్రమం',
    navSummaries: 'AI సారాంశాలు',
    navProfile: 'ఆరోగ్య ప్రొఫైల్',
    navSettings: 'సెట్టింగ్‌లు',
    signOut: 'సైన్ అవుట్',
    welcome: 'స్వాగతం',
    loginTitle: 'AI హెల్త్ కోపైలట్',
    loginSubtitle: 'మీ వ్యక్తిగత AI-ఆధారిత ఆరోగ్య సహాయకుడు',
    signIn: 'సైన్ ఇన్',
    signUp: 'సైన్ అప్',
    fullName: 'పూర్తి పేరు',
    fullNamePlaceholder: 'మీ పూర్తి పేరు నమోదు చేయండి',
    email: 'ఇమెయిల్',
    password: 'పాస్‌వర్డ్',
    passwordPlaceholder: 'కనీసం 6 అక్షరాలు',
    passwordShort: 'పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి.',
    createAccount: 'ఖాతా సృష్టించండి',
    forgotPassword: 'పాస్‌వర్డ్ మర్చిపోయారా?',
    sendResetEmail: 'రీసెట్ లింక్ పంపండి',
    backToSignIn: 'సైన్ ఇన్‌కు తిరిగి వెళ్లండి',
    noAccount: 'ఖాతా లేదా?',
    haveAccount: 'ఇప్పటికే ఖాతా ఉందా?',
    signupEmailSent: 'సైన్ ఇన్ చేయడానికి ముందు ఖాతాను నిర్ధారించడానికి మీ ఇమెయిల్ చూడండి.',
    resetEmailSent: 'ఈ ఇమెయిల్‌కు ఖాతా ఉంటే, పాస్‌వర్డ్ రీసెట్ లింక్ పంపబడింది.',
    newPassword: 'కొత్త పాస్‌వర్డ్',
    updatePassword: 'పాస్‌వర్డ్‌ను నవీకరించండి',
    passwordUpdated: 'మీ పాస్‌వర్డ్ నవీకరించబడింది.',
    continue: 'కొనసాగించండి',
    privacyNotice: 'గోప్యతా సూచన:',
    privacyNoticeText: 'మీ ఆరోగ్య డేటా రో-లెవల్ సెక్యూరిటీతో రక్షించబడింది. మీరు మాత్రమే మీ రికార్డులను యాక్సెస్ చేయగలరు.',
    disclaimerTitle: 'వైద్య హెచ్చరిక:',
    disclaimerCompact: 'AI సారాంశాలు కేవలం సమాచార ప్రయోజనాల కోసం — వృత్తిపరమైన వైద్య సలహాకు ప్రత్యామ్నాయం కాదు.',
    disclaimerBody1: 'ఈ యాప్ AI-ఉత్పత్తి ఆరోగ్య సారాంశాలను కేవలం సమాచార మరియు విద్యా ప్రయోజనాల కోసం అందిస్తుంది. అవి',
    disclaimerNot: 'కాదు',
    disclaimerBody2: 'వృత్తిపరమైన వైద్య సలహా, రోగ నిర్ధారణ, లేదా చికిత్సకు ప్రత్యామ్నాయం. మీ వైద్య పరిస్థితి గురించి ఏవైనా ప్రశ్నలతో ఎల్లప్పుడూ ఒక అర్హత కలిగిన ఆరోగ్య సంరక్షణ ప్రదాతను సంప్రదించండి. ఈ యాప్‌లో ఉన్న సమాచారం కారణంగా వృత్తిపరమైన వైద్య సలహాను ఎప్పుడూ విస్మరించవద్దు.',
    disclaimerOcr: 'OCR సంగ్రహణలో లోపాలు ఉండవచ్చు. సంగ్రహించబడిన డేటాను ఎల్లప్పుడూ మీ అసలు పత్రాలతో సరిచేసుకోండి.',
    dashboardTitle: 'ఆరోగ్య డాష్‌బోర్డ్',
    dashboardSubtitle: 'మీ ఆరోగ్య రికార్డులు మరియు కార్యాచరణ అవలోకనం',
    documents: 'పత్రాలు',
    activeMedications: 'క్రియాశీల మందులు',
    medicalRecords: 'వైద్య రికార్డులు',
    abnormalValues: 'అసాధారణ విలువలు',
    recentDocuments: 'ఇటీవలి పత్రాలు',
    upload: 'అప్‌లోడ్',
    noDocumentsYet: 'ఇంకా పత్రాలు అప్‌లోడ్ చేయబడలేదు',
    uploadFirstDocument: 'మీ మొదటి పత్రం అప్‌లోడ్ చేయండి',
    quickActions: 'త్వరిత చర్యలు',
    uploadDocument: 'పత్రం అప్‌లోడ్',
    bookDoctor: 'డాక్టర్ బుక్ చేయండి',
    viewTimeline: 'కాలక్రమం చూడండి',
    aiSummaries: 'AI సారాంశాలు',
    updateProfile: 'ప్రొఫైల్ నవీకరించండి',
    summaryStats: 'సారాంశ గణాంకాలు',
    summariesGenerated: 'AI సారాంశాలు రూపొందించబడ్డాయి',
    totalRecords: 'మొత్తం రికార్డులు',
    abnormalFlags: 'అసాధారణ జెండాలు',
    uploadMedicalDocument: 'వైద్య పత్రం అప్‌లోడ్',
    uploadSubtitle: 'ప్రిస్క్రిప్షన్‌లు, ల్యాబ్ రిపోర్టులు, లేదా డిశ్చార్జ్ సారాంశాలను PDF లేదా చిత్రాలుగా అప్‌లోడ్ చేయండి. OCR టెక్స్ట్‌ను సంగ్రహిస్తుంది మరియు AI విషయాన్ని విశ్లేషిస్తుంది.',
    clickToUpload: 'అప్‌లోడ్ చేయడానికి క్లిక్ చేయండి లేదా డ్రాగ్ చేసి వదలండి',
    fileTypes: 'PDF, PNG, JPG, JPEG, BMP, TIFF, WebP (గరిష్ట 10MB)',
    remove: 'తొలగించు',
    processDocument: 'OCR & AIతో పత్రాన్ని ప్రాసెస్ చేయండి',
    statusIdle: 'ప్రాసెస్ చేయడానికి సిద్ధం',
    statusUploading: 'ఫైల్‌ను సురక్షిత నిల్వకు అప్‌లోడ్ చేస్తోంది...',
    statusOcr: 'OCRతో టెక్స్ట్ సంగ్రహిస్తోంది...',
    statusAnalyzing: 'AIతో వైద్య విషయాన్ని విశ్లేషిస్తోంది...',
    statusSaving: 'సంగ్రహించబడిన డేటాను మీ ఆరోగ్య రికార్డులకు సేవ్ చేస్తోంది...',
    statusDone: 'ప్రాసెసింగ్ పూర్తయింది!',
    statusError: 'ప్రాసెసింగ్ విఫలమైంది',
    documentProcessed: 'పత్రం విజయవంతంగా ప్రాసెస్ అయింది!',
    extractedCount: 'సంగ్రహించబడింది',
    medicationsFound: 'కనుగొనబడిన మందులు',
    testResults: 'పరీక్ష ఫలితాలు',
    aiHealthSummaryEn: 'AI ఆరోగ్య సారాంశం (ఇంగ్లీష్)',
    aiHealthSummaryTe: 'AI ఆరోగ్య సారాంశం (తెలుగు)',
    uploadAnother: 'మరొక పత్రం అప్‌లోడ్ చేయండి',
    medicine: 'మందు',
    dosage: 'మోతాదు',
    frequency: 'తరచుదనం',
    test: 'పరీక్ష',
    value: 'విలువ',
    referenceRange: 'సూచిత పరిధి',
    status: 'స్థితి',
    abnormal: 'అసాధారణ',
    normal: 'సాధారణ',
    recordsTitle: 'వైద్య రికార్డులు',
    recordsSubtitle: 'మీ పత్రాల నుండి సంగ్రహించబడిన FHIR-శైలి నిర్మాణ ఆరోగ్య రికార్డులు',
    searchTest: 'పరీక్ష పేరు లేదా కోడ్ ద్వారా శోధించండి...',
    allRecords: 'అన్ని రికార్డులు',
    abnormalOnly: 'అసాధారణ మాత్రమే',
    normalOnly: 'సాధారణ మాత్రమే',
    noRecordsYet: 'ఇంకా వైద్య రికార్డులు లేవు. ప్రారంభించడానికి ఒక పత్రం అప్‌లోడ్ చేయండి.',
    noRecordsMatch: 'మీ శోధనకు సరిపోలే రికార్డులు లేవు.',
    fhirType: 'FHIR రకం',
    testName: 'పరీక్ష / పేరు',
    date: 'తేదీ',
    showingRecords: 'చూపిస్తోంది',
    deleteRecordConfirm: 'ఈ వైద్య రికార్డును తొలగించాలా?',
    medicationsTitle: 'మందులు',
    medicationsSubtitle: 'మీ మందులు మరియు ప్రిస్క్రిప్షన్ చరిత్రను ట్రాక్ చేయండి',
    addMedication: 'మందు జోడించండి',
    editMedication: 'మందు సవరించండి',
    addNewMedication: 'కొత్త మందు జోడించండి',
    medicineName: 'మందు పేరు *',
    startDate: 'ప్రారంభ తేదీ',
    endDate: 'ముగింపు తేదీ',
    prescribedFor: 'దేనికి సూచించబడింది',
    notes: 'గమనికలు',
    addMedicationBtn: 'మందు జోడించండి',
    updateMedication: 'మందు నవీకరించండి',
    noMedicationsYet: 'ఇంకా మందులు ట్రాక్ చేయబడలేదు.',
    addFirstMedication: 'మీ మొదటి మందు జోడించండి',
    activeMeds: 'క్రియాశీల మందులు',
    pastMeds: 'గత మందులు',
    active: 'క్రియాశీల',
    completed: 'పూర్తయింది',
    discontinued: 'నిలిపివేయబడింది',
    ongoing: 'కొనసాగుతోంది',
    edit: 'సవరించు',
    deleteMedConfirm: 'ఈ మందును తొలగించాలా?',
    select: 'ఎంచుకోండి',
    male: 'పురుషుడు',
    female: 'స్త్రీ',
    other: 'ఇతర',
    appointmentsTitle: 'డాక్టర్ బుక్ చేయండి',
    appointmentsSubtitle: 'నిపుణుడితో కన్సల్టేషన్ లేదా టెలీమెడిసిన్ సందర్శనను షెడ్యూల్ చేయండి.',
    scheduleAppointment: 'అపాయింట్‌మెంట్ షెడ్యూల్ చేయండి',
    doctor: 'డాక్టర్',
    specialty: 'నిపుణులు',
    hospital: 'హాస్పిటల్',
    experience: 'అనుభవం',
    appointmentDate: 'అపాయింట్‌మెంట్ తేదీ',
    preferredTime: 'ఇష్టపడే సమయం',
    visitType: 'సందర్శన రకం',
    symptoms: 'లక్షణాలు / సందర్శన కారణం',
    bookAppointment: 'అపాయింట్‌మెంట్ బుక్ చేయండి',
    upcomingAppointments: 'వచ్చే అపాయింట్‌మెంట్లు',
    noAppointmentsYet: 'ఇంకా అపాయింట్‌మెంట్లు బుక్ చేయబడలేదు.',
    cancelAppointment: 'రద్దు చేయండి',
    inPerson: 'ప్రత్యక్ష',
    videoConsult: 'వీడియో కన్సల్ట్',
    selectDoctor: 'డాక్టర్‌ను ఎంచుకోండి',
    medicationReminder: 'మందుల రిమైండర్',
    setReminder: 'రిమైండర్ సెట్ చేయండి',
    updateReminder: 'రిమైండర్ నవీకరించండి',
    removeReminder: 'రిమైండర్ తొలగించండి',
    reminderEnabled: 'రిమైండర్ సెట్ అయింది',
    reminderPermissionHelp: 'రిమైండర్‌ల కోసం హెల్త్ కోపైలట్‌ను తెరిచి ఉంచి బ్రౌజర్ నోటిఫికేషన్‌లను అనుమతించండి.',
    startVideoCall: 'వీడియో కాల్ ప్రారంభించండి',
    waitingForPatient: 'రోగి కాల్ ప్రారంభించే వరకు వేచి ఉంది.',
    videoCall: 'వీడియో కాల్',
    callArjun: 'డాక్టర్ అర్జున్‌కు కాల్ చేయండి',
    directCallSubtitle: 'డాక్టర్ అర్జున్‌కు నేరుగా కాల్ చేయండి. ఆయన సైన్ ఇన్ చేసి కాల్‌ను స్వీకరించాలి.',
    incomingCallsForArjun: 'డాక్టర్ అర్జున్‌కు వచ్చిన కాల్స్',
    noIncomingCalls: 'ప్రస్తుతం కాల్స్ లేవు. కాల్స్ స్వీకరించడానికి ఈ పేజీని తెరిచి ఉంచండి.',
    answerCall: 'స్వీకరించండి',
    refreshCalls: 'రిఫ్రెష్',
    incomingPatientCall: 'రోగి వీడియో కాల్',
    callConnecting: 'కనెక్ట్ అవుతోంది...',
    callConnected: 'కనెక్ట్ అయింది',
    callEnd: 'కాల్ ముగించండి',
    timelineTitle: 'వైద్య కాలక్రమం',
    timelineSubtitle: 'మీ వైద్య సంఘటనల కాలక్రమ చరిత్ర',
    addEvent: 'సంఘటన జోడించండి',
    addTimelineEvent: 'కాలక్రమ సంఘటన జోడించండి',
    eventType: 'సంఘటన రకం',
    title: 'శీర్షిక *',
    description: 'వివరణ',
    eventVisit: 'సందర్శన',
    eventTest: 'పరీక్ష',
    eventPrescription: 'ప్రిస్క్రిప్షన్',
    eventProcedure: 'ప్రక్రియ',
    eventDiagnosis: 'నిర్ధారణ',
    noTimelineEvents: 'ఇంకా కాలక్రమ సంఘటనలు లేవు.',
    addFirstEvent: 'మీ మొదటి సంఘటన జోడించండి',
    deleteEventConfirm: 'ఈ కాలక్రమ సంఘటనను తొలగించాలా?',
    profileTitle: 'ఆరోగ్య ప్రొఫైల్',
    profileSubtitle: 'మీ వ్యక్తిగత ఆరోగ్య సమాచారం మరియు ABHA ID లింకింగ్',
    yourName: 'మీ పేరు',
    dateOfBirth: 'పుట్టిన తేదీ',
    gender: 'లింగం',
    bloodGroup: 'రక్త వర్గం',
    phone: 'ఫోన్',
    emergencyContact: 'అత్యవసర సంప్రదింపు',
    allergies: 'అలర్జీలు (కామా-వేర్వేరుగా)',
    allergiesPlaceholder: 'ఉదా., పెనిసిలిన్, ధూళి',
    chronicConditions: 'దీర్ఘకాలిక పరిస్థితులు (కామా-వేర్వేరుగా)',
    chronicConditionsPlaceholder: 'ఉదా., మధుమేహం, రక్తపోటు',
    abhaLinking: 'ABHA ID లింకింగ్',
    linked: 'ID సేవ్ అయింది (ధృవీకరించబడలేదు)',
    abhaDescription: 'మీకు ఇప్పటికే ఉన్న ABHA IDని నమోదు చేయండి. ఈ యాప్ దాన్ని మీ ప్రొఫైల్‌లో సేవ్ చేస్తుంది; ABHA వ్యవస్థతో ధృవీకరించదు లేదా లింక్ చేయదు.',
    noAbhaLinked: 'ఇంకా ABHA ID లింక్ చేయబడలేదు',
    linkAbha: 'ABHA లింక్',
    relinkAbha: 'రీలింక్',
    saveProfile: 'ప్రొఫైల్ సేవ్ చేయండి',
    profileSaved: 'ప్రొఫైల్ విజయవంతంగా సేవ్ అయింది!',
    profileSummary: 'ప్రొఫైల్ సారాంశం',
    notSet: 'సెట్ చేయబడలేదు',
    noneRecorded: 'ఏవీ నమోదు చేయబడలేదు',
    notLinked: 'లింక్ చేయబడలేదు',
    privacy: 'గోప్యత',
    privacyText: 'మీ ఆరోగ్య డేటా రో-లెవల్ సెక్యూరిటీతో రక్షించబడింది. మీరు మాత్రమే మీ రికార్డులను యాక్సెస్ చేయగలరు. అన్ని డేటా ఎన్‌క్రిప్ట్ చేయబడి సురక్షితంగా నిల్వ చేయబడింది.',
    summariesTitle: 'AI ఆరోగ్య సారాంశాలు',
    summariesSubtitle: 'మీ వైద్య పత్రాల AI-ఉత్పత్తి సారాంశాలు ఇంగ్లీష్ మరియు తెలుగులో',
    noSummariesYet: 'ఇంకా AI సారాంశాలు లేవు. ఒకటి రూపొందించడానికి వైద్య పత్రం అప్‌లోడ్ చేయండి.',
    healthSummary: 'ఆరోగ్య సారాంశం',
    english: 'ఇంగ్లీష్',
    telugu: 'తెలుగు',
    abnormalFindings: 'అసాధారణ ఫలితాలు',
    keyFindings: 'ముఖ్య అంశాలు',
    recommendations: 'సూచనలు',
    settingsTitle: 'సెట్టింగ్‌లు',
    settingsSubtitle: 'మీ భాష మరియు యాప్ ప్రాధాన్యతలను నిర్వహించండి',
    languageSection: 'Language / భాష',
    languageEn: 'English',
    languageTe: 'తెలుగు (Telugu)',
    languageEnDesc: 'మొత్తం యాప్‌ను ఇంగ్లీష్‌లో చూడండి',
    languageTeDesc: 'మొత్తం యాప్‌ను తెలుగులో చూడండి',
    currentLanguage: 'ప్రస్తుత భాష',
    aboutSection: 'గురించి',
    aboutText: 'AI హెల్త్ కోపైలట్ అనేది వైద్య పత్రాలను నిర్వహించడానికి, మందులను ట్రాక్ చేయడానికి, మరియు AI-ఉత్పత్తి ఆరోగ్య సారాంశాలను పొందడానికి సహాయపడే వ్యక్తిగత ఆరోగ్య సహాయకుడు. హ్యాకథాన్ ప్రదర్శన ప్రయోజనాల కోసం రూపొందించబడింది.',
    version: 'వెర్షన్ 1.0.0',
    loading: 'లోడ్ అవుతోంది...',
    cancel: 'రద్దు',
    confirm: 'నిర్ధారించు',
    delete: 'తొలగించు',
  },
};
