import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { 
  FileText, 
  Upload, 
  Activity, 
  Users, 
  Calendar, 
  Shield, 
  TrendingUp,
  Heart,
  Brain,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Share2,
  Download
} from 'lucide-react';
import HealthRecords from '@/components/health/HealthRecords';
import AIAnalytics from '@/components/health/AIAnalytics';
import ConsentManagement from '@/components/consent/ConsentManagement';
import InteroperabilityHub from '@/components/interop/InteroperabilityHub';
import VendorIntegrations from '@/components/vendors/VendorIntegrations';

const PatientDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for dashboard stats
  const dashboardStats = {
    totalRecords: 12,
    aiInsights: 5,
    consentRequests: 2,
    lastUpload: '2 days ago'
  };

  const recentInsights = [
    {
      id: 1,
      type: 'Risk Alert',
      title: 'Blood Pressure Trend',
      description: 'Slight increase noticed in recent readings',
      risk_level: 'warning',
      date: '2024-01-20'
    },
    {
      id: 2,
      type: 'Recommendation',
      title: 'Vitamin D Deficiency',
      description: 'Consider supplements based on recent lab results',
      risk_level: 'info',
      date: '2024-01-18'
    },
    {
      id: 3,
      type: 'Good News',
      title: 'Cholesterol Levels',
      description: 'Improved cholesterol levels detected',
      risk_level: 'success',
      date: '2024-01-15'
    }
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'warning': return 'bg-warning text-warning-foreground';
      case 'success': return 'bg-success text-success-foreground';
      case 'info': return 'bg-info text-info-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'warning': return <Clock className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {profile?.first_name}!
          </h1>
          <p className="text-muted-foreground">
            Manage your health records, view AI insights, and control data sharing.
          </p>
        </div>

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Records</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="consent" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Consent</span>
            </TabsTrigger>
            <TabsTrigger value="interop" className="flex items-center space-x-2">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Data Sharing</span>
            </TabsTrigger>
            <TabsTrigger value="vendors" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Services</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Health Records</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.totalRecords}</div>
                  <p className="text-xs text-muted-foreground">
                    Last upload {dashboardStats.lastUpload}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.aiInsights}</div>
                  <p className="text-xs text-muted-foreground">
                    New recommendations available
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Consent Requests</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.consentRequests}</div>
                  <p className="text-xs text-muted-foreground">
                    Pending your approval
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Health Score</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">85<span className="text-sm text-muted-foreground">/100</span></div>
                  <p className="text-xs text-success">
                    +5% from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks to manage your health data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    className="h-auto flex-col space-y-2 p-6" 
                    variant="outline"
                    onClick={() => setActiveTab('records')}
                  >
                    <Upload className="h-6 w-6" />
                    <span>Upload Records</span>
                  </Button>
                  
                  <Button 
                    className="h-auto flex-col space-y-2 p-6" 
                    variant="outline"
                    onClick={() => setActiveTab('analytics')}
                  >
                    <Brain className="h-6 w-6" />
                    <span>View Insights</span>
                  </Button>
                  
                  <Button 
                    className="h-auto flex-col space-y-2 p-6" 
                    variant="outline"
                    onClick={() => setActiveTab('consent')}
                  >
                    <Shield className="h-6 w-6" />
                    <span>Manage Consent</span>
                  </Button>
                  
                  <Button 
                    className="h-auto flex-col space-y-2 p-6" 
                    variant="outline"
                    onClick={() => setActiveTab('interop')}
                  >
                    <Share2 className="h-6 w-6" />
                    <span>Share Data</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent AI Insights */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent AI Insights</CardTitle>
                  <CardDescription>
                    Latest health recommendations and alerts
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setActiveTab('analytics')}>
                  View All
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentInsights.map((insight) => (
                  <div key={insight.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className={`p-2 rounded-full ${getRiskColor(insight.risk_level)}`}>
                      {getRiskIcon(insight.risk_level)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{insight.title}</h4>
                        <Badge variant="secondary">{insight.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {insight.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {insight.date}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other Tabs */}
          <TabsContent value="records">
            <HealthRecords />
          </TabsContent>

          <TabsContent value="analytics">
            <AIAnalytics />
          </TabsContent>

          <TabsContent value="consent">
            <ConsentManagement />
          </TabsContent>

          <TabsContent value="interop">
            <InteroperabilityHub />
          </TabsContent>

          <TabsContent value="vendors">
            <VendorIntegrations />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PatientDashboard;
