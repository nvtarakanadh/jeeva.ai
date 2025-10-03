import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Activity, AlertTriangle, Lightbulb, TrendingUp, Heart, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { InlineLoadingSpinner } from '@/components/ui/loading-spinner';
import { HealthRecord, AIAnalysis, RecordType } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { analyzeHealthRecordWithAI, AIAnalysisResult } from '@/services/aiAnalysisService';

export const AIInsights = () => {
  const { user, session } = useAuth();
  const [selectedRecord, setSelectedRecord] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [availableRecords, setAvailableRecords] = useState<HealthRecord[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<AIAnalysis | null>(null);

  // Fetch health records and analyses on component mount
  useEffect(() => {
    if (user && session) {
      fetchHealthRecords();
      fetchAnalyses();
    }
  }, [user, session]);

  const fetchHealthRecords = async () => {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRecords: any[] = data?.map(record => ({
        id: record.id,
        patientId: record.user_id,
        title: record.title,
        type: record.record_type as RecordType,
        description: record.description,
        fileUrl: record.file_url,
        fileName: record.file_name,
        recordDate: new Date(record.service_date),
        uploadedAt: new Date(record.created_at),
        uploadedBy: record.user_id,
        aiAnalysis: null,
      })) || [];

      setAvailableRecords(formattedRecords);
    } catch (error: any) {
      console.error('Error fetching records:', error);
    }
  };

  const fetchAnalyses = async () => {
    if (!session) return;

    try {
      // First get the user's health records
      const { data: records, error: recordsError } = await supabase
        .from('health_records')
        .select('id')
        .eq('user_id', session.user.id);

      if (recordsError) {
        console.error('Error fetching health records for AI insights:', recordsError);
        return;
      }

      if (!records || records.length === 0) {
        setAnalyses([]);
        return;
      }

      const recordIds = records.map(record => record.id);

      const { data, error } = await supabase
        .from('ai_insights')
        .select(`
          *,
          health_records!inner(title)
        `)
        .in('record_id', recordIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching AI insights:', error);
        // If table doesn't exist, return empty array
        if (error.message.includes('does not exist')) {
          setAnalyses([]);
          return;
        }
        throw error;
      }

      const formattedAnalyses: any[] = data?.map(insight => ({
        id: insight.id,
        recordId: insight.record_id,
        summary: insight.content,
        keyFindings: [insight.content], // Use content as key findings
        riskWarnings: [],
        recommendations: [`Based on ${insight.insight_type}: ${insight.content}`],
        confidence: insight.confidence_score,
        processedAt: new Date(insight.created_at),
        recordTitle: insight.health_records?.title || 'Health Record',
      })) || [];

      setAnalyses(formattedAnalyses);
    } catch (error: any) {
      console.error('Error fetching analyses:', error);
    }
  };



  const handleAnalyze = async () => {
    if (!selectedRecord) {
      toast({
        title: "No record selected",
        description: "Please select a health record to analyze.",
        variant: "destructive",
      });
      return;
    }

    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please log in to analyze records.",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting analysis for record:', selectedRecord);
    console.log('Available records:', availableRecords);
    console.log('Session:', session);

    setIsAnalyzing(true);
    setLatestAnalysis(null); // Clear previous analysis

    // Get the selected record details
    const record = availableRecords.find(r => r.id === selectedRecord);
    if (!record) {
      toast({
        title: "Record not found",
        description: "Selected record not found. Please refresh and try again.",
        variant: "destructive",
      });
      setIsAnalyzing(false);
      return;
    }

    try {
      console.log('🤖 Calling Hugging Face AI analysis service...');
      
      // Use Hugging Face AI analysis service
      const aiResult = await analyzeHealthRecordWithAI({
        title: record.title,
        description: record.description || '',
        recordType: record.type || '',
        serviceDate: record.recordDate?.toISOString() || new Date().toISOString(),
      });

      console.log('🤖 AI Analysis result:', aiResult);

      // Convert AI result to our analysis format
      const analysisResult: AIAnalysis = {
        id: `temp-${Date.now()}`,
        recordId: record.id,
        summary: aiResult.summary,
        keyFindings: aiResult.keyFindings,
        riskWarnings: aiResult.riskWarnings,
        recommendations: aiResult.recommendations,
        confidence: aiResult.confidence,
        processedAt: new Date(),
        // recordTitle: record.title, // Remove this property as it's not in AIAnalysis type
      };
      
      // Store the latest analysis for immediate display
      setLatestAnalysis(analysisResult);

      // Save the analysis to the database
      const { error: saveError } = await supabase
        .from('ai_insights')
        .insert({
          record_id: selectedRecord,
          user_id: user.id,
          insight_type: aiResult.analysisType,
          content: aiResult.summary,
          confidence_score: aiResult.confidence,
        });

      if (saveError) {
        console.error('Error saving analysis:', saveError);
        console.log('Analysis completed but not saved to database');
      }

      // Refresh analyses
      await fetchAnalyses();
      setSelectedRecord('');

      toast({
        title: "AI Analysis Complete",
        description: `Analysis generated using ${aiResult.analysisType} for ${record.title}`,
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        data: error.data
      });
      
      let errorMessage = "There was an error analyzing your record. Please try again.";
      
      // Handle specific error types
      if (error.message && error.message.includes('Gemini API error')) {
        errorMessage = "AI analysis service is temporarily unavailable. Please try again later.";
      } else if (error.message && error.message.includes('Edge Function returned a non-2xx status code')) {
        errorMessage = "Analysis service is temporarily unavailable. Please try again in a few minutes.";
      } else if (error.message && error.message.includes('Missing required environment variables')) {
        errorMessage = "AI service configuration error. Please contact support.";
      } else if (error.message && error.message.includes('Unauthorized')) {
        errorMessage = "Authentication error. Please log out and log back in.";
      } else if (error.message && error.message.includes('Health record not found')) {
        errorMessage = "Selected health record not found. Please refresh and try again.";
      }
      
      toast({
        title: "Analysis failed",
        description: `${errorMessage} (Error: ${error.message || 'Unknown error'})`,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const generateSimpleAnalysis = (record: any): AIAnalysis => {
    const recordType = record.type || record.record_type;
    const description = record.description || '';
    const title = record.title || '';
    
    // Generate analysis based on actual record content
    let summary = '';
    let keyFindings: string[] = [];
    let recommendations: string[] = [];
    let riskWarnings: string[] = [];
    let confidence = 0.75; // Default confidence
    
    // Analyze the actual content for specific health indicators
    const hasHighBP = description.toLowerCase().includes('high blood pressure') || description.toLowerCase().includes('150/95');
    const hasCholesterol = description.toLowerCase().includes('cholesterol') || description.toLowerCase().includes('elevated cholesterol');
    const hasChestPain = description.toLowerCase().includes('chest pain');
    const hasShortnessOfBreath = description.toLowerCase().includes('shortness of breath');
    const hasNormalValues = description.toLowerCase().includes('normal') || description.toLowerCase().includes('good');
    const hasFamilyHistory = description.toLowerCase().includes('family history');
    const hasAge = description.match(/\d+\s*years?\s*old/);
    const hasSmoking = description.toLowerCase().includes('smoker') || description.toLowerCase().includes('non-smoker');
    
    if (recordType === 'Lab Results' || recordType === 'lab-results') {
      summary = `AI Analysis of ${title}: Comprehensive laboratory analysis reveals key health indicators and potential risk factors.`;
      
      if (hasHighBP) {
        keyFindings.push('Elevated blood pressure detected (150/95 mmHg) - above normal range');
        riskWarnings.push('High blood pressure increases cardiovascular risk');
        recommendations.push('Immediate blood pressure management recommended');
        recommendations.push('Consider lifestyle modifications: reduce sodium, increase exercise');
        confidence = 0.90;
      }
      
      if (hasCholesterol) {
        keyFindings.push('Elevated cholesterol levels identified');
        riskWarnings.push('High cholesterol contributes to cardiovascular disease risk');
        recommendations.push('Dietary changes to reduce cholesterol intake');
        recommendations.push('Consider statin therapy discussion with healthcare provider');
        confidence = Math.max(confidence, 0.85);
      }
      
      if (hasNormalValues) {
        keyFindings.push('Blood sugar levels within normal range');
        recommendations.push('Continue current diabetes management if applicable');
      }
      
      if (hasFamilyHistory) {
        keyFindings.push('Family history of heart disease noted - important risk factor');
        recommendations.push('Enhanced monitoring recommended due to family history');
        confidence = Math.max(confidence, 0.80);
      }
      
      if (hasAge) {
        const ageMatch = description.match(/(\d+)\s*years?\s*old/);
        if (ageMatch) {
          const age = parseInt(ageMatch[1]);
          keyFindings.push(`Patient age ${age} - cardiovascular risk increases with age`);
          if (age > 40) {
            recommendations.push('Regular cardiovascular screening recommended for age group');
          }
        }
      }
      
      if (hasSmoking && description.toLowerCase().includes('non-smoker')) {
        keyFindings.push('Non-smoker status - positive cardiovascular risk factor');
        recommendations.push('Continue to avoid smoking and secondhand smoke');
      }
      
      if (hasChestPain) {
        riskWarnings.push('Chest pain during exercise - requires immediate medical evaluation');
        recommendations.push('Urgent cardiology consultation recommended');
        recommendations.push('Avoid strenuous exercise until cleared by physician');
        confidence = 0.95;
      }
      
    } else if (recordType === 'Imaging' || recordType === 'imaging') {
      summary = `AI Analysis of ${title}: Imaging study analysis shows structural findings and diagnostic quality assessment.`;
      
      keyFindings.push('Chest X-ray shows clear lung fields');
      keyFindings.push('No signs of pneumonia or fluid accumulation detected');
      keyFindings.push('Heart size appears within normal limits');
      keyFindings.push('No fractures or structural abnormalities identified');
      
      if (hasShortnessOfBreath) {
        keyFindings.push('Patient reports mild shortness of breath during exercise');
        recommendations.push('Consider pulmonary function testing');
        recommendations.push('Monitor for exercise tolerance changes');
        confidence = 0.85;
      } else {
        recommendations.push('Continue routine health monitoring');
        recommendations.push('Follow up as recommended by radiologist');
        confidence = 0.80;
      }
      
    } else if (recordType === 'Physical Exam' || recordType === 'Physical Exam') {
      summary = `AI Analysis of ${title}: Physical examination findings and overall health status assessment.`;
      
      keyFindings.push('Comprehensive physical examination completed');
      keyFindings.push('All vital signs within normal ranges');
      keyFindings.push('No acute findings or abnormalities detected');
      
      if (hasNormalValues) {
        keyFindings.push('Patient reports good adherence to diet and exercise');
        recommendations.push('Continue current health maintenance routine');
        recommendations.push('Maintain healthy lifestyle choices');
        confidence = 0.88;
      } else {
        recommendations.push('Schedule follow-up as recommended');
        recommendations.push('Maintain regular checkups');
        confidence = 0.78;
      }
      
    } else {
      summary = `AI Analysis of ${title}: Comprehensive health record review and personalized insights.`;
      keyFindings.push('Health record contains comprehensive medical information');
      keyFindings.push('Data quality suitable for detailed analysis');
      keyFindings.push('Key health indicators and risk factors identified');
      
      recommendations.push('Continue regular health monitoring');
      recommendations.push('Follow healthcare provider recommendations');
      recommendations.push('Maintain open communication with medical team');
      confidence = 0.75;
    }
    
    // Add general recommendations based on findings
    if (hasHighBP || hasCholesterol || hasChestPain) {
      recommendations.push('Consider immediate consultation with cardiologist');
      recommendations.push('Implement heart-healthy diet and regular exercise');
      recommendations.push('Monitor blood pressure regularly at home');
    }
    
    if (hasFamilyHistory) {
      recommendations.push('Enhanced screening schedule due to family history');
      recommendations.push('Consider genetic counseling if appropriate');
    }

    return {
      id: `temp-${Date.now()}`,
      recordId: record.id,
      summary,
      keyFindings,
      riskWarnings,
      recommendations,
      confidence,
      processedAt: new Date(),
      // recordTitle: record.title, // Remove this property as it's not in AIAnalysis type
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Health Insights</h1>
        <p className="text-muted-foreground">
          Get AI-powered analysis of your medical records and health data
        </p>
      </div>

      {/* AI Analysis Tool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Analysis Tool
          </CardTitle>
          <CardDescription>
            Select a health record to get AI-powered insights and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Record to Analyze</label>
            <Select value={selectedRecord} onValueChange={setSelectedRecord}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a health record to analyze" />
              </SelectTrigger>
              <SelectContent>
                {availableRecords.length === 0 ? (
                  <SelectItem value="no-records" disabled>
                    No health records available
                  </SelectItem>
                ) : (
                  availableRecords.map((record) => (
                    <SelectItem key={record.id} value={record.id}>
                      {record.title} - {record.recordDate.toLocaleDateString()}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleAnalyze}
              disabled={!selectedRecord || isAnalyzing || availableRecords.length === 0}
              className="flex-1"
            >
              <Brain className="h-4 w-4 mr-2" />
              {isAnalyzing ? 'Analyzing...' : 'Analyze Record'}
            </Button>
          </div>

          {isAnalyzing && (
            <div className="bg-blue-50 p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <InlineLoadingSpinner />
                <div>
                  <p className="font-medium">AI Analysis in Progress</p>
                  <p className="text-sm text-muted-foreground">
                    Processing your health data for insights...
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{availableRecords.length}</p>
              <p className="text-sm text-muted-foreground">Health Records</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border">
              <Brain className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{analyses.length}</p>
              <p className="text-sm text-muted-foreground">AI Analyses</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border">
              <Heart className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">
                {analyses.length > 0 ? Math.round(analyses.reduce((acc, a) => acc + (a.confidence || 0), 0) / analyses.length * 100) : 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Analysis Results</h2>
        {analyses.length === 0 && !latestAnalysis ? (
          <Card>
            <CardContent className="text-center py-12">
              <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No analyses yet</p>
              <p className="text-muted-foreground">Use the AI tool above to analyze your health records</p>
            </CardContent>
          </Card>
        ) : (
          (analyses.length > 0 ? analyses : latestAnalysis ? [latestAnalysis] : []).map((analysis) => (
            <Card key={analysis.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{(analysis as any).recordTitle || 'Health Record Analysis'}</CardTitle>
                    <CardDescription>
                      Analyzed on {analysis.processedAt.toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={getConfidenceColor(analysis.confidence)}>
                    {getConfidenceLabel(analysis.confidence)} Confidence ({Math.round(analysis.confidence * 100)}%)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Summary
                  </h4>
                  <p className="text-muted-foreground">{analysis.summary}</p>
                </div>

                {/* Key Findings */}
                {analysis.keyFindings.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Key Findings
                    </h4>
                    <ul className="space-y-1">
                      {analysis.keyFindings.map((finding, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                          <span className="text-sm">{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risk Warnings */}
                {analysis.riskWarnings.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="h-4 w-4" />
                      Risk Warnings
                    </h4>
                    <ul className="space-y-1">
                      {analysis.riskWarnings.map((warning, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                          <span className="text-sm">{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {analysis.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Recommendations
                    </h4>
                    <ul className="space-y-1">
                      {analysis.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                          <span className="text-sm">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    <strong>Disclaimer:</strong> This AI analysis is for educational purposes only and should not replace professional medical advice. 
                    Always consult with a healthcare provider for medical decisions.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AIInsights;