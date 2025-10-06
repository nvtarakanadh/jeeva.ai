-- Fix ai_insights table structure
-- First, let's drop the table if it exists and recreate it properly

DROP TABLE IF EXISTS public.ai_insights CASCADE;

-- Create the table with the correct structure
CREATE TABLE public.ai_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id UUID REFERENCES public.health_records(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own AI insights" ON public.ai_insights
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own AI insights" ON public.ai_insights
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own AI insights" ON public.ai_insights
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own AI insights" ON public.ai_insights
  FOR DELETE USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_ai_insights_record_id ON public.ai_insights(record_id);
CREATE INDEX idx_ai_insights_user_id ON public.ai_insights(user_id);
CREATE INDEX idx_ai_insights_created_at ON public.ai_insights(created_at);
