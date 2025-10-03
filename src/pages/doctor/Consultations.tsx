import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Stethoscope, CheckCircle, XCircle, AlertCircle, Eye, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { PageLoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/contexts/AuthContext';
import { getDoctorConsultations, Consultation } from '@/services/consultationService';
import { getPatientRecordsForDoctor } from '@/services/patientRecordsService';
import { toast } from '@/hooks/use-toast';
import CreatePrescription from '@/components/prescription/CreatePrescription';
import { supabase } from '@/integrations/supabase/client';

const DoctorConsultations = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [patientRecords, setPatientRecords] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadConsultations();
    }
  }, [user?.id]);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      
      // First get the doctor's profile ID
      const { data: doctorProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (profileError || !doctorProfile) {
        throw new Error('Doctor profile not found');
      }

      const data = await getDoctorConsultations(doctorProfile.id);
      setConsultations(data);
    } catch (error) {
      console.error('Error loading consultations:', error);
      toast({
        title: "Error",
        description: "Failed to load consultations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPatientRecords = async (patientId: string) => {
    try {
      const records = await getPatientRecordsForDoctor(user!.id);
      const patientSpecificRecords = records.filter(record => record.patientId === patientId);
      setPatientRecords(patientSpecificRecords);
    } catch (error) {
      console.error('Error loading patient records:', error);
      toast({
        title: "Error",
        description: "Failed to load patient records",
        variant: "destructive"
      });
    }
  };

  const handleViewConsultation = async (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    if (consultation.status === 'confirmed') {
      await loadPatientRecords(consultation.patient_id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'scheduled_no_consent':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'scheduled_no_consent':
        return <AlertCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'confirmed':
        return 'Confirmed';
      case 'scheduled_no_consent':
        return 'Scheduled (No Consent)';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const upcomingConsultations = consultations.filter(c => 
    ['scheduled', 'confirmed', 'scheduled_no_consent'].includes(c.status)
  );
  const pastConsultations = consultations.filter(c => 
    ['completed', 'cancelled'].includes(c.status)
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Consultations</h1>
            <p className="text-muted-foreground">
              Manage your patient consultations and medical records access
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <PageLoadingSpinner text="Loading consultations..." />
        </div>
      </div>
    );
  }

  if (showPrescriptionForm && selectedConsultation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create Prescription</h1>
            <p className="text-muted-foreground">
              Create a prescription for {selectedConsultation.patient?.full_name}
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowPrescriptionForm(false)}>
            Back to Consultations
          </Button>
        </div>
        <CreatePrescription
          patientId={selectedConsultation.patient_id}
          patientName={selectedConsultation.patient?.full_name || 'Unknown Patient'}
          onPrescriptionCreated={() => {
            setShowPrescriptionForm(false);
            setSelectedConsultation(null);
            toast({
              title: "Prescription Created",
              description: "Prescription has been created successfully.",
            });
          }}
          onCancel={() => setShowPrescriptionForm(false)}
        />
      </div>
    );
  }

  if (selectedConsultation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Consultation Details</h1>
            <p className="text-muted-foreground">
              {selectedConsultation.patient?.full_name} - {format(new Date(selectedConsultation.consultation_date), 'PPP')}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setSelectedConsultation(null)}>
              Back to Consultations
            </Button>
            {selectedConsultation.status === 'confirmed' && (
              <Button onClick={() => setShowPrescriptionForm(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Prescription
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Consultation Info */}
          <Card>
            <CardHeader>
              <CardTitle>Consultation Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Patient</p>
                  <p className="text-lg">{selectedConsultation.patient?.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p className="text-lg">{format(new Date(selectedConsultation.consultation_date), 'PPP')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Time</p>
                  <p className="text-lg">{selectedConsultation.consultation_time}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedConsultation.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(selectedConsultation.status)}
                      <span>{getStatusLabel(selectedConsultation.status)}</span>
                    </div>
                  </Badge>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reason for Consultation</p>
                <p className="text-sm">{selectedConsultation.reason}</p>
              </div>
              
              {selectedConsultation.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedConsultation.notes}</p>
                </div>
              )}

              {selectedConsultation.status === 'scheduled_no_consent' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Patient has not granted access to medical records. Only basic information is available.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Patient Records (if consent granted) */}
          {selectedConsultation.status === 'confirmed' && (
            <Card>
              <CardHeader>
                <CardTitle>Patient Medical Records</CardTitle>
                <CardDescription>
                  Available with patient consent
                </CardDescription>
              </CardHeader>
              <CardContent>
                {patientRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <Stethoscope className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No medical records available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patientRecords.map((record) => (
                      <div key={record.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{record.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {record.recordType} • {format(new Date(record.recordDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Consultations</h1>
          <p className="text-muted-foreground">
            Manage your patient consultations and medical records access
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingConsultations.length}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled appointments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Consent</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {consultations.filter(c => c.status === 'confirmed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Full access granted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {consultations.filter(c => c.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Past consultations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Consultations Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingConsultations.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastConsultations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingConsultations.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No upcoming consultations</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingConsultations.map((consultation) => (
                <Card key={consultation.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Stethoscope className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">
                          {consultation.patient?.full_name}
                        </CardTitle>
                        <Badge className={getStatusColor(consultation.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(consultation.status)}
                            <span>{getStatusLabel(consultation.status)}</span>
                          </div>
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {format(new Date(consultation.consultation_date), 'PPP')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {consultation.consultation_time}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewConsultation(consultation)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{consultation.patient?.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{consultation.consultation_time}</span>
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-medium text-sm">Reason for Consultation:</h4>
                        <p className="text-sm text-muted-foreground">{consultation.reason}</p>
                      </div>
                      {consultation.notes && (
                        <div>
                          <h4 className="font-medium text-sm">Notes:</h4>
                          <p className="text-sm text-muted-foreground">{consultation.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastConsultations.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No past consultations</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pastConsultations.map((consultation) => (
                <Card key={consultation.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Stethoscope className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">
                          {consultation.patient?.full_name}
                        </CardTitle>
                        <Badge className={getStatusColor(consultation.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(consultation.status)}
                            <span>{getStatusLabel(consultation.status)}</span>
                          </div>
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {format(new Date(consultation.consultation_date), 'PPP')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {consultation.consultation_time}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewConsultation(consultation)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{consultation.patient?.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{consultation.consultation_time}</span>
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-medium text-sm">Reason for Consultation:</h4>
                        <p className="text-sm text-muted-foreground">{consultation.reason}</p>
                      </div>
                      {consultation.notes && (
                        <div>
                          <h4 className="font-medium text-sm">Notes:</h4>
                          <p className="text-sm text-muted-foreground">{consultation.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DoctorConsultations;
