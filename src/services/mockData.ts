import { HealthRecord, ConsentRequest, Prescription, AIAnalysis, HospitalSystem } from '@/types';

export const mockHealthRecords: HealthRecord[] = [
  {
    id: 'record-1',
    patientId: 'patient-1',
    type: 'lab_test',
    title: 'Complete Blood Count',
    description: 'Annual health checkup blood work',
    recordDate: new Date('2024-09-20'),
    uploadedAt: new Date('2024-09-20'),
    uploadedBy: 'patient-1',
    aiAnalysis: {
      id: 'analysis-1',
      recordId: 'record-1',
      summary: 'Blood parameters are mostly within normal ranges. Cholesterol levels are slightly elevated.',
      keyFindings: ['Total cholesterol: 220 mg/dL (Normal: <200)', 'HDL: 45 mg/dL', 'LDL: 155 mg/dL'],
      riskWarnings: ['Elevated cholesterol may increase cardiovascular risk'],
      recommendations: ['Consider dietary modifications', 'Regular exercise', 'Follow-up in 3 months'],
      confidence: 0.85,
      processedAt: new Date('2024-09-20')
    }
  },
  {
    id: 'record-2',
    patientId: 'patient-1',
    type: 'prescription',
    title: 'Hypertension Medication',
    description: 'Monthly prescription for blood pressure management',
    recordDate: new Date('2024-09-15'),
    uploadedAt: new Date('2024-09-15'),
    uploadedBy: 'doctor-1'
  },
  {
    id: 'record-3',
    patientId: 'patient-1',
    type: 'imaging',
    title: 'Chest X-Ray',
    description: 'Routine chest examination',
    recordDate: new Date('2024-09-10'),
    uploadedAt: new Date('2024-09-10'),
    uploadedBy: 'patient-1',
    aiAnalysis: {
      id: 'analysis-3',
      recordId: 'record-3',
      summary: 'Chest X-ray shows clear lung fields with no acute abnormalities.',
      keyFindings: ['Clear lung fields', 'Normal heart size', 'No signs of infection'],
      riskWarnings: [],
      recommendations: ['Continue regular health monitoring'],
      confidence: 0.92,
      processedAt: new Date('2024-09-10')
    }
  }
];

export const mockConsentRequests: ConsentRequest[] = [
  {
    id: 'consent-req-1',
    patientId: 'patient-1',
    requesterId: 'doctor-1',
    requesterName: 'Dr. Sarah Wilson',
    purpose: 'Cardiac consultation and treatment planning',
    requestedDataTypes: ['lab_test', 'imaging', 'prescription'],
    duration: 30,
    status: 'pending',
    requestedAt: new Date('2024-09-22'),
    message: 'I need access to your recent medical records to provide the best care for your cardiac consultation.'
  },
  {
    id: 'consent-req-2',
    patientId: 'patient-1',
    requesterId: 'doctor-2',
    requesterName: 'Dr. Michael Chen',
    purpose: 'Second opinion on treatment plan',
    requestedDataTypes: ['lab_test'],
    duration: 7,
    status: 'approved',
    requestedAt: new Date('2024-09-18'),
    respondedAt: new Date('2024-09-19'),
    expiresAt: new Date('2024-09-26')
  }
];

export const mockPrescriptions: Prescription[] = [
  {
    id: 'prescription-1',
    patientId: 'patient-1',
    doctorId: 'doctor-1',
    medications: [
      {
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        duration: '30 days',
        instructions: 'Take with or without food'
      },
      {
        name: 'Atorvastatin',
        dosage: '20mg',
        frequency: 'Once daily at bedtime',
        duration: '30 days',
        instructions: 'Take at the same time each day'
      }
    ],
    notes: 'Monitor blood pressure weekly. Follow up in 1 month.',
    prescribedAt: new Date('2024-09-15')
  }
];

export const mockHospitalSystems: HospitalSystem[] = [
  {
    id: 'hospital-1',
    name: 'City General Hospital',
    apiEndpoint: '/api/hospitals/city-general',
    description: 'Primary care and emergency services'
  },
  {
    id: 'hospital-2',
    name: 'Regional Medical Center',
    apiEndpoint: '/api/hospitals/regional-medical',
    description: 'Specialized cardiac and surgical services'
  },
  {
    id: 'hospital-3',
    name: 'University Hospital',
    apiEndpoint: '/api/hospitals/university',
    description: 'Research and teaching hospital'
  }
];

// AI Analysis mock engine
export const generateMockAIAnalysis = (record: HealthRecord): AIAnalysis => {
  const mockAnalyses = {
    lab_test: {
      summary: 'Laboratory results show several parameters within normal ranges with some values requiring attention.',
      keyFindings: ['Glucose: 95 mg/dL (Normal)', 'Hemoglobin: 13.2 g/dL (Normal)', 'White blood cells: 6,800/µL (Normal)'],
      riskWarnings: ['Monitor cholesterol levels', 'Consider lifestyle modifications'],
      recommendations: ['Maintain current medication regimen', 'Schedule follow-up in 3 months', 'Consider dietary consultation']
    },
    imaging: {
      summary: 'Imaging study completed successfully with detailed visualization of anatomical structures.',
      keyFindings: ['No acute abnormalities detected', 'Normal anatomical structures', 'Good image quality'],
      riskWarnings: [],
      recommendations: ['Continue routine monitoring', 'No immediate intervention required']
    },
    prescription: {
      summary: 'Medication regimen reviewed for efficacy and potential interactions.',
      keyFindings: ['Current medications are appropriate', 'No significant drug interactions identified'],
      riskWarnings: ['Monitor for side effects'],
      recommendations: ['Continue as prescribed', 'Regular monitoring recommended']
    }
  };

  const analysis = mockAnalyses[record.type] || mockAnalyses.lab_test;
  
  return {
    id: `analysis-${Date.now()}`,
    recordId: record.id,
    summary: analysis.summary,
    keyFindings: analysis.keyFindings,
    riskWarnings: analysis.riskWarnings,
    recommendations: analysis.recommendations,
    confidence: Math.random() * 0.3 + 0.7, // 0.7 to 1.0
    processedAt: new Date()
  };
};