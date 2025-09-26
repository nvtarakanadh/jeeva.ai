import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';

const InteroperabilityHub = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Data Sharing & Interoperability</span>
          </CardTitle>
          <CardDescription>
            ABDM compliant data sharing between healthcare providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Hospital integrations will be displayed here</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InteroperabilityHub;