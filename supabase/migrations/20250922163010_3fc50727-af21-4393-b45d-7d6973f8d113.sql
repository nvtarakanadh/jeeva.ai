-- Create comprehensive mock data for the healthcare platform

-- First, let's add some sample users to the profiles table
INSERT INTO public.profiles (user_id, role, first_name, last_name, email, phone, specialization, license_number, hospital_affiliation, date_of_birth, gender, address, emergency_contact) VALUES 
-- Doctors
('d0ebb1aa-4d8b-4552-8267-3a80596a7899', 'doctor', 'Tarakanadh', 'Nanduri', 'nvtarakanadh@gmail.com', '9949193254', 'Cardiology', 'MD12345', 'Apollo Hospitals', '1985-06-15', 'Male', '123 Medical St, Hyderabad', '+91-9876543210'),
('550e8400-e29b-41d4-a716-446655440000', 'doctor', 'Priya', 'Sharma', 'priya.sharma@example.com', '9876543210', 'Neurology', 'MD67890', 'AIIMS Delhi', '1980-03-22', 'Female', '456 Brain Avenue, Delhi', '+91-9876543211'),
('550e8400-e29b-41d4-a716-446655440001', 'doctor', 'Rajesh', 'Kumar', 'rajesh.kumar@example.com', '9876543211', 'Orthopedics', 'MD11111', 'Fortis Healthcare', '1975-11-08', 'Male', '789 Bone Street, Mumbai', '+91-9876543212'),
-- Patients  
('17cbb726-4f31-493b-a035-794fb95401b4', 'patient', 'RS', 'Nadimpalli', 'rs.nadimpalli@gmail.com', '8178649332', null, null, null, '1990-12-01', 'Male', '321 Patient Lane, Bangalore', '+91-9876543213'),
('550e8400-e29b-41d4-a716-446655440002', 'patient', 'Anita', 'Verma', 'anita.verma@example.com', '9876543212', null, null, null, '1988-07-19', 'Female', '654 Health Road, Chennai', '+91-9876543214'),
('550e8400-e29b-41d4-a716-446655440003', 'patient', 'Vikram', 'Singh', 'vikram.singh@example.com', '9876543213', null, null, null, '1985-04-12', 'Male', '987 Wellness Circle, Pune', '+91-9876543215'),
('550e8400-e29b-41d4-a716-446655440004', 'patient', 'Deepika', 'Patel', 'deepika.patel@example.com', '9876543214', null, null, null, '1992-09-05', 'Female', '147 Care Avenue, Ahmedabad', '+91-9876543216'),
('550e8400-e29b-41d4-a716-446655440005', 'patient', 'Arjun', 'Reddy', 'arjun.reddy@example.com', '9876543215', null, null, null, '1978-01-30', 'Male', '258 Recovery Street, Hyderabad', '+91-9876543217')
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  specialization = EXCLUDED.specialization,
  license_number = EXCLUDED.license_number,
  hospital_affiliation = EXCLUDED.hospital_affiliation,
  date_of_birth = EXCLUDED.date_of_birth,
  gender = EXCLUDED.gender,
  address = EXCLUDED.address,
  emergency_contact = EXCLUDED.emergency_contact;

-- Get profile IDs for foreign key references
-- We'll use the UUIDs directly since we know them

