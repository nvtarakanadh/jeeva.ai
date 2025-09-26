import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

const VendorIntegrations = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Vendor Services</span>
          </CardTitle>
          <CardDescription>
            Medical tourism, labs, insurance, and clinical research partners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming soon - Vendor integrations</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorIntegrations;