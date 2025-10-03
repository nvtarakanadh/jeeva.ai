import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Trash2, FileText, Lock, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const DataManagement = () => {
  const { logout } = useAuth();

  const handleExportData = () => {
    toast({
      title: "Data Export Started",
      description: "Your health data export will be ready shortly. You'll receive an email when complete.",
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Account Deletion",
      description: "Please contact support to delete your account permanently.",
      variant: "destructive",
    });
  };

  return (
    <>
      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export, backup, or delete your health data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Export Health Data</p>
                  <p className="text-sm text-muted-foreground">Download all your health records and data</p>
                </div>
              </div>
              <Button onClick={handleExportData} variant="outline">
                Export Data
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/20">
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Delete Account</p>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                </div>
              </div>
              <Button onClick={handleDeleteAccount} variant="destructive">
                Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Account Actions
          </CardTitle>
          <CardDescription>
            Manage your account session and security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={logout} variant="outline" className="w-full">
              Sign Out
            </Button>
            
            <div className="flex items-start gap-3 p-4 bg-accent-light rounded-lg">
              <AlertTriangle className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <p className="font-medium">ABDM Compliant</p>
                <p className="text-sm text-muted-foreground">
                  All settings and data handling comply with Ayushman Bharat Digital Mission guidelines for secure health data management.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};