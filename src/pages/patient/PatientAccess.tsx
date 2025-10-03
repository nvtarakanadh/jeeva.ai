import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Clock, CheckCircle, XCircle, User, Calendar, MessageSquare, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getPatientAccessRequests, 
  getPatientActiveAccess, 
  respondToAccessRequest, 
  revokePatientAccess,
  AccessRequest,
  PatientAccess as PatientAccessType 
} from '@/services/patientAccessService';
import { toast } from '@/hooks/use-toast';
import { PageLoadingSpinner } from '@/components/ui/loading-spinner';

const PatientAccess = () => {
  const { user } = useAuth();
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [activeAccess, setActiveAccess] = useState<PatientAccessType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAccessData();
    }
  }, [user]);

  const loadAccessData = async () => {
    try {
      setLoading(true);
      const [requests, access] = await Promise.all([
        getPatientAccessRequests(user.id),
        getPatientActiveAccess(user.id)
      ]);
      setAccessRequests(requests);
      setActiveAccess(access);
    } catch (error) {
      console.error('Error loading access data:', error);
      toast({
        title: "Error",
        description: "Failed to load access data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId: string, response: 'approved' | 'denied') => {
    try {
      await respondToAccessRequest(requestId, response);
      toast({
        title: "Success",
        description: `Access request ${response} successfully`,
      });
      loadAccessData();
    } catch (error) {
      console.error('Error responding to request:', error);
      toast({
        title: "Error",
        description: "Failed to respond to access request",
        variant: "destructive",
      });
    }
  };

  const handleRevokeAccess = async (accessId: string) => {
    try {
      await revokePatientAccess(accessId);
      toast({
        title: "Success",
        description: "Access revoked successfully",
      });
      loadAccessData();
    } catch (error) {
      console.error('Error revoking access:', error);
      toast({
        title: "Error",
        description: "Failed to revoke access",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getAccessTypeLabel = (accessType: string) => {
    switch (accessType) {
      case 'view_records':
        return 'View Health Records';
      case 'view_prescriptions':
        return 'View Prescriptions';
      case 'view_consultation_notes':
        return 'View Consultation Notes';
      case 'all':
        return 'Full Access';
      default:
        return accessType;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'denied':
      case 'revoked':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingRequests = accessRequests.filter(req => req.status === 'pending');
  const approvedRequests = accessRequests.filter(req => req.status === 'approved');
  const deniedRequests = accessRequests.filter(req => req.status === 'denied');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Access Management</h1>
            <p className="text-muted-foreground">
              Manage who can access your health data
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <PageLoadingSpinner text="Loading access data..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Access Management</h1>
          <p className="text-muted-foreground">
            Manage who can access your health data and ensure your privacy
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Access</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAccess.length}</div>
            <p className="text-xs text-muted-foreground">
              Doctors with access
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Requests approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denied</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deniedRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Requests denied
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Privacy Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Your Privacy Matters:</strong> You have complete control over who can access your health data. 
          Only grant access to trusted healthcare providers and review access regularly.
        </AlertDescription>
      </Alert>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Requests ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active Access ({activeAccess.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Request History ({accessRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests */}
        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No pending access requests</p>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <CardTitle className="text-lg">Dr. {request.doctor_name}</CardTitle>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleRespondToRequest(request.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRespondToRequest(request.id, 'denied')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Deny
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(request.requested_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{request.doctor_email}</span>
                      </div>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Requested Access:</h4>
                      <div className="flex flex-wrap gap-2">
                        {request.requested_access.map((access, index) => (
                          <Badge key={index} variant="outline">
                            {getAccessTypeLabel(access)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {request.message && (
                      <div>
                        <h4 className="font-medium mb-1">Message:</h4>
                        <p className="text-sm text-muted-foreground">{request.message}</p>
                      </div>
                    )}
                    {request.expires_at && (
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Expires: {formatDate(request.expires_at)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Active Access */}
        <TabsContent value="active" className="space-y-4">
          {activeAccess.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No active access granted</p>
              </CardContent>
            </Card>
          ) : (
            activeAccess.map((access) => (
              <Card key={access.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <CardTitle className="text-lg">Dr. {access.doctor_name}</CardTitle>
                      <Badge className={getStatusColor(access.status)}>
                        {access.status}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRevokeAccess(access.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Revoke Access
                    </Button>
                  </div>
                  <CardDescription>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Granted: {formatDate(access.granted_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{access.doctor_email}</span>
                      </div>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Access Type:</h4>
                      <Badge variant="outline">
                        {getAccessTypeLabel(access.access_type)}
                      </Badge>
                    </div>
                    {access.expires_at && (
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Expires: {formatDate(access.expires_at)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Request History */}
        <TabsContent value="history" className="space-y-4">
          {accessRequests.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No access requests found</p>
              </CardContent>
            </Card>
          ) : (
            accessRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <CardTitle className="text-lg">Dr. {request.doctor_name}</CardTitle>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Requested: {formatDate(request.requested_at)}</span>
                      </div>
                      {request.responded_at && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Responded: {formatDate(request.responded_at)}</span>
                        </div>
                      )}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Requested Access:</h4>
                      <div className="flex flex-wrap gap-2">
                        {request.requested_access.map((access, index) => (
                          <Badge key={index} variant="outline">
                            {getAccessTypeLabel(access)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {request.message && (
                      <div>
                        <h4 className="font-medium mb-1">Message:</h4>
                        <p className="text-sm text-muted-foreground">{request.message}</p>
                      </div>
                    )}
                    {request.response_message && (
                      <div>
                        <h4 className="font-medium mb-1">Your Response:</h4>
                        <p className="text-sm text-muted-foreground">{request.response_message}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientAccess;
