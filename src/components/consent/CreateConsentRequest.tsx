import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RecordType } from '@/types';
import { createConsentRequest, getPatientsForDoctor } from '@/services/consentService';
import { toast } from '@/hooks/use-toast';
import { Plus, Send } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  email: string;
}

interface CreateConsentRequestProps {
  doctorId: string;
  onRequestCreated: () => void;
}

const CreateConsentRequest: React.FC<CreateConsentRequestProps> = ({ doctorId, onRequestCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [purpose, setPurpose] = useState('');
  const [message, setMessage] = useState('');
  const [duration, setDuration] = useState(30);
  const [selectedDataTypes, setSelectedDataTypes] = useState<RecordType[]>([]);

  const dataTypeOptions: { value: RecordType; label: string }[] = [
    { value: 'lab_test', label: 'Lab Test Results' },
    { value: 'imaging', label: 'Imaging Studies' },
    { value: 'prescription', label: 'Prescriptions' },
    { value: 'consultation', label: 'Consultation Notes' },
    { value: 'vaccination', label: 'Vaccination Records' },
    { value: 'other', label: 'Other Records' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadPatients();
    }
  }, [isOpen]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      console.log('Component: Loading patients for doctor:', doctorId);
      const patientsData = await getPatientsForDoctor(doctorId);
      console.log('Component: Received patients data:', patientsData);
      setPatients(patientsData);
    } catch (error) {
      console.error('Component: Error loading patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDataTypeChange = (dataType: RecordType, checked: boolean) => {
    if (checked) {
      setSelectedDataTypes(prev => [...prev, dataType]);
    } else {
      setSelectedDataTypes(prev => prev.filter(type => type !== dataType));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient || !purpose || selectedDataTypes.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await createConsentRequest({
        patientId: selectedPatient,
        doctorId,
        purpose,
        requestedDataTypes: selectedDataTypes,
        duration,
        message: message || undefined
      });

      toast({
        title: "Consent Request Sent",
        description: "Your consent request has been sent to the patient",
      });

      // Reset form
      setSelectedPatient('');
      setPurpose('');
      setMessage('');
      setDuration(30);
      setSelectedDataTypes([]);
      setIsOpen(false);
      onRequestCreated();
    } catch (error) {
      console.error('Error creating consent request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to create consent request: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Request Consent
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle>Create Consent Request</DialogTitle>
          <DialogDescription>
            Request access to a patient's health data for medical consultation
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="patient">Select Patient *</Label>
            {patients.length === 0 ? (
              <div className="p-4 border border-dashed border-muted-foreground rounded-lg text-center">
                <p className="text-muted-foreground">No patients found in the database.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please ensure patient profiles exist before creating consent requests.
                </p>
              </div>
            ) : (
              <Select value={selectedPatient} onValueChange={setSelectedPatient} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} ({patient.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose of Access *</Label>
            <Input
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., Cardiac consultation and treatment planning"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message to Patient (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain why you need access to their data..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Requested Data Types *</Label>
            <div className="grid grid-cols-2 gap-3">
              {dataTypeOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={selectedDataTypes.includes(option.value)}
                    onCheckedChange={(checked) => 
                      handleDataTypeChange(option.value, checked as boolean)
                    }
                  />
                  <Label htmlFor={option.value} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Access Duration (Days)</Label>
            <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedPatient || !purpose || selectedDataTypes.length === 0}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateConsentRequest;