-- Insert comprehensive health records
INSERT INTO public.health_records (patient_id, title, description, record_type, file_type, date_recorded, hospital_name, doctor_id, ai_analysis) VALUES 
-- Records for RS Nadimpalli
((SELECT id FROM profiles WHERE user_id = '17cbb726-4f31-493b-a035-794fb95401b4'), 'Annual Health Checkup 2024', 'Complete physical examination with blood work', 'checkup', 'pdf', '2024-01-15', 'Apollo Hospitals', (SELECT id FROM profiles WHERE user_id = 'd0ebb1aa-4d8b-4552-8267-3a80596a7899'), '{"overall_health": "Good", "risk_factors": ["slightly elevated cholesterol"], "recommendations": ["regular exercise", "diet modification"], "biomarkers": {"cholesterol": 210, "blood_pressure": "120/80", "glucose": 95}}'),
((SELECT id FROM profiles WHERE user_id = '17cbb726-4f31-493b-a035-794fb95401b4'), 'Cardiology Consultation', 'Heart health assessment and ECG report', 'specialist_report', 'pdf', '2024-02-20', 'Apollo Hospitals', (SELECT id FROM profiles WHERE user_id = 'd0ebb1aa-4d8b-4552-8267-3a80596a7899'), '{"heart_health": "Normal", "ecg_results": "Regular rhythm", "recommendations": ["continue current lifestyle"], "risk_level": "low"}'),
((SELECT id FROM profiles WHERE user_id = '17cbb726-4f31-493b-a035-794fb95401b4'), 'Blood Test Results', 'Comprehensive metabolic panel', 'lab_report', 'pdf', '2024-03-10', 'SRL Diagnostics', null, '{"hemoglobin": 14.2, "white_blood_cells": 7500, "platelet_count": 250000, "status": "all values normal"}'),

