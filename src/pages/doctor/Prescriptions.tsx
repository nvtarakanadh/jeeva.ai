import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pill, Plus, Calendar, User, FileText, Download, Edit, Trash2, Eye, Stethoscope, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createPrescription, Prescription } from '@/services/prescriptionService';
import { getOptimizedPrescriptionsForDoctor, getOptimizedPatientsForDoctor, clearPrescriptionCache } from '@/services/optimizedPrescriptionService';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { PageSkeleton } from '@/components/ui/skeleton-loading';

const Prescriptions = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string>('all');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);

  const [formData, setFormData] = useState({
    patient_id: '',
    title: '',
    description: '',
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    prescription_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const loadAllData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Get doctor profile once
        const { data: doctorProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (profileError || !doctorProfile) {
          throw new Error('Doctor profile not found');
        }

        // Load both prescriptions and patients in parallel
        const [prescriptionsData, patientsData] = await Promise.all([
          getOptimizedPrescriptionsForDoctor(doctorProfile.id),
          getOptimizedPatientsForDoctor(doctorProfile.id)
        ]);

        setPrescriptions(prescriptionsData as Prescription[]);
        setPatients(patientsData as any[]);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load prescriptions data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [user]);

  const refreshData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get doctor profile once
      const { data: doctorProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !doctorProfile) {
        throw new Error('Doctor profile not found');
      }

      // Clear cache and reload data
      clearPrescriptionCache(doctorProfile.id);
      
      // Load both prescriptions and patients in parallel
      const [prescriptionsData, patientsData] = await Promise.all([
        getOptimizedPrescriptionsForDoctor(doctorProfile.id),
        getOptimizedPatientsForDoctor(doctorProfile.id)
      ]);

      setPrescriptions(prescriptionsData as Prescription[]);
      setPatients(patientsData as any[]);
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      
      // First get the doctor's profile ID
      const { data: doctorProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !doctorProfile) {
        throw new Error('Doctor profile not found');
      }


      const prescriptionData = {
        ...formData,
        doctor_id: doctorProfile.id,
      };


      await createPrescription(prescriptionData);
      
      toast({
        title: "Success",
        description: "Prescription created successfully",
      });
      
      setIsCreateOpen(false);
      setFormData({
        patient_id: '',
        title: '',
        description: '',
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        prescription_date: new Date().toISOString().split('T')[0],
      });
      
      refreshData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create prescription",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const handleEdit = (prescription: Prescription) => {
    setEditingPrescription(prescription);
    setFormData({
      patient_id: prescription.patient_id,
      title: prescription.title,
      description: prescription.description || '',
      medication: prescription.medication,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
      duration: prescription.duration,
      instructions: prescription.instructions || '',
      prescription_date: prescription.prescription_date,
    });
    setIsEditModalOpen(true);
  };

  const handleView = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setIsViewModalOpen(true);
  };

  const handleUpdatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrescription) return;

    try {
      
      // First get the doctor's profile ID
      const { data: doctorProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (profileError || !doctorProfile) {
        throw new Error('Doctor profile not found');
      }


      const updateData = {
        ...formData,
        doctor_id: doctorProfile.id,
      };


      const { error } = await supabase
        .from('prescriptions')
        .update(updateData)
        .eq('id', editingPrescription.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Prescription updated successfully",
      });

      setIsEditModalOpen(false);
      setEditingPrescription(null);
      setFormData({
        patient_id: '',
        title: '',
        description: '',
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        prescription_date: new Date().toISOString().split('T')[0],
      });
      
      refreshData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update prescription",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (prescription: Prescription) => {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .delete()
        .eq('id', prescription.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Prescription deleted successfully",
      });

      refreshData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete prescription",
        variant: "destructive",
      });
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => 
    selectedPatient === 'all' || prescription.patient_id === selectedPatient
  );

  // Get unique patients from prescriptions
  const uniquePatientIds = Array.from(new Set(prescriptions.map(p => p.patient_id)));
  const uniquePatients = uniquePatientIds.map(patientId => {
    const prescription = prescriptions.find(p => p.patient_id === patientId);
    return {
      id: patientId,
      name: prescription?.profiles?.full_name || 'Unknown Patient'
    };
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Prescriptions</h1>
            <p className="text-muted-foreground">
              Create and manage patient prescriptions
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <PageSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prescriptions</h1>
          <p className="text-muted-foreground">
            Create and manage patient prescriptions
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Prescription</DialogTitle>
              <DialogDescription>
                Create a prescription for a patient. This will be saved to their profile.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePrescription} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient">Patient</Label>
                  <Select
                    value={formData.patient_id}
                    onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.full_name} ({patient.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prescription_date">Prescription Date</Label>
                  <Input
                    id="prescription_date"
                    type="date"
                    value={formData.prescription_date}
                    onChange={(e) => setFormData({ ...formData, prescription_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Blood Pressure Medication"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the prescription"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="medication">Medication</Label>
                  <Input
                    id="medication"
                    value={formData.medication}
                    onChange={(e) => setFormData({ ...formData, medication: e.target.value })}
                    placeholder="e.g., Lisinopril"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    placeholder="e.g., 10mg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Once daily">Once daily</SelectItem>
                      <SelectItem value="Twice daily">Twice daily</SelectItem>
                      <SelectItem value="Three times daily">Three times daily</SelectItem>
                      <SelectItem value="Four times daily">Four times daily</SelectItem>
                      <SelectItem value="As needed">As needed</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 30 days"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Special instructions for the patient"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Prescription</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prescriptions</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prescriptions.length}</div>
            <p className="text-xs text-muted-foreground">
              Created by you
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniquePatients.length}</div>
            <p className="text-xs text-muted-foreground">
              With prescriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {prescriptions.filter(p => {
                const prescriptionDate = new Date(p.prescription_date);
                const now = new Date();
                return prescriptionDate.getMonth() === now.getMonth() && 
                       prescriptionDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Prescriptions created
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={selectedPatient} onValueChange={setSelectedPatient}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select Patient" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Patients</SelectItem>
            {uniquePatients.map(patient => (
              <SelectItem key={patient.id} value={patient.id}>
                {patient.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Prescriptions List */}
      <div className="space-y-4">
        {filteredPrescriptions.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No prescriptions found</p>
            </CardContent>
          </Card>
        ) : (
          filteredPrescriptions.map((prescription) => (
            <Card key={prescription.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Pill className="h-4 w-4" />
                    <CardTitle className="text-lg">{prescription.title}</CardTitle>
                    <Badge className="bg-green-100 text-green-800">Prescription</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(prescription)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleView(prescription)}>
                      <FileText className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    {prescription.file_url && (
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(prescription)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>{prescription.profiles?.full_name || 'Unknown Patient'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(prescription.prescription_date)}</span>
                    </div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Medication</Label>
                      <p className="text-sm text-muted-foreground">{prescription.medication}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Dosage</Label>
                      <p className="text-sm text-muted-foreground">{prescription.dosage}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Frequency</Label>
                      <p className="text-sm text-muted-foreground">{prescription.frequency}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Duration</Label>
                      <p className="text-sm text-muted-foreground">{prescription.duration}</p>
                    </div>
                  </div>
                  {prescription.instructions && (
                    <div>
                      <Label className="text-sm font-medium">Instructions</Label>
                      <p className="text-sm text-muted-foreground">{prescription.instructions}</p>
                    </div>
                  )}
                  {prescription.description && (
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm text-muted-foreground">{prescription.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Prescription Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Prescription Details
            </DialogTitle>
            <DialogDescription>
              Complete prescription information and instructions
            </DialogDescription>
          </DialogHeader>
          
          {selectedPrescription && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold">{selectedPrescription.title}</h3>
                  <Badge className="bg-blue-100 text-blue-800">Prescription</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>Patient ID: {selectedPrescription.patient_id}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(selectedPrescription.prescription_date), 'MMMM do, yyyy')}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedPrescription.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedPrescription.description}
                  </p>
                </div>
              )}

              {/* Prescription Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Pill className="h-4 w-4" />
                      Medication Details
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Medication Name</span>
                        <p className="text-lg font-semibold text-gray-900">{selectedPrescription.medication}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Dosage</span>
                        <p className="text-gray-900">{selectedPrescription.dosage}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Frequency</span>
                        <p className="text-gray-900">{selectedPrescription.frequency}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Duration</span>
                        <p className="text-gray-900">{selectedPrescription.duration}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Instructions
                    </h4>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Special Instructions</span>
                      <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">
                        {selectedPrescription.instructions || 'No special instructions provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Attachment (if any) */}
              {selectedPrescription.file_url && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Attached File</h4>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800">{selectedPrescription.file_name || 'Prescription File'}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Prescription Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Prescription
            </DialogTitle>
            <DialogDescription>
              Update prescription details and instructions
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdatePrescription} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-patient">Patient</Label>
                <Select
                  value={formData.patient_id}
                  onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name} ({patient.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-prescription_date">Prescription Date</Label>
                <Input
                  id="edit-prescription_date"
                  type="date"
                  value={formData.prescription_date}
                  onChange={(e) => setFormData({ ...formData, prescription_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-medication">Medication</Label>
                <Input
                  id="edit-medication"
                  value={formData.medication}
                  onChange={(e) => setFormData({ ...formData, medication: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dosage">Dosage</Label>
                <Input
                  id="edit-dosage"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-frequency">Frequency</Label>
                <Input
                  id="edit-frequency"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration</Label>
                <Input
                  id="edit-duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-instructions">Instructions</Label>
              <Textarea
                id="edit-instructions"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingPrescription(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                Update Prescription
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Prescriptions;
