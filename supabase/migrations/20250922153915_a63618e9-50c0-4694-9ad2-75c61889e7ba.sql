-- Create enum types for user roles and record types
CREATE TYPE public.user_role AS ENUM ('patient', 'doctor', 'admin');
CREATE TYPE public.record_type AS ENUM ('prescription', 'lab_report', 'imaging', 'consultation_note', 'discharge_summary', 'other');
CREATE TYPE public.consent_status AS ENUM ('pending', 'approved', 'denied', 'revoked');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'patient',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  emergency_contact TEXT,
  specialization TEXT, -- for doctors
  license_number TEXT, -- for doctors
  hospital_affiliation TEXT, -- for doctors
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create health records table
CREATE TABLE public.health_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  record_type record_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
  doctor_id UUID REFERENCES public.profiles(id),
  hospital_name TEXT,
  ai_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create consent management table
CREATE TABLE public.consent_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status consent_status NOT NULL DEFAULT 'pending',
  purpose TEXT NOT NULL,
  expiry_date DATE,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI analytics table for storing insights
CREATE TABLE public.ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  record_id UUID REFERENCES public.health_records(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  content JSONB NOT NULL,
  risk_level TEXT,
  recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for health records
CREATE POLICY "Patients can view their own health records" 
ON public.health_records 
FOR SELECT 
USING (
  patient_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Doctors can view health records with consent" 
ON public.health_records 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.consent_requests cr
    JOIN public.profiles p ON p.id = cr.doctor_id
    WHERE p.user_id = auth.uid()
    AND cr.patient_id = health_records.patient_id
    AND cr.status = 'approved'
    AND (cr.expiry_date IS NULL OR cr.expiry_date > CURRENT_DATE)
  )
);

CREATE POLICY "Patients can insert their own health records" 
ON public.health_records 
FOR INSERT 
WITH CHECK (
  patient_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for consent requests
CREATE POLICY "Patients can view consent requests for their data" 
ON public.consent_requests 
FOR SELECT 
USING (
  patient_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Doctors can view their own consent requests" 
ON public.consent_requests 
FOR SELECT 
USING (
  doctor_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Doctors can create consent requests" 
ON public.consent_requests 
FOR INSERT 
WITH CHECK (
  doctor_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid() AND role = 'doctor'
  )
);

CREATE POLICY "Patients can update consent requests" 
ON public.consent_requests 
FOR UPDATE 
USING (
  patient_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for AI insights
CREATE POLICY "Patients can view their own AI insights" 
ON public.ai_insights 
FOR SELECT 
USING (
  patient_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Doctors can view AI insights with consent" 
ON public.ai_insights 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.consent_requests cr
    JOIN public.profiles p ON p.id = cr.doctor_id
    WHERE p.user_id = auth.uid()
    AND cr.patient_id = ai_insights.patient_id
    AND cr.status = 'approved'
    AND (cr.expiry_date IS NULL OR cr.expiry_date > CURRENT_DATE)
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_health_records_updated_at
  BEFORE UPDATE ON public.health_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consent_requests_updated_at
  BEFORE UPDATE ON public.consent_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, first_name, last_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')::user_role,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for health records
INSERT INTO storage.buckets (id, name, public) VALUES ('health-records', 'health-records', false);

-- Create storage policies
CREATE POLICY "Patients can upload their own health records" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'health-records' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Patients can view their own health records" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'health-records' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Doctors can view health records with consent" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'health-records' AND
  EXISTS (
    SELECT 1 FROM public.consent_requests cr
    JOIN public.profiles patient ON patient.id = cr.patient_id
    JOIN public.profiles doctor ON doctor.id = cr.doctor_id
    WHERE doctor.user_id = auth.uid()
    AND patient.user_id::text = (storage.foldername(name))[1]
    AND cr.status = 'approved'
    AND (cr.expiry_date IS NULL OR cr.expiry_date > CURRENT_DATE)
  )
);