import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pill, Download, Eye, Calendar, User, Stethoscope, Search, Filter, X, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { PageLoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/contexts/AuthContext';
import { getPrescriptionsForPatient, Prescription } from '@/services/prescriptionService';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const PatientPrescriptions = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDoctor, setFilterDoctor] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadPrescriptions();
    }
  }, [user?.id]);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      
      
      // First get the patient's profile ID
      const { data: patientProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (profileError || !patientProfile) {
        throw new Error('Patient profile not found');
      }


      const data = await getPrescriptionsForPatient(patientProfile.id);
      setPrescriptions(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load prescriptions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = prescription.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.medication.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDoctor = filterDoctor === 'all' || prescription.profiles?.full_name === filterDoctor;
    const matchesYear = filterYear === 'all' || 
                       new Date(prescription.prescription_date).getFullYear().toString() === filterYear;
    
    return matchesSearch && matchesDoctor && matchesYear;
  });

  const uniqueDoctors = Array.from(
    new Set(prescriptions.map(p => p.profiles?.full_name).filter(Boolean))
  );

  const uniqueYears = Array.from(
    new Set(prescriptions.map(p => new Date(p.prescription_date).getFullYear().toString()))
  ).sort((a, b) => parseInt(b) - parseInt(a));

  const currentYearPrescriptions = filteredPrescriptions.filter(p => 
    new Date(p.prescription_date).getFullYear() === new Date().getFullYear()
  );

  const pastPrescriptions = filteredPrescriptions.filter(p => 
    new Date(p.prescription_date).getFullYear() < new Date().getFullYear()
  );

  const handleDownload = async (prescription: Prescription) => {
    if (!prescription.file_url) {
      toast({
        title: "No File Available",
        description: "This prescription doesn't have an attached file.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = prescription.file_url;
      link.download = prescription.file_name || `prescription-${prescription.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({
        title: "Download Error",
        description: "Failed to download the prescription file.",
        variant: "destructive"
      });
    }
  };

  const handleView = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setIsViewModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Prescriptions</h1>
            <p className="text-muted-foreground">
              View and download your prescription records
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <PageLoadingSpinner text="Loading prescriptions..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Prescriptions</h1>
          <p className="text-muted-foreground">
            View and download your prescription records
          </p>
        </div>
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
              All time prescriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Year</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentYearPrescriptions.length}</div>
            <p className="text-xs text-muted-foreground">
              Prescriptions in {new Date().getFullYear()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Files</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {prescriptions.filter(p => p.file_url).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Downloadable prescriptions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search prescriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterDoctor} onValueChange={setFilterDoctor}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by doctor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doctors</SelectItem>
                {uniqueDoctors.map((doctor) => (
                  <SelectItem key={doctor} value={doctor}>
                    Dr. {doctor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {uniqueYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions Tabs */}
      <Tabs defaultValue="current" className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">
            Current Year ({currentYearPrescriptions.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past Years ({pastPrescriptions.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({filteredPrescriptions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {currentYearPrescriptions.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Pill className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No prescriptions this year</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {currentYearPrescriptions.map((prescription) => (
                <Card key={prescription.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Pill className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{prescription.title}</CardTitle>
                        {prescription.file_url && (
                          <Badge variant="secondary">Has File</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(prescription)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        {prescription.file_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(prescription)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>Dr. {prescription.profiles?.full_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(prescription.prescription_date), 'PPP')}</span>
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Medication Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Medication</div>
                          <div className="text-sm font-semibold text-gray-900 mt-1">{prescription.medication}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Dosage</div>
                          <div className="text-sm font-semibold text-gray-900 mt-1">{prescription.dosage}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Frequency</div>
                          <div className="text-sm font-semibold text-gray-900 mt-1">{prescription.frequency}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Duration</div>
                          <div className="text-sm font-semibold text-gray-900 mt-1">{prescription.duration}</div>
                        </div>
                      </div>
                      
                      {/* Instructions */}
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">Instructions</div>
                        <div className="text-sm text-blue-900">
                          {prescription.instructions || 'No special instructions provided'}
                        </div>
                      </div>
                      {/* Description */}
                      {prescription.description && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Description</div>
                          <div className="text-sm text-gray-900">{prescription.description}</div>
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
          {pastPrescriptions.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No past prescriptions</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pastPrescriptions.map((prescription) => (
                <Card key={prescription.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Pill className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{prescription.title}</CardTitle>
                        {prescription.file_url && (
                          <Badge variant="secondary">Has File</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(prescription)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        {prescription.file_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(prescription)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>Dr. {prescription.profiles?.full_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(prescription.prescription_date), 'PPP')}</span>
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Medication Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Medication</div>
                          <div className="text-sm font-semibold text-gray-900 mt-1">{prescription.medication}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Dosage</div>
                          <div className="text-sm font-semibold text-gray-900 mt-1">{prescription.dosage}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Frequency</div>
                          <div className="text-sm font-semibold text-gray-900 mt-1">{prescription.frequency}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Duration</div>
                          <div className="text-sm font-semibold text-gray-900 mt-1">{prescription.duration}</div>
                        </div>
                      </div>
                      
                      {/* Instructions */}
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">Instructions</div>
                        <div className="text-sm text-blue-900">
                          {prescription.instructions || 'No special instructions provided'}
                        </div>
                      </div>
                      {/* Description */}
                      {prescription.description && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Description</div>
                          <div className="text-sm text-gray-900">{prescription.description}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {filteredPrescriptions.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No prescriptions found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPrescriptions.map((prescription) => (
                <Card key={prescription.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Pill className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{prescription.title}</CardTitle>
                        {prescription.file_url && (
                          <Badge variant="secondary">Has File</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(prescription)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        {prescription.file_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(prescription)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>Dr. {prescription.profiles?.full_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(prescription.prescription_date), 'PPP')}</span>
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Medication Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Medication</div>
                          <div className="text-sm font-semibold text-gray-900 mt-1">{prescription.medication}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Dosage</div>
                          <div className="text-sm font-semibold text-gray-900 mt-1">{prescription.dosage}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Frequency</div>
                          <div className="text-sm font-semibold text-gray-900 mt-1">{prescription.frequency}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Duration</div>
                          <div className="text-sm font-semibold text-gray-900 mt-1">{prescription.duration}</div>
                        </div>
                      </div>
                      
                      {/* Instructions */}
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">Instructions</div>
                        <div className="text-sm text-blue-900">
                          {prescription.instructions || 'No special instructions provided'}
                        </div>
                      </div>
                      {/* Description */}
                      {prescription.description && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Description</div>
                          <div className="text-sm text-gray-900">{prescription.description}</div>
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

      {/* Prescription Details Modal */}
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
                    <span>Dr. {selectedPrescription.profiles?.full_name || 'Unknown Doctor'}</span>
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
                      onClick={() => handleDownload(selectedPrescription)}
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
    </div>
  );
};

export default PatientPrescriptions;