-- Records for Anita Verma
((SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'), 'Pregnancy Checkup', 'Routine prenatal examination', 'checkup', 'pdf', '2024-01-20', 'Fortis Healthcare', (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'), '{"pregnancy_status": "healthy", "gestational_age": "20 weeks", "recommendations": ["folic acid supplementation", "regular monitoring"]}'),
((SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'), 'Ultrasound Report', '20-week anatomy scan', 'imaging', 'pdf', '2024-02-15', 'Fortis Healthcare', null, '{"fetal_development": "normal", "estimated_due_date": "2024-06-15", "gender": "female"}'),

-- Records for Vikram Singh  
((SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440003'), 'Diabetes Management', 'HbA1c and glucose monitoring', 'chronic_care', 'pdf', '2024-01-25', 'AIIMS Delhi', (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'), '{"hba1c": 7.2, "glucose_trend": "improving", "medication_adherence": "good", "recommendations": ["continue metformin", "dietary counseling"]}'),
((SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440003'), 'Eye Examination', 'Diabetic retinopathy screening', 'specialist_report', 'pdf', '2024-03-05', 'AIIMS Delhi', null, '{"retinal_health": "mild changes noted", "follow_up": "6 months", "recommendations": ["blood sugar control"]}'),

-- Records for Deepika Patel
((SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440004'), 'Orthopedic Consultation', 'Knee pain evaluation', 'specialist_report', 'pdf', '2024-02-10', 'Fortis Healthcare', (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'), '{"diagnosis": "mild osteoarthritis", "treatment_plan": "physiotherapy", "pain_level": "moderate"}'),
((SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440004'), 'MRI Knee Report', 'Detailed knee joint imaging', 'imaging', 'pdf', '2024-02-25', 'Fortis Healthcare', null, '{"findings": "cartilage thinning", "grade": "2", "recommendations": ["weight management", "low-impact exercise"]}'),

-- Records for Arjun Reddy
((SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440005'), 'Hypertension Management', 'Blood pressure monitoring and medication review', 'chronic_care', 'pdf', '2024-01-30', 'Apollo Hospitals', (SELECT id FROM profiles WHERE user_id = 'd0ebb1aa-4d8b-4552-8267-3a80596a7899'), '{"blood_pressure": "140/90", "medication": "Amlodipine 5mg", "compliance": "good", "target_bp": "130/80"}'),
((SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440005'), 'Lipid Profile', 'Cholesterol and triglyceride levels', 'lab_report', 'pdf', '2024-03-15', 'SRL Diagnostics', null, '{"total_cholesterol": 240, "ldl": 160, "hdl": 35, "triglycerides": 200, "risk_level": "high"}');

-- Insert consent requests
INSERT INTO public.consent_requests (patient_id, doctor_id, purpose, status, expiry_date) VALUES 
-- Approved consents
((SELECT id FROM profiles WHERE user_id = '17cbb726-4f31-493b-a035-794fb95401b4'), (SELECT id FROM profiles WHERE user_id = 'd0ebb1aa-4d8b-4552-8267-3a80596a7899'), 'Cardiology consultation and ongoing heart health monitoring', 'approved', '2024-12-31'),
((SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'), (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'), 'Prenatal care and delivery management', 'approved', '2024-08-31'),
((SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440003'), (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'), 'Diabetes management and neurological assessment', 'approved', '2024-10-31'),
((SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440004'), (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'), 'Orthopedic treatment for knee issues', 'approved', '2024-09-30'),
((SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440005'), (SELECT id FROM profiles WHERE user_id = 'd0ebb1aa-4d8b-4552-8267-3a80596a7899'), 'Hypertension and cardiovascular care', 'approved', '2024-11-30'),
-- Pending consents
((SELECT id FROM profiles WHERE user_id = '17cbb726-4f31-493b-a035-794fb95401b4'), (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'), 'Neurological consultation for headaches', 'pending', '2024-12-31'),
((SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'), (SELECT id FROM profiles WHERE user_id = 'd0ebb1aa-4d8b-4552-8267-3a80596a7899'), 'Cardiac screening during pregnancy', 'pending', '2024-07-31');

-- Insert AI insights based on health records
INSERT INTO public.ai_insights (patient_id, record_id, insight_type, content, recommendations, risk_level) VALUES 
-- Insights for RS Nadimpalli
((SELECT id FROM profiles WHERE user_id = '17cbb726-4f31-493b-a035-794fb95401b4'), (SELECT id FROM health_records WHERE title = 'Annual Health Checkup 2024' AND patient_id = (SELECT id FROM profiles WHERE user_id = '17cbb726-4f31-493b-a035-794fb95401b4')), 'health_summary', '{"summary": "Overall good health with minor cholesterol elevation", "key_findings": ["cholesterol: 210 mg/dL", "normal blood pressure", "healthy glucose levels"], "trend": "stable"}', ARRAY['Increase physical activity to 150 minutes per week', 'Adopt Mediterranean diet', 'Monitor cholesterol every 6 months'], 'low'),

-- Insights for Anita Verma  
((SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'), (SELECT id FROM health_records WHERE title = 'Pregnancy Checkup' AND patient_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002')), 'pregnancy_monitoring', '{"summary": "Healthy pregnancy progression at 20 weeks", "maternal_health": "excellent", "fetal_development": "on track", "risk_factors": "none identified"}', ARRAY['Continue prenatal vitamins', 'Regular prenatal appointments', 'Monitor weight gain'], 'low'),

-- Insights for Vikram Singh
((SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440003'), (SELECT id FROM health_records WHERE title = 'Diabetes Management' AND patient_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440003')), 'chronic_disease', '{"summary": "Diabetes management improving with current treatment", "hba1c_trend": "decreasing", "complications": "early retinal changes", "medication_effectiveness": "good"}', ARRAY['Continue current medication regimen', 'Increase monitoring frequency', 'Ophthalmology follow-up in 6 months'], 'medium'),

-- Insights for Deepika Patel
((SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440004'), (SELECT id FROM health_records WHERE title = 'Orthopedic Consultation' AND patient_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440004')), 'joint_health', '{"summary": "Early-stage knee osteoarthritis identified", "joint_space": "mildly reduced", "inflammation": "minimal", "mobility": "good with modifications"}', ARRAY['Physical therapy 3x per week', 'Weight management program', 'Low-impact exercise routine'], 'medium'),

-- Insights for Arjun Reddy
((SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440005'), (SELECT id FROM health_records WHERE title = 'Hypertension Management' AND patient_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440005')), 'cardiovascular_risk', '{"summary": "Hypertension with elevated lipid profile increases cardiovascular risk", "blood_pressure_control": "suboptimal", "lipid_status": "concerning", "overall_risk": "moderate to high"}', ARRAY['Intensify blood pressure management', 'Start statin therapy for cholesterol', 'Lifestyle modifications urgently needed'], 'high');