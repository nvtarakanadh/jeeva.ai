import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SignInForm } from '@/components/auth/SignInForm';
import { SignUpForm, SignUpData } from '@/components/auth/SignUpForm';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';
import { Heart, Shield, Users } from 'lucide-react';

const Auth = () => {
  const { user, signIn, signUp, resetPassword, loading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignIn = async ({ email, password }: { email: string; password: string }) => {
    setIsLoading(true);

    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please enter both email and password.',
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(email, password);

    if (error) {
      console.error('Sign in failed:', error);
      let errorMessage = error.message;
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before signing in.';
      } else if (error.message.includes('too many requests')) {
        errorMessage = 'Too many login attempts. Please try again after a few minutes.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: errorMessage,
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async (email: string) => {
    setIsLoading(true);

    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please enter your email address.',
      });
      setIsLoading(false);
      return;
    }

    const { error } = await resetPassword(email);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Reset Failed',
        description: error.message,
      });
    } else {
      toast({
        title: 'Reset Email Sent!',
        description: 'Please check your email for password reset instructions.',
      });
      setShowForgotPassword(false);
    }

    setIsLoading(false);
  };

  const handleSignUp = async (data: SignUpData) => {
    setIsLoading(true);

    const { email, password, firstName, lastName, role, phone } = data;

    const userData = {
      first_name: firstName,
      last_name: lastName,
      role,
      phone,
    };

    const { error } = await signUp(email, password, userData);

    if (error) {
      let errorMessage = error.message;
      
      // Handle specific signup errors
      if (error.message.includes('User already registered') || error.message.includes('already exists')) {
        errorMessage = 'An account with this email already exists. Please sign in instead or use forgot password.';
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = 'Password must be at least 6 characters long.';
      } else if (error.message.includes('invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: errorMessage,
      });
    } else {
      toast({
        title: 'Account Created!',
        description: 'Please check your email to confirm your account.',
      });
    }

    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <LoadingSpinner 
          size="lg" 
          text="Checking authentication..." 
          className="min-h-screen bg-gradient-to-br from-background to-muted"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Brand Section */}
        <div className="space-y-6 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start space-x-2">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Jeeva AI</h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-foreground">
              Your Health, <span className="bg-gradient-to-r from-primary to-health-blue bg-clip-text text-transparent">AI-Powered</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Secure, intelligent healthcare management with consent-driven data sharing and AI analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">ABDM Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-health-red" />
              <span className="text-sm text-muted-foreground">AI Analytics</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-health-blue" />
              <span className="text-sm text-muted-foreground">Doctor Portal</span>
            </div>
          </div>
        </div>

        {/* Auth Form Section */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Get Started</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <SignInForm 
                  onSubmit={handleSignIn} 
                  isLoading={isLoading} 
                  onForgotPassword={() => setShowForgotPassword(true)}
                />
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <SignUpForm 
                  onSubmit={async (data: SignUpData) => {
                    await handleSignUp(data);
                  }} 
                  isLoading={isLoading}
                />
              </TabsContent>
            </Tabs>
            
            <ForgotPasswordDialog 
              open={showForgotPassword}
              onClose={() => setShowForgotPassword(false)}
              onSubmit={async (email: string) => {
                await handleForgotPassword(email);
              }}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;