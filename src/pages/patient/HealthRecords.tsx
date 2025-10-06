import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileText, Image, Download, Brain, Search, Filter, Eye, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { HealthRecord, RecordType } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { analyzeHealthRecordWithAI, AIAnalysisResult } from '@/services/aiAnalysisService';
import AIAnalysisModal from '@/components/ai/AIAnalysisModal';

export const HealthRecords = () => {
  const { user, session } = useAuth();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [viewingFile, setViewingFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedRecordForAI, setSelectedRecordForAI] = useState<{
    id: string;
    title: string;
    type: string;
    description?: string;
    fileUrl?: string;
    fileName?: string;
  } | null>(null);

  // Fetch health records on component mount
  useEffect(() => {
    if (user && session) {
      console.log('🔄 HealthRecords component mounted, fetching records...');
      fetchHealthRecords();
    } else {
      console.log('⚠️ No user or session, skipping health records fetch');
      setIsLoading(false);
    }
  }, [user, session]);

  const fetchHealthRecords = async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Fetching health records for user:', session.user.id);
      
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      console.log('✅ Health records fetched:', data?.length || 0);

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
      console.log('✅ Records formatted and set:', formattedRecords.length);
    } catch (error: any) {
      console.error('❌ Error fetching health records:', error);
      setError(error.message || "Failed to load health records");
      toast({
        title: "Error loading records",
        description: error.message || "There was an error loading your health records.",
        variant: "destructive",
      });
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
      const groqKey = import.meta.env.VITE_GROQ_API_KEY || (window as any).GROQ_API_KEY;
    
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

      // Trigger AI analysis in the background
      console.log('🚀 Starting AI analysis trigger for record:', data.id);
      console.log('📋 Record data for AI:', {
        id: data.id,
        title: uploadData.title,
        recordType: uploadData.recordType,
        description: uploadData.description,
        fileUrl,
        fileName
      });
      
      // Trigger AI analysis in the background
      triggerAIAnalysis(data.id, uploadData.title, uploadData.recordType, uploadData.description, fileUrl, fileName);

      toast({
        title: "Upload successful",
        description: "Your health record has been uploaded successfully. AI analysis is being processed in the background.",
      });

      // Show additional toast after a delay to inform about AI analysis
      setTimeout(() => {
        toast({
          title: "AI Analysis Complete",
          description: "AI analysis has been completed. Click the 'AI Analytics' button next to your record to view insights.",
        });
      }, 5000); // 5 seconds delay to allow AI analysis to complete
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

  const getFileType = (fileName: string) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(extension || '')) return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) return 'image';
    if (['doc', 'docx'].includes(extension || '')) return 'document';
    return 'file';
  };

  const openFileViewer = async (fileUrl: string, fileName: string) => {
    try {
      const fileType = getFileType(fileName);
      
      // If it's already a full URL, use it directly
      let displayUrl = fileUrl;
      
      // Check if it's a Supabase storage path and try different bucket names
      if (fileUrl && !fileUrl.startsWith('http')) {
        // Try different possible bucket names
        const possibleBuckets = ['medical-files', 'prescriptions', 'consultation-notes', 'health-records', 'files'];
        
        for (const bucket of possibleBuckets) {
          try {
            const { data } = supabase.storage
              .from(bucket)
              .getPublicUrl(fileUrl);
            
            if (data.publicUrl) {
              displayUrl = data.publicUrl;
              break;
            }
          } catch (bucketError) {
            // Continue to next bucket
          }
        }
      }
      
      setViewingFile({ url: displayUrl, name: fileName, type: fileType });
    } catch (error) {
      // Still try to open with the original URL
      const fileType = getFileType(fileName);
      setViewingFile({ url: fileUrl, name: fileName, type: fileType });
    }
  };

  const openAIModal = (record: HealthRecord) => {
    setSelectedRecordForAI({
      id: record.id,
      title: record.title,
      type: record.type,
      description: record.description,
      fileUrl: record.fileUrl,
      fileName: record.fileName
    });
    setIsAIModalOpen(true);
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please log in to delete records.",
        variant: "destructive",
      });
      return;
    }

    console.log('🗑️ Starting delete process for record:', recordId);
    setIsDeleting(recordId);

    try {
      // First, get the record to find the file path
      console.log('📋 Fetching record details...');
      const { data: record, error: fetchError } = await supabase
        .from('health_records')
        .select('file_url, file_name')
        .eq('id', recordId)
        .eq('user_id', session.user.id)
        .single();

      console.log('📋 Record fetch result:', { record, fetchError });

      if (fetchError) {
        console.error('❌ Error fetching record:', fetchError);
        throw fetchError;
      }

      if (!record) {
        throw new Error('Record not found or you do not have permission to delete it');
      }

      // Delete the file from storage if it exists
      if (record.file_url) {
        console.log('📁 Deleting file from storage:', record.file_url);
        try {
          // Extract the file path from the URL or use the file_url directly
          const filePath = record.file_url.includes('/') ? record.file_url.split('/').slice(-2).join('/') : record.file_url;
          console.log('📁 Extracted file path:', filePath);
          
          // Try different possible bucket names
          const possibleBuckets = ['medical-files', 'prescriptions', 'consultation-notes', 'health-records', 'files'];
          
          for (const bucket of possibleBuckets) {
            try {
              console.log(`📁 Trying bucket: ${bucket}`);
              await supabase.storage
                .from(bucket)
                .remove([filePath]);
              console.log(`✅ File deleted from bucket: ${bucket}`);
              break; // If successful, break out of the loop
            } catch (bucketError) {
              console.log(`❌ Failed to delete from bucket ${bucket}:`, bucketError);
              // Continue to next bucket
            }
          }
        } catch (storageError) {
          console.warn('⚠️ Could not delete file from storage:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      } else {
        console.log('ℹ️ No file to delete from storage');
      }

      // Delete the record from the database
      console.log('🗑️ Deleting record from database...');
      const { error: deleteError } = await supabase
        .from('health_records')
        .delete()
        .eq('id', recordId)
        .eq('user_id', session.user.id);

      console.log('🗑️ Database delete result:', { deleteError });

      if (deleteError) {
        console.error('❌ Error deleting record from database:', deleteError);
        throw deleteError;
      }

      console.log('✅ Record deleted successfully, refreshing records...');

      // Refresh records
      await fetchHealthRecords();

      toast({
        title: "Record deleted",
        description: "Your health record has been deleted successfully.",
      });
    } catch (error: any) {
      console.error('❌ Delete failed:', error);
      toast({
        title: "Delete failed",
        description: error.message || "There was an error deleting your record.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const FileViewer = () => {
    if (!viewingFile) return null;

    return (
      <Dialog open={!!viewingFile} onOpenChange={() => setViewingFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {viewingFile.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {viewingFile.type === 'pdf' && (
              <div className="w-full h-[70vh] border rounded-lg">
                <iframe
                  src={viewingFile.url}
                  className="w-full h-full border-0 rounded-lg"
                  title={viewingFile.name}
                  onError={(e) => {
                    console.error('Error loading PDF:', e);
                  }}
                />
              </div>
            )}
            {viewingFile.type === 'image' && (
              <div className="flex items-center justify-center h-[70vh] bg-gray-50 rounded-lg">
                <div className="text-center">
                  <img
                    src={viewingFile.url}
                    alt={viewingFile.name}
                    className="max-w-full max-h-[60vh] object-contain mx-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-600">If image doesn't load, try these options:</p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(viewingFile.url, '_blank')}
                      >
                        Open in New Tab
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = viewingFile.url;
                          link.download = viewingFile.name;
                          link.click();
                        }}
                      >
                        Download
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 break-all">
                      URL: {viewingFile.url}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {viewingFile.type === 'document' && (
              <div className="flex items-center justify-center h-[70vh] bg-gray-100 rounded-lg">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium">Document Preview</p>
                  <p className="text-sm text-gray-500 mb-4">{viewingFile.name}</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Document preview not available in browser.
                  </p>
                  <Button 
                    onClick={() => window.open(viewingFile.url, '_blank')}
                    variant="outline"
                  >
                    Open in New Tab
                  </Button>
                </div>
              </div>
            )}
            {viewingFile.type === 'file' && (
              <div className="flex items-center justify-center h-[70vh] bg-gray-100 rounded-lg">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium">File Preview</p>
                  <p className="text-sm text-gray-500 mb-4">{viewingFile.name}</p>
                  <p className="text-sm text-gray-400 mb-4">
                    File preview not available in browser.
                  </p>
                  <Button 
                    onClick={() => window.open(viewingFile.url, '_blank')}
                    variant="outline"
                  >
                    Open in New Tab
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-gray-500 truncate max-w-md">
              URL: {viewingFile.url}
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(viewingFile.url, '_blank')}
              >
                Open in New Tab
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = viewingFile.url;
                  link.download = viewingFile.name;
                  link.click();
                }}
              >
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {/* File Viewer Modal */}
      <FileViewer />
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
        
        {isLoading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg font-medium">Loading your health records...</p>
              <p className="text-muted-foreground">Please wait while we fetch your data</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-red-500 mb-4">
                <FileText className="h-12 w-12 mx-auto mb-2" />
                <p className="text-lg font-medium">Error loading records</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button 
                onClick={fetchHealthRecords}
                variant="outline"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : filteredRecords.length === 0 ? (
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openAIModal(record)}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      AI Analytics
                    </Button>
                    {record.fileUrl && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openFileViewer(record.fileUrl!, record.fileName || 'Unknown File')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View File
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteRecord(record.id)}
                      disabled={isDeleting === record.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {isDeleting === record.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* AI Analysis Modal */}
      {selectedRecordForAI && (
        <AIAnalysisModal
          isOpen={isAIModalOpen}
          onClose={() => {
            setIsAIModalOpen(false);
            setSelectedRecordForAI(null);
          }}
          recordId={selectedRecordForAI.id}
          recordTitle={selectedRecordForAI.title}
          recordType={selectedRecordForAI.type}
          recordDescription={selectedRecordForAI.description}
          fileUrl={selectedRecordForAI.fileUrl}
          fileName={selectedRecordForAI.fileName}
        />
      )}
    </div>
  );
};

export default HealthRecords;