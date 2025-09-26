import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

interface ConsentItem {
  id: string;
  status: 'pending' | 'approved' | 'denied' | 'revoked';
  purpose: string;
  expiry_date?: string | null;
  requested_at: string;
  doctor?: { id: string; first_name: string; last_name: string; email: string };
}

const ConsentManagement = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ConsentItem[]>([]);

  const load = async () => {
    if (!profile?.email) return;
    setLoading(true);
    try {
      const data = await apiFetch<any[]>(`/api/consents/?role=patient`, {
        headers: { 'X-User-Email': profile.email },
      });
      setItems(data || []);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to load consents', description: e?.message });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [profile?.email]);

  const act = async (id: string, status: 'approved' | 'denied') => {
    if (!profile?.email) return;
    try {
      await apiFetch(`/api/consents/${id}/?role=patient`, {
        method: 'PATCH',
        headers: { 'X-User-Email': profile.email },
        body: { status },
      });
      toast({ title: `Request ${status}` });
      await load();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Action failed', description: e?.message });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Consent Management</span>
          </CardTitle>
          <CardDescription>
            Control who can access your health data and manage permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-muted-foreground">Loading...</p>}
          {!loading && items.length === 0 && (
            <p className="text-muted-foreground">No requests yet</p>
          )}
          {items.map((r) => (
            <div key={r.id} className="p-3 border rounded-md flex items-center justify-between">
              <div className="min-w-0">
                <p className="font-medium">
                  {r.doctor ? `${r.doctor.first_name} ${r.doctor.last_name}` : 'Doctor'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{r.purpose}</p>
                <p className="text-xs text-muted-foreground">Status: {r.status}</p>
              </div>
              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => act(r.id, 'approved')}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => act(r.id, 'denied')}>Deny</Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsentManagement;