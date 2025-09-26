import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ConsentRequests = () => {
  const { profile, user, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [patientEmail, setPatientEmail] = useState('');
  const [purpose, setPurpose] = useState('Access to lab results for second opinion');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  const resolveDoctorId = async (): Promise<string | null> => {
    try {
      if (doctorId) return doctorId;
      if (profile?.id) {
        setDoctorId(profile.id);
        return profile.id;
      }
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) {
        console.error('Error resolving doctor id:', error);
        return null;
      }
      if (data?.id) {
        setDoctorId(data.id);
        // Refresh global profile in background
        refreshProfile?.();
        return data.id;
      }
      return null;
    } catch (e) {
      console.error('Resolve doctor id exception:', e);
      return null;
    }
  };

  const loadRequests = async () => {
    const id = await resolveDoctorId();
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('consent_requests')
        .select(`
          id,
          status,
          purpose,
          expiry_date,
          requested_at,
          responded_at,
          patient:patient_id ( id, first_name, last_name, email )
        `)
        .eq('doctor_id', id)
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Error loading consent requests:', error);
      } else {
        setRequests(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const id = await resolveDoctorId();
    if (!id) {
      toast({
        variant: 'destructive',
        title: 'Doctor profile not ready',
        description: 'Please wait a moment and try again.',
      });
      return;
    }

    if (!patientEmail.trim()) {
      toast({
        variant: 'destructive',
        title: 'Patient email required',
        description: 'Enter the patient email to send a consent request.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: patientProfile, error: findErr } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('email', patientEmail.trim())
        .maybeSingle();

      if (findErr) {
        throw findErr;
      }
      if (!patientProfile) {
        toast({
          variant: 'destructive',
          title: 'Patient not found',
          description: 'No profile exists with this email.',
        });
        return;
      }

      const { error: insertErr } = await supabase
        .from('consent_requests')
        .insert({
          patient_id: patientProfile.id,
          doctor_id: id,
          purpose: purpose.trim() || 'Access to health records',
          expiry_date: expiryDate ? expiryDate : null,
        });

      if (insertErr) throw insertErr;

      toast({ title: 'Consent request sent' });
      setPatientEmail('');
      setPurpose('Access to lab results for second opinion');
      setExpiryDate('');
      await loadRequests();
    } catch (err: any) {
      console.error('Error creating consent request:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to send request',
        description: err?.message || 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Request Consent</span>
          </CardTitle>
          <CardDescription>
            Ask a patient for permission to access their health records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <div className="sm:col-span-2">
              <Label htmlFor="patientEmail">Patient Email</Label>
              <Input
                id="patientEmail"
                type="email"
                placeholder="patient@example.com"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                id="purpose"
                placeholder="Reason for access"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="expiry">Expiry Date (optional)</Label>
              <Input
                id="expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Consent Requests</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : 'Recent requests you have sent'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.length === 0 && (
            <p className="text-muted-foreground">No requests yet</p>
          )}
          {requests.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <p className="font-medium">
                  {r.patient?.first_name} {r.patient?.last_name}
                </p>
                <p className="text-xs text-muted-foreground">{r.patient?.email}</p>
                <p className="text-xs text-muted-foreground">{r.purpose}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium capitalize">{r.status}</span>
                {r.expiry_date && (
                  <p className="text-xs text-muted-foreground">Expires: {r.expiry_date}</p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsentRequests;