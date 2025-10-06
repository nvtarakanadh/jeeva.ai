import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Activity, AlertTriangle, Lightbulb, TrendingUp, Heart, X, RefreshCw, AlertCircle } from 'lucide-react';
import { InlineLoadingSpinner } from '@/components/ui/loading-spinner';
import { AIAnalysis } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordId: string;
  recordTitle: string;
  recordType: string;
  recordDescription?: string;
  fileUrl?: string;
  fileName?: string;
}

export const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({
  isOpen,
  onClose,
  recordId,
  recordTitle,
  recordType,
  recordDescription,
  fileUrl,
  fileName
}) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing analysis when modal opens
  useEffect(() => {
    if (isOpen && recordId) {
      fetchAnalysis();
    }
  }, [isOpen, recordId]);

  const fetchAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching AI analysis for record:', recordId, 'type:', recordType);
      
      // Always check health_records first since that's where most records are stored
      let recordFound = false;
      let recordTitle = 'Unknown Record';
      
      console.log('🔍 Looking for record ID:', recordId, 'with recordType:', recordType);
      
      // First, try health_records table (where most records are stored)
      const { data: healthRecords, error: healthError } = await supabase
        .from('health_records')
        .select('id, title')
        .eq('id', recordId);

      console.log('📋 Health records query result:', { healthRecords, healthError });

      if (!healthError && healthRecords && healthRecords.length > 0) {
        recordFound = true;
        recordTitle = healthRecords[0].title;
        console.log('✅ Record found in health_records:', recordTitle);
      } else {
        console.log('❌ Record not found in health_records, trying other tables...');
        
        // Try prescriptions table
        const { data: prescriptions, error: prescriptionError } = await supabase
          .from('prescriptions')
          .select('id, title')
          .eq('id', recordId);
        
        console.log('📋 Prescriptions query result:', { prescriptions, prescriptionError });
        
        if (!prescriptionError && prescriptions && prescriptions.length > 0) {
          recordFound = true;
          recordTitle = prescriptions[0].title;
          console.log('✅ Record found in prescriptions:', recordTitle);
        } else {
          // Try consultation_notes table
          const { data: consultationNotes, error: consultationError } = await supabase
            .from('consultation_notes')
            .select('id, title')
            .eq('id', recordId);
          
          console.log('📋 Consultation notes query result:', { consultationNotes, consultationError });
          
          if (!consultationError && consultationNotes && consultationNotes.length > 0) {
            recordFound = true;
            recordTitle = consultationNotes[0].title;
            console.log('✅ Record found in consultation_notes:', recordTitle);
          }
        }
      }

      if (!recordFound) {
        console.log('❌ Record not found in any table');
        setAnalysis(null);
        return;
      }

      console.log('🔍 Looking for AI insights with record ID:', recordId);
      
      const { data: insights, error: insightsError } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('record_id', recordId)
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('🤖 AI insights query result:', { insights, insightsError });

      if (insightsError) {
        console.error('❌ Error fetching AI insights:', insightsError);
        // If table doesn't exist or no insights found, that's okay
        setAnalysis(null);
        return;
      }

      if (insights && insights.length > 0) {
        const insight = insights[0];
        
        console.log('✅ Found AI insight:', insight);
        
        // Content may be a JSON string (structured result) or plain text (legacy)
        let summary = insight.content as string;
        let keyFindings: string[] = [];
        let riskWarnings: string[] = [];
        let recommendations: string[] = [];
        try {
          if (typeof insight.content === 'string' && insight.content.trim().startsWith('{')) {
            const parsed = JSON.parse(insight.content);
            summary = parsed.summary || summary;
            keyFindings = Array.isArray(parsed.keyFindings) ? parsed.keyFindings : keyFindings;
            riskWarnings = Array.isArray(parsed.riskWarnings) ? parsed.riskWarnings : riskWarnings;
            recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : recommendations;
          }
        } catch (e) {
          console.warn('⚠️ Failed to parse AI insight JSON; using legacy content');
        }

        if (keyFindings.length === 0) keyFindings = [summary];
        if (recommendations.length === 0) recommendations = [`Based on ${insight.insight_type}: ${summary}`];

        const formattedAnalysis: AIAnalysis = {
          id: insight.id,
          recordId: insight.record_id,
          summary,
          keyFindings,
          riskWarnings,
          recommendations,
          confidence: insight.confidence_score,
          processedAt: new Date(insight.created_at),
          recordTitle: recordTitle,
        };
        
        console.log('📊 Formatted analysis:', formattedAnalysis);
        setAnalysis(formattedAnalysis);
      } else {
        console.log('ℹ️ No AI insights found for this record');
        setAnalysis(null);
        setError('No AI analysis available for this record. Please ensure the record was uploaded recently and AI analysis has completed.');
      }
    } catch (error: any) {
      console.error('❌ Error fetching analysis:', error);
      setError('Failed to load analysis');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshAnalysis = async () => {
    setError(null);
    await fetchAnalysis();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-indigo-600" />
            AI Analysis - {recordTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Record Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Health Record Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Type:</span> {recordType}
                </div>
                <div>
                  <span className="font-medium">File:</span> {fileName || 'No file'}
                </div>
                {recordDescription && (
                  <div className="col-span-2">
                    <span className="font-medium">Description:</span> {recordDescription}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Analysis Section */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <InlineLoadingSpinner />
              <span className="ml-2">Loading analysis...</span>
            </div>
          ) : analysis ? (
            <div className="space-y-4">
              {/* Analysis Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">AI Analysis Results</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={getConfidenceColor(analysis.confidence)}
                      >
                        {getConfidenceLabel(analysis.confidence)} Confidence
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {analysis.processedAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Confidence Score */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Confidence Score</span>
                        <span>{Math.round(analysis.confidence * 100)}%</span>
                      </div>
                      <Progress value={analysis.confidence * 100} className="h-2" />
                    </div>

                    {/* Summary */}
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Summary
                      </h4>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                        {analysis.summary}
                      </p>
                    </div>

                    {/* Key Findings */}
                    {analysis.keyFindings && analysis.keyFindings.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Key Findings
                        </h4>
                        <ul className="space-y-1">
                          {analysis.keyFindings.map((finding, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-indigo-600 mt-1">•</span>
                              {finding}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Risk Warnings */}
                    {analysis.riskWarnings && analysis.riskWarnings.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          Risk Warnings
                        </h4>
                        <ul className="space-y-1">
                          {analysis.riskWarnings.map((warning, index) => (
                            <li key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded-md flex items-start gap-2">
                              <span className="text-red-600 mt-1">⚠</span>
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommendations */}
                    {analysis.recommendations && analysis.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2 text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          Recommendations
                        </h4>
                        <ul className="space-y-1">
                          {analysis.recommendations.map((recommendation, index) => (
                            <li key={index} className="text-sm text-green-700 bg-green-50 p-2 rounded-md flex items-start gap-2">
                              <span className="text-green-600 mt-1">💡</span>
                              {recommendation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : error ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-red-600">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <p>{error}</p>
                  <Button 
                    variant="outline" 
                    onClick={fetchAnalysis}
                    className="mt-4"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-red-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                  <h3 className="text-lg font-medium mb-2">Analysis Error</h3>
                  <p className="mb-4 text-sm">{error}</p>
                  <Button onClick={handleRefreshAnalysis} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No Analysis Available</h3>
                  <p className="mb-4 text-sm">
                    This health record hasn't been analyzed yet. AI analysis is performed automatically when records are uploaded.
                    <br />
                    <span className="text-xs text-gray-400 mt-2 block">
                      If you just uploaded this record, please wait a few moments for analysis to complete.
                    </span>
                  </p>
                  <div className="space-y-2">
                    <Button onClick={handleRefreshAnalysis} variant="outline" className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Analysis
                    </Button>
                    <p className="text-xs text-gray-400">
                      Click refresh to check if analysis has completed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleRefreshAnalysis}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIAnalysisModal;
