-- Fix Performance Issues - Add Missing Indexes
-- Run this to improve database performance

-- 1. Create comprehensive indexes for all tables
-- These indexes will significantly improve query performance

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON public.profiles(verified);
CREATE INDEX IF NOT EXISTS idx_profiles_specialization ON public.profiles(specialization);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at);

-- Consultations table indexes
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON public.consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON public.consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON public.consultations(consultation_date);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON public.consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON public.consultations(created_at);
CREATE INDEX IF NOT EXISTS idx_consultations_updated_at ON public.consultations(updated_at);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at);

-- Schedules table indexes
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_start_time ON public.schedules(start_time);
CREATE INDEX IF NOT EXISTS idx_schedules_end_time ON public.schedules(end_time);
CREATE INDEX IF NOT EXISTS idx_schedules_type ON public.schedules(type);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON public.schedules(status);
CREATE INDEX IF NOT EXISTS idx_schedules_created_at ON public.schedules(created_at);

-- Health records table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_health_records_user_id ON public.health_records(user_id);
CREATE INDEX IF NOT EXISTS idx_health_records_record_type ON public.health_records(record_type);
CREATE INDEX IF NOT EXISTS idx_health_records_service_date ON public.health_records(service_date);
CREATE INDEX IF NOT EXISTS idx_health_records_created_at ON public.health_records(created_at);

-- Consent requests table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_consent_requests_patient_id ON public.consent_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_requests_doctor_id ON public.consent_requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consent_requests_status ON public.consent_requests(status);
CREATE INDEX IF NOT EXISTS idx_consent_requests_created_at ON public.consent_requests(created_at);

-- AI insights table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_insight_type ON public.ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON public.ai_insights(created_at);

-- Prescriptions table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON public.prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_created_at ON public.prescriptions(created_at);

-- 2. Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_profiles_role_verified ON public.profiles(role, verified);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_status ON public.consultations(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_date ON public.consultations(doctor_id, consultation_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_schedules_user_type ON public.schedules(user_id, type);

-- 3. Create partial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_doctors ON public.profiles(user_id) WHERE role = 'doctor';
CREATE INDEX IF NOT EXISTS idx_profiles_patients ON public.profiles(user_id) WHERE role = 'patient';
CREATE INDEX IF NOT EXISTS idx_consultations_pending ON public.consultations(patient_id, consultation_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_consultations_confirmed ON public.consultations(patient_id, consultation_date) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, created_at) WHERE is_read = false;

-- 4. Analyze tables to update statistics
ANALYZE public.profiles;
ANALYZE public.consultations;
ANALYZE public.notifications;
ANALYZE public.schedules;

-- 5. Show index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;

-- 6. Summary
SELECT 'Performance optimization completed! Indexes created and statistics updated.' as status;
