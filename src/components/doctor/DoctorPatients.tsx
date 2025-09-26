import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DoctorPatients = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [noteTitle, setNoteTitle] = useState('Prescription');
  const [noteDesc, setNoteDesc] = useState('');
  const [noteType, setNoteType] = useState<'prescription' | 'consultation_note'>('prescription');
  const [savingNote, setSavingNote] = useState(false);
  

  const loadPatients = async () => {
    if (!profile?.email) return;
    setLoading(true);
    try {
      const data = await apiFetch<any[]>(`/api/consents/?role=doctor`, {
        headers: { 'X-User-Email': profile.email },
      });
      const uniquePatientsMap = new Map<string, any>();
      (data || []).filter(r => r.status === 'approved').forEach((r: any) => {
        if (r.patient && !uniquePatientsMap.has(r.patient.email)) {
          uniquePatientsMap.set(r.patient.email, r.patient);
        }
      });
      setPatients(Array.from(uniquePatientsMap.values()));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.email]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.email) {
      toast({ variant: 'destructive', title: 'Doctor profile not ready', description: 'Please wait and try again.' });
      return;
    }
    if (!email.trim()) {
      toast({ variant: 'destructive', title: 'Email required', description: 'Enter the patient email to request consent.' });
      return;
    }
    setAdding(true);
    try {
      await apiFetch('/api/consents/', {
        method: 'POST',
        headers: { 'X-User-Email': profile.email },
        body: { patient_email: email.trim(), purpose: 'Add patient under care' },
      });
      toast({ title: 'Consent request sent' });
      setEmail('');
      await loadPatients();
    } catch (err: any) {
      console.error('Error requesting consent:', err);
      toast({ variant: 'destructive', title: 'Failed to send request', description: err?.message || 'Please try again.' });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>My Patients</span>
          </CardTitle>
          <CardDescription>
            View and manage your patients (based on approved consents)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex gap-3" onSubmit={handleAdd}>
            <div className="flex-1">
              <Label htmlFor="email">Add by Email (requests consent)</Label>
              <Input
                id="email"
                type="email"
                placeholder="patient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={adding}>{adding ? 'Sending...' : 'Request'}</Button>
            </div>
          </form>

          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : patients.length === 0 ? (
            <p className="text-muted-foreground">No approved patients yet</p>
          ) : (
            <div className="space-y-2">
              {patients.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{p.first_name} {p.last_name}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Approved</span>
                    <Dialog open={uploadOpen && selectedPatient?.email === p.email} onOpenChange={(v) => { if (!v) { setUploadOpen(false); setSelectedPatient(null); } }}>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => { setSelectedPatient(p); setUploadOpen(true); }}>Add Prescription</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Prescription/Note for {p.first_name || p.email}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm">Type</label>
                            <Select value={noteType} onValueChange={(v) => setNoteType(v as any)}>
                              <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="prescription">Prescription</SelectItem>
                                <SelectItem value="consultation_note">Consultation Note</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm">Title</label>
                            <Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="e.g., Prescription - 25 Sep" />
                          </div>
                          <div>
                            <label className="text-sm">Details</label>
                            <Textarea value={noteDesc} onChange={(e) => setNoteDesc(e.target.value)} placeholder="Medicines, dosage, instructions" rows={5} />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={async () => {
                            if (!profile?.email || !selectedPatient?.email) return;
                            setSavingNote(true);
                            try {
                              const created = await apiFetch<any>(`/api/records/`, {
                                method: 'POST',
                                headers: { 'X-User-Email': profile.email },
                                body: {
                                  patient_email: selectedPatient.email,
                                  record_type: noteType,
                                  title: noteTitle.trim() || 'Prescription',
                                  description: noteDesc.trim() || null,
                                  file_url: '',
                                  file_type: 'text/plain',
                                },
                              });
                              await apiFetch(`/api/ai/insights/analyze/`, {
                                method: 'POST',
                                headers: { 'X-User-Email': profile.email },
                                body: {
                                  patient_email: selectedPatient.email,
                                  record_id: created?.id,
                                  record_type: noteType,
                                  record_text: `${noteTitle}\n${noteDesc}`.trim(),
                                },
                              });
                              toast({ title: 'Prescription added' });
                              setUploadOpen(false);
                              setSelectedPatient(null);
                            } catch (e: any) {
                              toast({ variant: 'destructive', title: 'Failed to add', description: e?.message || 'Please try again.' });
                            } finally {
                              setSavingNote(false);
                            }
                          }} disabled={savingNote}>{savingNote ? 'Saving...' : 'Save'}</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorPatients;