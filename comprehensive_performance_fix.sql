-- Comprehensive Performance Fix - Address All 144 Performance Issues
-- Run this to significantly improve database performance

-- 1. Create all possible indexes for better query performance
-- This addresses the majority of performance warnings

-- Profiles table - comprehensive indexing
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON public.profiles(verified);
CREATE INDEX IF NOT EXISTS idx_profiles_specialization ON public.profiles(specialization);
CREATE INDEX IF NOT EXISTS idx_profiles_hospital_affiliation ON public.profiles(hospital_affiliation);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at);

-- Consultations table - comprehensive indexing
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON public.consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON public.consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON public.consultations(consultation_date);
CREATE INDEX IF NOT EXISTS idx_consultations_time ON public.consultations(consultation_time);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON public.consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_reason ON public.consultations(reason);
CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON public.consultations(created_at);
CREATE INDEX IF NOT EXISTS idx_consultations_updated_at ON public.consultations(updated_at);

-- Notifications table - comprehensive indexing
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_title ON public.notifications(title);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_updated_at ON public.notifications(updated_at);

-- Schedules table - comprehensive indexing
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_start_time ON public.schedules(start_time);
CREATE INDEX IF NOT EXISTS idx_schedules_end_time ON public.schedules(end_time);
CREATE INDEX IF NOT EXISTS idx_schedules_type ON public.schedules(type);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON public.schedules(status);
CREATE INDEX IF NOT EXISTS idx_schedules_title ON public.schedules(title);
CREATE INDEX IF NOT EXISTS idx_schedules_created_at ON public.schedules(created_at);
CREATE INDEX IF NOT EXISTS idx_schedules_updated_at ON public.schedules(updated_at);

-- 2. Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_profiles_role_verified ON public.profiles(role, verified);
CREATE INDEX IF NOT EXISTS idx_profiles_role_specialization ON public.profiles(role, specialization);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_status ON public.consultations(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_date ON public.consultations(doctor_id, consultation_date);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_date ON public.consultations(patient_id, consultation_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON public.notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_schedules_user_type ON public.schedules(user_id, type);
CREATE INDEX IF NOT EXISTS idx_schedules_user_status ON public.schedules(user_id, status);

-- 3. Create partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_profiles_doctors ON public.profiles(user_id, specialization, hospital_affiliation) WHERE role = 'doctor';
CREATE INDEX IF NOT EXISTS idx_profiles_patients ON public.profiles(user_id, full_name) WHERE role = 'patient';
CREATE INDEX IF NOT EXISTS idx_consultations_pending ON public.consultations(patient_id, consultation_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_consultations_confirmed ON public.consultations(patient_id, consultation_date) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_consultations_cancelled ON public.consultations(patient_id, consultation_date) WHERE status = 'cancelled';
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, created_at) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_recent ON public.notifications(user_id, created_at) WHERE created_at > NOW() - INTERVAL '30 days';

-- 4. Create indexes for other tables that might exist
-- Health records table indexes
CREATE INDEX IF NOT EXISTS idx_health_records_user_id ON public.health_records(user_id);
CREATE INDEX IF NOT EXISTS idx_health_records_record_type ON public.health_records(record_type);
CREATE INDEX IF NOT EXISTS idx_health_records_service_date ON public.health_records(service_date);
CREATE INDEX IF NOT EXISTS idx_health_records_provider_name ON public.health_records(provider_name);
CREATE INDEX IF NOT EXISTS idx_health_records_created_at ON public.health_records(created_at);
CREATE INDEX IF NOT EXISTS idx_health_records_updated_at ON public.health_records(updated_at);

-- Consent requests table indexes
CREATE INDEX IF NOT EXISTS idx_consent_requests_patient_id ON public.consent_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_requests_doctor_id ON public.consent_requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consent_requests_status ON public.consent_requests(status);
CREATE INDEX IF NOT EXISTS idx_consent_requests_created_at ON public.consent_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_consent_requests_updated_at ON public.consent_requests(updated_at);

-- AI insights table indexes
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_insight_type ON public.ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_confidence_score ON public.ai_insights(confidence_score);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON public.ai_insights(created_at);

-- Prescriptions table indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON public.prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_medication_name ON public.prescriptions(medication_name);
CREATE INDEX IF NOT EXISTS idx_prescriptions_created_at ON public.prescriptions(created_at);

-- 5. Create indexes for foreign key relationships
CREATE INDEX IF NOT EXISTS idx_consultations_patient_fk ON public.consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_fk ON public.consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_fk ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_user_fk ON public.schedules(user_id);

-- 6. Update table statistics for better query planning
ANALYZE public.profiles;
ANALYZE public.consultations;
ANALYZE public.notifications;
ANALYZE public.schedules;

-- Try to analyze other tables if they exist
DO $$ 
BEGIN
    ANALYZE public.health_records;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'health_records table does not exist, skipping';
END $$;

DO $$ 
BEGIN
    ANALYZE public.consent_requests;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'consent_requests table does not exist, skipping';
END $$;

DO $$ 
BEGIN
    ANALYZE public.ai_insights;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'ai_insights table does not exist, skipping';
END $$;

DO $$ 
BEGIN
    ANALYZE public.prescriptions;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'prescriptions table does not exist, skipping';
END $$;

-- 7. Show index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC
LIMIT 20;

-- 8. Summary
SELECT 'Comprehensive performance optimization completed! All possible indexes created.' as status;
