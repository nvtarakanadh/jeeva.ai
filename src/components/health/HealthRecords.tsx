import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

interface HealthRecordItem {
  id: string;
  record_type: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: string | null;
  date_recorded: string;
  created_at: string;
}

const HealthRecords = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recordType, setRecordType] = useState<Enums<'record_type'> | 'other'>('lab_report');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [loadingList, setLoadingList] = useState(false);
  const [records, setRecords] = useState<HealthRecordItem[]>([]);

  const loadRecords = async () => {
    if (!profile?.email) return;
    setLoadingList(true);
    try {
      const data = await apiFetch<HealthRecordItem[]>(`/api/records/`, {
        method: 'GET',
        headers: { 'X-User-Email': profile.email },
      });
      setRecords(data || []);
    } catch (e) {
      console.error('Error loading records:', e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const handleGetSignedUrl = async (url: string | null) => url;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.email) return;
    if (!file || !title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please select a file and enter a title.',
      });
      return;
    }

    setUploading(true);
    try {
      // Upload file to backend if provided
      let uploadedUrl: string | null = null;
      if (file) {
        const form = new FormData();
        form.append('file', file);
        const uploadRes = await apiFetch<any>(`/api/records/upload/`, {
          method: 'POST',
          headers: { 'X-User-Email': profile.email },
          body: form,
        });
        uploadedUrl = uploadRes?.file_url || null;
      }

      const created = await apiFetch<any>(`/api/records/`, {
        method: 'POST',
        headers: { 'X-User-Email': profile.email },
        body: {
          record_type: recordType,
          title: title.trim(),
          description: description.trim() || null,
          file_url: uploadedUrl,
          file_type: file?.type || null,
        },
      });

      // Invoke AI analysis (basic: use title + description)
      try {
        // If the uploaded file is an image, include base64 to enable handwritten prescription OCR by Gemini
        let image_base64: string | undefined;
        let image_mime: string | undefined;
        if (file && file.type.startsWith('image/')) {
          const asBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String((reader.result as string).split(',')[1] || ''));
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
          });
          image_base64 = asBase64;
          image_mime = file.type;
        }

        await apiFetch(`/api/ai/insights/analyze/`, {
          method: 'POST',
          headers: { 'X-User-Email': profile.email },
          body: {
            record_id: created?.id,
            record_type: recordType,
            record_text: `${title} \n${description}`.trim(),
            image_base64,
            image_mime,
          },
        });
      } catch (analysisError) {
        console.warn('AI analysis failed, continuing:', analysisError);
      }

      toast({ title: 'Record uploaded' });
      setOpen(false);
      setTitle('');
      setDescription('');
      setRecordType('lab_report');
      setFile(null);
      await loadRecords();
    } catch (err: any) {
      console.error('Upload failed:', err);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: err?.message || 'Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Health Records</CardTitle>
          <CardDescription>
            Upload and manage your medical documents, prescriptions, and test results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Upload New Record
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Health Record</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleUpload}>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Blood Test Results" />
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
                </div>
                <div>
                  <Label>Record Type</Label>
                  <Select value={recordType} onValueChange={(v) => setRecordType(v as Enums<'record_type'>)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prescription">Prescription</SelectItem>
                      <SelectItem value="lab_report">Lab Report</SelectItem>
                      <SelectItem value="imaging">Imaging</SelectItem>
                      <SelectItem value="consultation_note">Consultation Note</SelectItem>
                      <SelectItem value="discharge_summary">Discharge Summary</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="file">File</Label>
                  <Input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Records</CardTitle>
          <CardDescription>
            {loadingList ? 'Loading...' : records.length ? 'Your uploaded health records' : 'No records yet'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {records.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-3 border rounded-md">
              <div className="min-w-0">
                <p className="font-medium truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {r.record_type.replace('_', ' ')} • {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const url = await handleGetSignedUrl(r.file_url);
                    if (url) {
                      window.open(url, '_blank');
                    }
                  }}
                  disabled={!r.file_url}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthRecords;