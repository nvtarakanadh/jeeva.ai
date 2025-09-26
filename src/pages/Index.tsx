import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { Heart, Shield, Brain, Users, ArrowRight, CheckCircle, Globe, Activity, FileText } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  // Redirect authenticated users to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-health-blue/10" />
        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center">
                <Heart className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground">Jeeva AI</h1>
            </div>
            
            <h2 className="text-2xl lg:text-4xl font-bold text-foreground">
              Your Health, <span className="bg-gradient-to-r from-primary to-health-blue bg-clip-text text-transparent">AI-Powered</span>
            </h2>
            
            <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
              Secure healthcare management with AI-driven insights, consent-based data sharing, and seamless interoperability between healthcare providers.
            </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Button size="lg" className="text-lg px-8" asChild>
                  <Link to="/auth">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Learn More
                </Button>
              </div>

            {/* Key Features Badges */}
            <div className="flex flex-wrap justify-center gap-4 pt-8">
              <div className="flex items-center space-x-2 bg-card border rounded-full px-4 py-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">ABDM Compliant</span>
              </div>
              <div className="flex items-center space-x-2 bg-card border rounded-full px-4 py-2">
                <Brain className="h-4 w-4 text-health-purple" />
                <span className="text-sm font-medium">AI Analytics</span>
              </div>
              <div className="flex items-center space-x-2 bg-card border rounded-full px-4 py-2">
                <Globe className="h-4 w-4 text-health-blue" />
                <span className="text-sm font-medium">Interoperable</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-4 mb-12">
          <h3 className="text-3xl font-bold text-foreground">Comprehensive Healthcare Platform</h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built for patients, doctors, and healthcare systems with cutting-edge AI and security
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Patient Module */}
          <Card className="group hover:shadow-health transition-all duration-300">
            <CardHeader>
              <div className="h-12 w-12 bg-health-green/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-health-green/20 transition-colors">
                <Users className="h-6 w-6 text-health-green" />
              </div>
              <CardTitle>Patient-Centric Care</CardTitle>
              <CardDescription>
                Manage your health records, upload documents, and get AI-powered insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-health-green" />
                  <span className="text-sm">Upload & organize health records</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-health-green" />
                  <span className="text-sm">AI health insights & predictions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-health-green" />
                  <span className="text-sm">Control data sharing permissions</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Doctor Module */}
          <Card className="group hover:shadow-health transition-all duration-300">
            <CardHeader>
              <div className="h-12 w-12 bg-health-blue/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-health-blue/20 transition-colors">
                <Activity className="h-6 w-6 text-health-blue" />
              </div>
              <CardTitle>Doctor Portal</CardTitle>
              <CardDescription>
                Access patient records with consent, manage appointments, and prescribe treatments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-health-blue" />
                  <span className="text-sm">Consent-based patient access</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-health-blue" />
                  <span className="text-sm">AI-assisted diagnosis support</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-health-blue" />
                  <span className="text-sm">Digital prescription management</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* AI Analytics */}
          <Card className="group hover:shadow-health transition-all duration-300">
            <CardHeader>
              <div className="h-12 w-12 bg-health-purple/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-health-purple/20 transition-colors">
                <Brain className="h-6 w-6 text-health-purple" />
              </div>
              <CardTitle>AI Analytics</CardTitle>
              <CardDescription>
                Advanced machine learning for health insights and risk predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-health-purple" />
                  <span className="text-sm">Health risk assessment</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-health-purple" />
                  <span className="text-sm">Biomarker analysis</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-health-purple" />
                  <span className="text-sm">Personalized recommendations</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Interoperability */}
          <Card className="group hover:shadow-health transition-all duration-300">
            <CardHeader>
              <div className="h-12 w-12 bg-health-orange/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-health-orange/20 transition-colors">
                <Globe className="h-6 w-6 text-health-orange" />
              </div>
              <CardTitle>Interoperability</CardTitle>
              <CardDescription>
                Seamless data exchange between healthcare systems and providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-health-orange" />
                  <span className="text-sm">FHIR-compliant data format</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-health-orange" />
                  <span className="text-sm">Hospital system integration</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-health-orange" />
                  <span className="text-sm">Secure data transfer</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Consent Management */}
          <Card className="group hover:shadow-health transition-all duration-300">
            <CardHeader>
              <div className="h-12 w-12 bg-health-red/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-health-red/20 transition-colors">
                <Shield className="h-6 w-6 text-health-red" />
              </div>
              <CardTitle>Consent Management</CardTitle>
              <CardDescription>
                Granular control over who can access your health data and when
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-health-red" />
                  <span className="text-sm">Granular permission controls</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-health-red" />
                  <span className="text-sm">Time-based access limits</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-health-red" />
                  <span className="text-sm">Audit trail & transparency</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Vendor Integrations */}
          <Card className="group hover:shadow-health transition-all duration-300">
            <CardHeader>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Vendor Ecosystem</CardTitle>
              <CardDescription>
                Connect with labs, insurance, medical tourism, and research partners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">Lab & diagnostic integration</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">Insurance & finance partners</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">Medical tourism & research</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-muted/50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Ready to transform your healthcare experience?
          </h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of patients and doctors using Jeeva AI for smarter, more connected healthcare.
          </p>
          <Button size="lg" className="text-lg px-8" asChild>
            <Link to="/auth">
              Start Your Health Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
