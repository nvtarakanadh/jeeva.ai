-- Create mock health records using valid enum values
INSERT INTO public.health_records (patient_id, title, description, record_type, file_type, date_recorded, hospital_name, ai_analysis) VALUES 
-- Records for the existing patient user
((SELECT id FROM profiles WHERE user_id = '17cbb726-4f31-493b-a035-794fb95401b4'), 'Annual Health Checkup 2024', 'Complete physical examination with blood work', 'consultation_note', 'pdf', '2024-01-15', 'Apollo Hospitals', '{"overall_health": "Good", "risk_factors": ["slightly elevated cholesterol"], "recommendations": ["regular exercise", "diet modification"], "biomarkers": {"cholesterol": 210, "blood_pressure": "120/80", "glucose": 95}}'),
((SELECT id FROM profiles WHERE user_id = '17cbb726-4f31-493b-a035-794fb95401b4'), 'Cardiology Consultation', 'Heart health assessment and ECG report', 'consultation_note', 'pdf', '2024-02-20', 'Apollo Hospitals', '{"heart_health": "Normal", "ecg_results": "Regular rhythm", "recommendations": ["continue current lifestyle"], "risk_level": "low"}'),
((SELECT id FROM profiles WHERE user_id = '17cbb726-4f31-493b-a035-794fb95401b4'), 'Blood Test Results', 'Comprehensive metabolic panel', 'lab_report', 'pdf', '2024-03-10', 'SRL Diagnostics', '{"hemoglobin": 14.2, "white_blood_cells": 7500, "platelet_count": 250000, "status": "all values normal"}'),
((SELECT id FROM profiles WHERE user_id = '17cbb726-4f31-493b-a035-794fb95401b4'), 'Diabetes Screening Results', 'Fasting glucose and HbA1c test', 'lab_report', 'pdf', '2024-03-20', 'Metro Labs', '{"fasting_glucose": 88, "hba1c": 5.4, "diabetes_risk": "low", "recommendations": ["maintain healthy diet"]}'),
((SELECT id FROM profiles WHERE user_id = '17cbb726-4f31-493b-a035-794fb95401b4'), 'Chest X-Ray Report', 'Routine chest imaging for health screening', 'imaging', 'pdf', '2024-02-05', 'Radiology Center', '{"findings": "clear lungs", "heart_size": "normal", "impression": "normal chest x-ray"}'),
((SELECT id FROM profiles WHERE user_id = '17cbb726-4f31-493b-a035-794fb95401b4'), 'Hypertension Medication', 'Blood pressure management prescription', 'prescription', 'pdf', '2024-01-25', 'Apollo Hospitals', '{"medication": "Amlodipine 5mg", "dosage": "once daily", "duration": "3 months", "instructions": "take with breakfast"}'),
((SELECT id FROM profiles WHERE user_id = '17cbb726-4f31-493b-a035-794fb95401b4'), 'Hospital Discharge Summary', 'Post-surgery discharge documentation', 'discharge_summary', 'pdf', '2024-01-05', 'Apollo Hospitals', '{"admission_date": "2024-01-02", "discharge_date": "2024-01-05", "procedure": "minor surgery", "recovery": "excellent", "follow_up": "2 weeks"}}');

-- Insert consent requests between doctor and patient
INSERT INTO public.consent_requests (patient_id, doctor_id, purpose, status, expiry_date) VALUES 
-- Approved consent between existing users
((SELECT id FROM profiles WHERE user_id = '17cbb726-4f31-493b-a035-794fb95401b4'), (SELECT id FROM profiles WHERE user_id = 'd0ebb1aa-4d8b-4552-8267-3a80596a7899'), 'Comprehensive medical care including cardiology consultation', 'approved', '2024-12-31'),
-- Pending consent request  
((SELECT id FROM profiles WHERE user_id = '17cbb726-4f31-493b-a035-794fb95401b4'), (SELECT id FROM profiles WHERE user_id = 'd0ebb1aa-4d8b-4552-8267-3a80596a7899'), 'Access to lab results for second opinion', 'pending', '2024-09-30');

-- Insert AI insights for the health records
INSERT INTO public.ai_insights (patient_id, record_id, insight_type, content, recommendations, risk_level) VALUES 
((SELECT id FROM profiles WHERE user_id = '17cbb726-4f31-493b-a035-794fb95401b4'), 
 (SELECT id FROM health_records WHERE title = 'Annual Health Checkup 2024' AND patient_id = (SELECT id FROM profiles WHERE user_id = '17cbb726-4f31-493b-a035-794fb95401b4') LIMIT 1), 
 'health_summary', 
 '{"summary": "Overall excellent health with minor cholesterol attention needed", "key_findings": ["cholesterol: 210 mg/dL", "normal blood pressure: 120/80", "healthy glucose: 95 mg/dL"], "trend": "stable", "health_score": 85}', 
 ARRAY['Increase physical activity to 150 minutes per week', 'Adopt Mediterranean diet rich in omega-3', 'Monitor cholesterol every 6 months', 'Continue annual health screenings'], 
 'low'),

((SELECT id FROM profiles WHERE user_id = '17cbb726-4f31-493b-a035-794fb95401b4'), 
 (SELECT id FROM health_records WHERE title = 'Blood Test Results' AND patient_id = (SELECT id FROM profiles WHERE user_id = '17cbb726-4f31-493b-a035-794fb95401b4') LIMIT 1), 
 'lab_analysis', 
 '{"summary": "All blood parameters within normal range", "hemoglobin": "14.2 g/dL (normal)", "wbc": "7500/μL (normal)", "platelets": "250000/μL (normal)", "liver_function": "normal", "kidney_function": "normal"}', 
 ARRAY['Maintain current health practices', 'Stay hydrated', 'Continue balanced nutrition'], 
 'low'),

((SELECT id FROM profiles WHERE user_id = '17cbb726-4f31-493b-a035-794fb95401b4'), 
 (SELECT id FROM health_records WHERE title = 'Chest X-Ray Report' AND patient_id = (SELECT id FROM profiles WHERE user_id = '17cbb726-4f31-493b-a035-794fb95401b4') LIMIT 1), 
 'imaging_analysis', 
 '{"summary": "Normal chest imaging with no abnormalities", "lung_fields": "clear", "heart_size": "within normal limits", "skeletal_structures": "normal"}', 
 ARRAY['Continue healthy lifestyle', 'Annual chest screening recommended'], 
 'low');