import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { mockHospitalSystems, mockHealthRecords } from '@/services/mockData';
import { HospitalSystem, RecordType, FHIRBundle } from '@/types';
import { format } from 'date-fns';
import { Hospital, Share, CheckCircle, Globe, Shield, FileText, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ShareData = () => {
  const [selectedHospital, setSelectedHospital] = useState<string>('');
  const [selectedDataTypes, setSelectedDataTypes] = useState<RecordType[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [shareHistory, setShareHistory] = useState<any[]>([]);

  const availableDataTypes: RecordType[] = ['lab_test', 'prescription', 'imaging', 'consultation', 'vaccination'];

  const handleDataTypeToggle = (dataType: RecordType) => {
    setSelectedDataTypes(prev => 
      prev.includes(dataType) 
        ? prev.filter(t => t !== dataType)
        : [...prev, dataType]
    );
  };

  const handleRecordToggle = (recordId: string) => {
    setSelectedRecords(prev => 
      prev.includes(recordId) 
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  const handleShareData = async () => {
    if (!selectedHospital || (selectedDataTypes.length === 0 && selectedRecords.length === 0)) {
      toast({
        title: "Error",
        description: "Please select a hospital and data to share",
        variant: "destructive"
      });
      return;
    }

    setIsSharing(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const hospital = mockHospitalSystems.find(h => h.id === selectedHospital);
      const sharedRecords = mockHealthRecords.filter(r => 
        selectedRecords.includes(r.id) || selectedDataTypes.includes(r.type)
      );

      // Create FHIR bundle (simplified)
      const fhirBundle: FHIRBundle = {
        resourceType: 'Bundle',
        id: `share-${Date.now()}`,
        type: 'collection',
        timestamp: new Date().toISOString(),
        entry: sharedRecords.map(record => ({
          resource: {
            resourceType: 'DiagnosticReport',
            id: record.id,
            subject: { reference: 'Patient/patient-1' },
            effectiveDateTime: record.recordDate.toISOString(),
            code: {
              coding: [{
                system: 'http://loinc.org',
                code: '11502-2',
                display: record.title
              }]
            }
          }
        }))
      };

      // Add to share history
      const shareRecord = {
        id: `share-${Date.now()}`,
        hospital: hospital?.name,
        sharedAt: new Date(),
        recordCount: sharedRecords.length,
        dataTypes: selectedDataTypes,
        fhirBundle
      };

      setShareHistory(prev => [shareRecord, ...prev]);

      toast({
        title: "Data Shared Successfully",
        description: `${sharedRecords.length} records shared with ${hospital?.name}`,
      });

      // Reset form
      setSelectedHospital('');
      setSelectedDataTypes([]);
      setSelectedRecords([]);
    } catch (error) {
      toast({
        title: "Sharing Failed",
        description: "Failed to share data with hospital system",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  const filteredRecords = mockHealthRecords.filter(record => 
    selectedDataTypes.length === 0 || selectedDataTypes.includes(record.type)
  );

  const downloadFHIRBundle = (bundle: FHIRBundle) => {
    const dataStr = JSON.stringify(bundle, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `fhir-bundle-${bundle.id}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Share Health Data</h1>
        <p className="text-muted-foreground">
          Securely share your health records with other healthcare systems
        </p>
      </div>

      {/* ABDM Compliance Info */}
      <Card className="border-accent">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-accent" />
            <div>
              <h3 className="font-semibold">ABDM Compliant Data Sharing</h3>
              <p className="text-sm text-muted-foreground">
                All data sharing follows Ayushman Bharat Digital Mission guidelines for secure interoperability
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Data Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            Share Health Records
          </CardTitle>
          <CardDescription>
            Select a hospital system and choose which data to share
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hospital Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Hospital System</label>
            <Select value={selectedHospital} onValueChange={setSelectedHospital}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a hospital system..." />
              </SelectTrigger>
              <SelectContent>
                {mockHospitalSystems.map((hospital) => (
                  <SelectItem key={hospital.id} value={hospital.id}>
                    <div className="flex items-center gap-2">
                      <Hospital className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{hospital.name}</p>
                        <p className="text-xs text-muted-foreground">{hospital.description}</p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Data Types to Share</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableDataTypes.map((dataType) => (
                <div key={dataType} className="flex items-center space-x-2">
                  <Checkbox
                    id={dataType}
                    checked={selectedDataTypes.includes(dataType)}
                    onCheckedChange={() => handleDataTypeToggle(dataType)}
                  />
                  <label htmlFor={dataType} className="text-sm font-medium capitalize">
                    {dataType.replace('_', ' ')}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Record Selection */}
          {filteredRecords.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Or Select Specific Records ({filteredRecords.length} available)
              </label>
              <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
                {filteredRecords.map((record) => (
                  <div key={record.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                    <Checkbox
                      id={record.id}
                      checked={selectedRecords.includes(record.id)}
                      onCheckedChange={() => handleRecordToggle(record.id)}
                    />
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{record.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(record.recordDate, 'MMM dd, yyyy')} • {record.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={handleShareData}
            disabled={isSharing || !selectedHospital || (selectedDataTypes.length === 0 && selectedRecords.length === 0)}
            className="w-full"
            variant="medical"
          >
            {isSharing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sharing Data...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                Share Data Securely
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Share History */}
      {shareHistory.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Share History</h2>
          {shareHistory.map((share) => (
            <Card key={share.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Hospital className="h-5 w-5" />
                      {share.hospital}
                    </CardTitle>
                    <CardDescription>
                      {share.recordCount} records shared on {format(share.sharedAt, 'PPP')}
                    </CardDescription>
                  </div>
                  <Badge className="bg-accent text-white">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Completed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Shared Data Types:</h4>
                  <div className="flex flex-wrap gap-2">
                    {share.dataTypes.map((type: RecordType) => (
                      <Badge key={type} variant="outline">
                        {type.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFHIRBundle(share.fhirBundle)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download FHIR Bundle
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Mock Hospital Systems Info */}
      <Card>
        <CardHeader>
          <CardTitle>Available Hospital Systems</CardTitle>
          <CardDescription>
            Mock hospital systems for demonstration of interoperability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockHospitalSystems.map((hospital) => (
              <div key={hospital.id} className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Hospital className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{hospital.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{hospital.description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  API: {hospital.apiEndpoint}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShareData;