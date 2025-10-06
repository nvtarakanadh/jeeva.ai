// Core types for Jeeva.AI application
export type UserRole = 'patient' | 'doctor';

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Patient extends User {
  role: 'patient';
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  bloodType?: string;
  allergies?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  profilePhoto?: string;
}

export interface Doctor extends User {
  role: 'doctor';
  licenseNumber: string;
  specialization: string;
  hospitalAffiliation: string;
  verified: boolean;
}

export type RecordType = 'lab_test' | 'prescription' | 'imaging' | 'consultation' | 'vaccination' | 'other';

export interface HealthRecord {
  id: string;
  patientId: string;
  type: RecordType;
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  recordDate: Date;
  uploadedAt: Date;
  uploadedBy: string; // user ID
  metadata?: Record<string, any>;
  aiAnalysis?: AIAnalysis;
}

export interface AIAnalysis {
  id: string;
  recordId: string;
  summary: string;
  keyFindings: string[];
  riskWarnings: string[];
  recommendations: string[];
  confidence: number; // 0-1
  processedAt: Date;
  recordTitle: string;
}

export type ConsentStatus = 'pending' | 'approved' | 'denied' | 'revoked' | 'expired';

export interface ConsentRequest {
  id: string;
  patientId: string;
  requesterId: string; // doctor or system ID
  requesterName: string;
  purpose: string;
  requestedDataTypes: RecordType[];
  requestedDateRange?: {
    start: Date;
    end: Date;
  };
  duration: number; // days
  status: ConsentStatus;
  requestedAt: Date;
  respondedAt?: Date;
  expiresAt?: Date;
  message?: string;
}

export interface Consent {
  id: string;
  patientId: string;
  doctorId: string;
  dataTypes: RecordType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  grantedAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  purpose: string;
  digitalSignature: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  notes?: string;
  prescribedAt: Date;
  fileUrl?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'consent_request' | 'consent_approved' | 'consent_denied' | 
        'prescription_created' | 'prescription_updated' |
        'consultation_note_created' | 'consultation_note_updated' |
        'record_access_granted' | 'record_access_denied' |
        'consultation_booked' | 'consultation_updated' |
        'ai_analysis_complete' | 'health_alert' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

// Mock hospital system for interoperability demo
export interface HospitalSystem {
  id: string;
  name: string;
  apiEndpoint: string;
  description: string;
}

// FHIR-like structure for interoperability
export interface FHIRBundle {
  resourceType: 'Bundle';
  id: string;
  type: 'collection';
  timestamp: string;
  entry: Array<{
    resource: FHIRResource;
  }>;
}

export interface FHIRResource {
  resourceType: 'Patient' | 'Observation' | 'DiagnosticReport' | 'Medication';
  id: string;
  subject?: { reference: string };
  [key: string]: any;
}