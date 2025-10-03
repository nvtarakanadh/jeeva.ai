-- Create events table for calendar events
-- Run this in Supabase SQL Editor

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('consultation', 'blocked', 'followup', 'meeting', 'reminder')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'rejected')),
  doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_doctor_id ON events(doctor_id);
CREATE INDEX IF NOT EXISTS idx_events_patient_id ON events(patient_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Doctors can manage their own events
CREATE POLICY "Doctors can manage their events" ON events
    FOR ALL
    USING (
        doctor_id IN (
            SELECT id FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'doctor'
        )
    )
    WITH CHECK (
        doctor_id IN (
            SELECT id FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'doctor'
        )
    );

-- Patients can view their own events
CREATE POLICY "Patients can view their events" ON events
    FOR SELECT
    USING (
        patient_id IN (
            SELECT id FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'patient'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
