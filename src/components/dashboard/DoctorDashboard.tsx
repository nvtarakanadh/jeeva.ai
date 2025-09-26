import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  FileText, 
  Shield, 
  Calendar, 
  Activity, 
  Clock,
  UserPlus,
  Search,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Brain
} from 'lucide-react';
import DoctorPatients from '@/components/doctor/DoctorPatients';
import ConsentRequests from '@/components/doctor/ConsentRequests';
import PatientRecords from '@/components/doctor/PatientRecords';

const DoctorDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for doctor dashboard
  const dashboardStats = {
    totalPatients: 48,
    pendingConsents: 3,
    scheduledAppointments: 8,
    recentAnalytics: 12
  };

  const recentPatients = [
    {
      id: 1,
      name: 'Sarah Johnson',
      lastVisit: '2024-01-20',
      condition: 'Hypertension',
      status: 'stable',
      riskLevel: 'low'
    },
    {
      id: 2,
      name: 'Michael Chen',
      lastVisit: '2024-01-19',
      condition: 'Diabetes Type 2',
      status: 'monitoring',
      riskLevel: 'medium'
    },
    {
      id: 3,
      name: 'Emily Davis',
      lastVisit: '2024-01-18',
      condition: 'Post-surgery',
      status: 'recovering',
      riskLevel: 'low'
    }
  ];

  const upcomingAppointments = [
    {
      id: 1,
      patientName: 'John Smith',
      time: '09:00 AM',
      type: 'Follow-up',
      duration: '30 min'
    },
    {
      id: 2,
      patientName: 'Lisa Wilson',
      time: '10:30 AM',
      type: 'Consultation',
      duration: '45 min'
    },
    {
      id: 3,
      patientName: 'David Brown',
      time: '02:00 PM',
      type: 'Check-up',
      duration: '30 min'
    }
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-success text-success-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return 'bg-success text-success-foreground';
      case 'monitoring': return 'bg-warning text-warning-foreground';
      case 'critical': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome, Dr. {profile?.last_name}
          </h1>
          <p className="text-muted-foreground">
            {profile?.specialization && `${profile.specialization} • `}
            {profile?.hospital_affiliation || 'Independent Practice'}
          </p>
        </div>

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="patients" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Patients</span>
            </TabsTrigger>
            <TabsTrigger value="consent" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Consent Requests</span>
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Patient Records</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.totalPatients}</div>
                  <p className="text-xs text-muted-foreground">
                    Active under care
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Consents</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.pendingConsents}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting patient approval
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.scheduledAppointments}</div>
                  <p className="text-xs text-muted-foreground">
                    Scheduled for today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.recentAnalytics}</div>
                  <p className="text-xs text-muted-foreground">
                    New patient insights
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks for patient management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    className="h-auto flex-col space-y-2 p-6" 
                    variant="outline"
                    onClick={() => setActiveTab('patients')}
                  >
                    <UserPlus className="h-6 w-6" />
                    <span>Add Patient</span>
                  </Button>
                  
                  <Button 
                    className="h-auto flex-col space-y-2 p-6" 
                    variant="outline"
                    onClick={() => setActiveTab('consent')}
                  >
                    <Shield className="h-6 w-6" />
                    <span>Request Consent</span>
                  </Button>
                  
                  <Button 
                    className="h-auto flex-col space-y-2 p-6" 
                    variant="outline"
                    onClick={() => setActiveTab('records')}
                  >
                    <Search className="h-6 w-6" />
                    <span>Search Records</span>
                  </Button>
                  
                  <Button 
                    className="h-auto flex-col space-y-2 p-6" 
                    variant="outline"
                  >
                    <Calendar className="h-6 w-6" />
                    <span>Schedule</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Patients */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Patients</CardTitle>
                    <CardDescription>
                      Recently consulted patients
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setActiveTab('patients')}>
                    View All
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentPatients.map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{patient.name}</h4>
                        <p className="text-sm text-muted-foreground">{patient.condition}</p>
                        <p className="text-xs text-muted-foreground">Last visit: {patient.lastVisit}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(patient.status)}>
                          {patient.status}
                        </Badge>
                        <Badge className={getRiskColor(patient.riskLevel)} variant="outline">
                          {patient.riskLevel} risk
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Today's Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Schedule</CardTitle>
                  <CardDescription>
                    Upcoming appointments for today
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{appointment.patientName}</h4>
                          <p className="text-sm text-muted-foreground">{appointment.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{appointment.time}</p>
                        <p className="text-xs text-muted-foreground">{appointment.duration}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Other Tabs */}
          <TabsContent value="patients">
            <DoctorPatients />
          </TabsContent>

          <TabsContent value="consent">
            <ConsentRequests />
          </TabsContent>

          <TabsContent value="records">
            <PatientRecords />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DoctorDashboard;
