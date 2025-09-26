import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const PatientRecords = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Patient Records</span>
          </CardTitle>
          <CardDescription>
            Access patient health records with proper consent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Authorized patient records will appear here</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientRecords;