import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Image, Download, Brain, Search, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { HealthRecord, RecordType } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const HealthRecords = () => {
  const { user, session } = useAuth();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [uploadData, setUploadData] = useState({
    title: '',
    recordType: '' as RecordType | '',
    date: '',
    description: '',
    provider: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<RecordType | 'all'>('all');
  const [isUploading, setIsUploading] = useState(false);

  // Fetch health records on component mount
  useEffect(() => {
    if (user && session) {
      fetchHealthRecords();
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
        tags: record.tags || [],
        aiAnalysis: null, // We'll populate this separately if needed
      })) || [];

      setRecords(formattedRecords);
    } catch (error: any) {
      toast({
        title: "Error loading records",
        description: error.message,
        variant: "destructive",
      });
<<<<<<< HEAD
=======
    } finally {
      setIsLoading(false);
    }
  };

  // Test function for debugging AI analysis
  const testAIAnalysis = async () => {
    console.log('🧪 Testing AI analysis...');
    try {
      const testData = {
        title: 'Test Health Record',
        recordType: 'prescription',
        description: 'Test prescription for blood pressure medication',
        serviceDate: new Date().toISOString().split('T')[0],
      };
      
      console.log('🧪 Test data:', testData);
      const result = await analyzeHealthRecordWithAI(testData);
      console.log('🧪 Test AI result:', result);
      return result;
    } catch (error) {
      console.error('🧪 Test AI error:', error);
      console.error('🧪 Error details:', error.message);
      console.error('🧪 Error stack:', error.stack);
    }
  };

  // Make test function available globally for debugging
  (window as any).testAIAnalysis = testAIAnalysis;
  
  // Add function to test AI analysis with a specific record
  (window as any).testAIAnalysisForRecord = async (recordId: string) => {
    console.log('🧪 Testing AI analysis for record:', recordId);
    try {
      // Get the record details
      const { data: record, error: recordError } = await supabase
        .from('health_records')
        .select('*')
        .eq('id', recordId)
        .single();
      
      if (recordError) {
        console.error('❌ Error fetching record:', recordError);
        return;
      }
      
      console.log('📋 Record found:', record);
      
      // Test AI analysis
      const result = await triggerAIAnalysis(
        record.id,
        record.title,
        record.record_type,
        record.description || '',
        record.file_url,
        record.file_name
      );
      
      console.log('✅ AI analysis test completed');
      return result;
    } catch (error) {
      console.error('❌ AI analysis test failed:', error);
    }
  };

  // Add function to check AI insights in database
  (window as any).checkAIInsights = async () => {
    console.log('🔍 Checking AI insights in database...');
    try {
      const { data: insights, error } = await supabase
        .from('ai_insights')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('📊 AI insights found:', insights?.length || 0);
      console.log('📋 Insights data:', insights);
      if (error) console.error('❌ Error fetching insights:', error);
      
      return insights;
    } catch (error) {
      console.error('❌ Error checking insights:', error);
    }
  };

  // Add function to check API keys
  (window as any).checkAPIKeys = () => {
    console.log('🔍 Checking API keys...');
    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    
    console.log('🔑 Groq API Key:', groqKey ? 'Found (' + groqKey.substring(0, 10) + '...)' : 'Not found');
    console.log('🔍 All env vars:', Object.keys(import.meta.env).filter(key => key.includes('GROQ')));
    console.log('🔍 VITE_GROQ_API_KEY value:', import.meta.env.VITE_GROQ_API_KEY);
    
    return { groqKey: !!groqKey };
  };

  // Add function to manually set API key for testing
  (window as any).setGroqAPIKey = (key: string) => {
    console.log('🔧 Manually setting Groq API key...');
    (window as any).GROQ_API_KEY = key;
    console.log('✅ API key set:', key ? key.substring(0, 10) + '...' : 'None');
  };

  // Add function to test Groq API directly
  (window as any).testGroqAPI = async () => {
    console.log('🧪 Testing Groq API directly...');
    try {
      let groqKey = import.meta.env.VITE_GROQ_API_KEY;
      
      // Fallback to manually set key
      if (!groqKey) {
        groqKey = (window as any).GROQ_API_KEY;
      }
      
      // Final fallback removed to avoid committing secrets.
      
      console.log('🔑 Using API key:', groqKey ? groqKey.substring(0, 10) + '...' : 'None');
      
      if (!groqKey) {
        console.error('❌ No Groq API key found');
        return;
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'user',
              content: 'Hello, this is a test. Please respond with "Groq API is working!"'
            }
          ],
          temperature: 0.3,
          max_tokens: 100
        })
      });

      if (!response.ok) {
        console.error('❌ Groq API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error details:', errorText);
        return;
      }

      const data = await response.json();
      console.log('✅ Groq API test successful:', data);
      return data;
    } catch (error) {
      console.error('❌ Groq API test failed:', error);
    }
  };

  const triggerAIAnalysis = async (
    recordId: string, 
    title: string, 
    recordType: string, 
    description: string, 
    fileUrl: string | null, 
    fileName: string | null
  ) => {
    try {
      console.log('🤖 Starting AI analysis for record:', recordId);
      console.log('📋 Record data:', { title, recordType, description });
      console.log('👤 User ID:', user?.id);
      
      // Prepare the health record data for AI analysis
      const healthRecordData = {
        title,
        recordType: recordType,
        description: description || '',
        serviceDate: new Date().toISOString().split('T')[0], // Use current date as service date
        fileUrl: fileUrl || undefined,
        fileName: fileName || undefined
      };

      console.log('📤 Calling AI analysis service with data:', healthRecordData);

      // Call the AI analysis service
      const aiResult: AIAnalysisResult = await analyzeHealthRecordWithAI(healthRecordData);

      console.log('✅ AI analysis completed:', aiResult);

      // Save the analysis to the database
      const insertData = {
        record_id: recordId,
        user_id: user?.id,
        insight_type: aiResult.analysisType,
        // Store full structured result as JSON string to render distinct sections later
        content: JSON.stringify(aiResult),
        confidence_score: aiResult.confidence,
      };

      console.log('💾 Saving to database:', insertData);
      console.log('🔍 Record ID type:', typeof recordId);
      console.log('🔍 User ID type:', typeof user?.id);

      const { data: insertResult, error: saveError } = await supabase
        .from('ai_insights')
        .insert(insertData)
        .select();

      if (saveError) {
        console.error('❌ Error saving AI analysis:', saveError);
        console.error('❌ Error details:', saveError.message);
        console.error('❌ Error code:', saveError.code);
        console.error('❌ Error hint:', saveError.hint);
        console.error('❌ Full error object:', JSON.stringify(saveError, null, 2));
        // Don't show error to user as this is background processing
      } else {
        console.log('✅ AI analysis completed and saved successfully');
        console.log('📊 Insert result:', insertResult);
      }
    } catch (error: any) {
      console.error('❌ Error during AI analysis:', error);
      console.error('❌ Error stack:', error.stack);
      // Don't show error to user as this is background processing
>>>>>>> def0c59 (Remove hardcoded Groq API key; rely on env/window only. Quick Actions: Schedule opens modal; remove Consultations card.)
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    multiple: false, // Allow only one file for now
  });

  const handleUpload = async () => {
    if (!uploadData.title || !uploadData.recordType || !uploadData.date) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload records.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;

      // Upload file to Supabase storage if selected
      if (selectedFiles.length > 0) {
        const file = selectedFiles[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('health-records')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('health-records')
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileName = file.name;
      }

      // Save record to database
      const { data, error } = await supabase
        .from('health_records')
        .insert({
          user_id: session.user.id,
          title: uploadData.title,
          record_type: uploadData.recordType,
          description: uploadData.description,
          service_date: uploadData.date,
          provider_name: uploadData.provider || null,
          file_url: fileUrl,
          file_name: fileName,
          tags: [],
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh records
      await fetchHealthRecords();
      
      // Reset form
      setUploadData({
        title: '',
        recordType: '',
        date: '',
        description: '',
        provider: '',
      });
      setSelectedFiles([]);

      toast({
        title: "Upload successful",
        description: "Your health record has been uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your record.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesFilter = filterType === 'all' || record.type === filterType;
    const matchesSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getRecordTypeColor = (type: RecordType) => {
    const colors = {
      'lab-result': 'bg-blue-500',
      'prescription': 'bg-green-500',
      'imaging': 'bg-purple-500',
      'consultation': 'bg-orange-500',
      'vaccination': 'bg-red-500',
      'other': 'bg-gray-500'
    };
    return colors[type] || colors.other;
  };

  const getFileIcon = (fileType?: string) => {
    if (fileType?.startsWith('image/')) return <Image className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Health Records</h1>
        <p className="text-muted-foreground">Upload, organize, and manage your medical documents</p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload New Record</CardTitle>
          <CardDescription>Add a new medical document to your health timeline</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Blood Test Results"
                value={uploadData.title}
                onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recordType">Record Type *</Label>
              <Select 
                value={uploadData.recordType} 
                onValueChange={(value: RecordType) => setUploadData(prev => ({ ...prev, recordType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select record type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lab-result">Lab Result</SelectItem>
                  <SelectItem value="prescription">Prescription</SelectItem>
                  <SelectItem value="imaging">Imaging</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="vaccination">Vaccination</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Service Date *</Label>
              <Input
                id="date"
                type="date"
                value={uploadData.date}
                onChange={(e) => setUploadData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Input
                id="provider"
                placeholder="Doctor or facility name"
                value={uploadData.provider}
                onChange={(e) => setUploadData(prev => ({ ...prev, provider: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional notes about this record"
              value={uploadData.description}
              onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* File Upload */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/10' 
                : 'border-gray-300 hover:border-primary'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            {selectedFiles.length > 0 ? (
              <div>
                <p className="font-medium">{selectedFiles[0].name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFiles[0].size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium">Drop your file here, or click to browse</p>
                <p className="text-sm text-muted-foreground">
                  Supports PDF and image files up to 10MB
                </p>
              </div>
            )}
          </div>

          <Button 
            onClick={handleUpload}
            disabled={isUploading || (!selectedFiles.length && !uploadData.title)}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload Record'}
          </Button>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={(value: RecordType | 'all') => setFilterType(value)}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="lab-result">Lab Results</SelectItem>
                <SelectItem value="prescription">Prescriptions</SelectItem>
                <SelectItem value="imaging">Imaging</SelectItem>
                <SelectItem value="consultation">Consultations</SelectItem>
                <SelectItem value="vaccination">Vaccinations</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Records Timeline */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Health Timeline</h2>
        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No records found</p>
              <p className="text-muted-foreground">
                {records.length === 0 
                  ? "Upload your first health record to get started" 
                  : "Try adjusting your search or filter criteria"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRecords.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      {getFileIcon(record.fileName)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{record.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs text-white ${getRecordTypeColor(record.type)}`}>
                          {record.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      {record.description && (
                        <p className="text-muted-foreground mb-2">{record.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{record.recordDate.toLocaleDateString()}</span>
                        {record.fileName && <span>• {record.fileName}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.aiAnalysis && (
                      <Button variant="outline" size="sm">
                        <Brain className="h-4 w-4 mr-2" />
                        View Analysis
                      </Button>
                    )}
                    {record.fileUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={record.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default HealthRecords;