-- Simple Events Table Setup
-- Run this in Supabase SQL Editor

-- First, create the events table with minimal requirements
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  doctor_id UUID NOT NULL,
  patient_id UUID,
  notes TEXT,
  is_available BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a simple index
CREATE INDEX IF NOT EXISTS idx_events_doctor_id ON events(doctor_id);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all operations for authenticated users
-- (This is temporary - you can make it more restrictive later)
CREATE POLICY "Allow all for authenticated users" ON events
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Test the table by inserting a sample event
INSERT INTO events (title, start_time, end_time, event_type, doctor_id, notes)
VALUES (
  'Test Event',
  NOW(),
  NOW() + INTERVAL '1 hour',
  'meeting',
  (SELECT id FROM profiles WHERE role = 'doctor' LIMIT 1),
  'This is a test event'
);

-- Verify the table was created
SELECT * FROM events LIMIT 5;
