import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Patient, Doctor, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: (Patient | Doctor) & { id: string } | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  register: (userData: Partial<Patient | Doctor>, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<Patient | Doctor>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(Patient | Doctor) & { id: string } | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    
    // Remove timeout to prevent unnecessary state changes
    // Loading will be set to false when auth state is determined
    
    // Prevent multiple simultaneous initializations
    let isInitialized = false;
    
    // Get initial session
    const getInitialSession = async () => {
      if (isInitialized) return;
      isInitialized = true;
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session?.user) {
          setSession(session);
          
          // Fetch user profile from database to get accurate role
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          
          if (profileError) {
            console.error('Profile fetch error:', profileError);
          }
          
          if (profile) {
            const role = profile.role as UserRole;
            const userData = {
              id: session.user.id,
              name: profile.full_name || session.user.email?.split('@')[0] || 'User',
              email: profile.email || session.user.email || '',
              phone: profile.phone || '',
              role,
              dateOfBirth: profile.date_of_birth ? new Date(profile.date_of_birth) : undefined,
              gender: profile.gender,
              bloodGroup: profile.blood_group,
              allergies: profile.allergies ? (typeof profile.allergies === 'string' ? JSON.parse(profile.allergies) : profile.allergies) : [],
              emergencyContact: profile.emergency_contact_name ? {
                name: profile.emergency_contact_name,
                phone: profile.emergency_contact_phone || '',
                relationship: profile.emergency_contact_relationship || ''
              } : undefined,
              ...(role === 'doctor' ? {
                specialization: profile.specialization || 'General Medicine',
                licenseNumber: profile.license_number,
                hospitalAffiliation: profile.hospital_affiliation || 'General Hospital',
                verified: false
              } : {}),
              createdAt: new Date(profile.created_at),
              updatedAt: new Date(profile.updated_at),
            } as (Patient | Doctor) & { id: string };
              
            setUser(userData);
          } else {
            // Fallback to session metadata if profile not found
            const role = (session.user.user_metadata?.role as UserRole) || 'patient';
            const userData = {
              id: session.user.id,
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              phone: '',
              role,
              dateOfBirth: undefined,
              gender: undefined,
              bloodGroup: undefined,
              allergies: [],
              emergencyContact: undefined,
              ...(role === 'doctor' ? {
                specialization: 'General Medicine',
                licenseNumber: undefined,
                hospitalAffiliation: 'General Hospital',
                verified: false
              } : {}),
              createdAt: new Date(session.user.created_at),
              updatedAt: new Date(session.user.updated_at),
            } as (Patient | Doctor) & { id: string };
            
            setUser(userData);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('🔧 AuthContext: Error getting initial session', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        // Prevent processing if already initialized and it's just a token refresh
        if (isInitialized && event === 'TOKEN_REFRESHED') {
          return;
        }
        
        // Prevent multiple rapid state changes
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        setSession(session);
        if (session?.user) {
          // Fetch user profile from database to get accurate role
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          
          if (profileError) {
            console.error('Profile fetch error during auth change:', profileError);
          }
          
          if (profile) {
            const role = profile.role as UserRole;
            const userData = {
              id: session.user.id,
              name: profile.full_name || session.user.email?.split('@')[0] || 'User',
              email: profile.email || session.user.email || '',
              phone: profile.phone || '',
              role,
              dateOfBirth: profile.date_of_birth ? new Date(profile.date_of_birth) : undefined,
              gender: profile.gender,
              bloodGroup: profile.blood_group,
              allergies: profile.allergies ? JSON.parse(profile.allergies) : [],
              emergencyContact: profile.emergency_contact_name ? {
                name: profile.emergency_contact_name,
                phone: profile.emergency_contact_phone || '',
                relationship: profile.emergency_contact_relationship || ''
              } : undefined,
              ...(role === 'doctor' ? {
                specialization: profile.specialization || 'General Medicine',
                licenseNumber: profile.license_number,
                hospitalAffiliation: profile.hospital_affiliation || 'General Hospital',
                verified: false
              } : {}),
              createdAt: new Date(profile.created_at),
              updatedAt: new Date(profile.updated_at),
            } as (Patient | Doctor) & { id: string };
              
            setUser(userData);
          } else {
            // Fallback to session metadata if profile not found
            const role = (session.user.user_metadata?.role as UserRole) || 'patient';
            const userData = {
              id: session.user.id,
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              phone: '',
              role,
              dateOfBirth: undefined,
              gender: undefined,
              bloodGroup: undefined,
              allergies: [],
              emergencyContact: undefined,
              ...(role === 'doctor' ? {
                specialization: 'General Medicine',
                licenseNumber: undefined,
                hospitalAffiliation: 'General Hospital',
                verified: false
              } : {}),
              createdAt: new Date(session.user.created_at),
              updatedAt: new Date(session.user.updated_at),
            } as (Patient | Doctor) & { id: string };
            
            setUser(userData);
          }
        } else {
          setUser(null);
        }
        
        // Always set loading to false after processing auth state change
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, role?: UserRole) => {
    try {
      setIsLoading(true);
      console.log('🔐 Attempting login for:', email);
      
      // Use direct HTTP request instead of Supabase client with cache busting
      const response = await fetch(`https://wgcmusjsuziqjkzuaqkd.supabase.co/auth/v1/token?grant_type=password&_t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnY211c2pzdXppcWprenVhcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDA2MjMsImV4cCI6MjA3NDQ3NjYyM30.I-7myV1T0KujlqqcD0nepUU_qvh_7rnQ0GktbNXmmn4',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Login failed');
      }

      const authData = await response.json();
      console.log('✅ Direct auth successful:', authData);

      if (authData.user) {
        console.log('✅ User found, processing user data...');
        
        // Get profile data using direct HTTP request with cache busting
        const profileResponse = await fetch(`https://wgcmusjsuziqjkzuaqkd.supabase.co/rest/v1/profiles?user_id=eq.${authData.user.id}&_t=${Date.now()}`, {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnY211c2pzdXppcWprenVhcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDA2MjMsImV4cCI6MjA3NDQ3NjYyM30.I-7myV1T0KujlqqcD0nepUU_qvh_7rnQ0GktbNXmmn4',
            'Authorization': `Bearer ${authData.access_token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });

        let profileData = null;
        if (profileResponse.ok) {
          const profiles = await profileResponse.json();
          profileData = profiles[0] || null;
        }

        // Create basic user data from auth response
        const userRole = (authData.user.user_metadata?.role as UserRole) || role || 'patient';
        console.log('🔐 Determined user role:', userRole);
        
        const userData = {
          id: authData.user.id,
          name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'User',
          email: authData.user.email || '',
          phone: profileData?.phone || '',
          role: userRole,
          dateOfBirth: profileData?.date_of_birth ? new Date(profileData.date_of_birth) : undefined,
          gender: profileData?.gender || undefined,
          bloodGroup: profileData?.blood_group || undefined,
          allergies: profileData?.allergies || [],
          emergencyContact: profileData?.emergency_contact_name ? {
            name: profileData.emergency_contact_name,
            phone: profileData.emergency_contact_phone || '',
            relationship: profileData.emergency_contact_relationship || ''
          } : undefined,
          ...(userRole === 'doctor' ? {
            specialization: profileData?.specialization || 'General Medicine',
            licenseNumber: profileData?.license_number || undefined,
            hospitalAffiliation: profileData?.hospital_affiliation || 'General Hospital',
            verified: (profileData as any)?.verified || false
          } : {}),
          createdAt: new Date(authData.user.created_at),
          updatedAt: new Date(authData.user.updated_at),
        } as (Patient | Doctor) & { id: string };
        
        console.log('🔐 Created user data:', userData);
        setUser(userData);
        
        // Store session data
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: authData.access_token,
          refresh_token: authData.refresh_token,
          expires_at: authData.expires_at,
          user: authData.user
        }));
        
        // Navigate based on role
        console.log('🔐 Navigating to dashboard for role:', userRole);
        if (userRole === 'doctor') {
          console.log('🔐 Redirecting to doctor dashboard');
          navigate('/doctor/dashboard');
        } else {
          console.log('🔐 Redirecting to patient dashboard');
          navigate('/dashboard');
        }

        toast({
          title: "Login successful",
          description: `Welcome back!`,
        });
      } else {
        console.error('❌ No user data returned from auth');
        throw new Error('No user data returned');
      }

    } catch (error: any) {
      console.error('❌ Login failed:', error);
      toast({
        title: "Login failed",
        description: error.message || 'Invalid credentials. Please try again.',
        variant: "destructive",
      });
      throw error;
    } finally {
      console.log('🔐 Login process completed, setting loading to false');
      setIsLoading(false);
    }
  };

  const register = async (userData: any, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email!,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: userData.name,
            role: userData.role || 'patient',
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        
        // Create basic user data from session metadata
        const newUserData = {
          id: data.user.id,
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          email: data.user.email || '',
          phone: '',
          role: (data.user.user_metadata?.role as UserRole) || 'patient',
          dateOfBirth: undefined,
          gender: undefined,
          bloodGroup: undefined,
          allergies: [],
          emergencyContact: undefined,
          specialization: data.user.user_metadata?.role === 'doctor' ? 'General Medicine' : undefined,
          licenseNumber: undefined,
          hospitalAffiliation: data.user.user_metadata?.role === 'doctor' ? 'General Hospital' : undefined,
          createdAt: new Date(data.user.created_at),
          updatedAt: new Date(data.user.updated_at),
        } as any;
        
        setUser(newUserData);
      }


      toast({
        title: "Registration successful",
        description: "Please check your email to verify your account.",
      });

    } catch (error: any) {
      console.error('Registration failed:', error);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem('supabase.auth.token');
    navigate('/auth');
  };

  const updateProfile = async (updates: Partial<Patient | Doctor>) => {
    if (!user) return;
    
    try {
      
      // First, update the user's email in Supabase Auth if it changed
      if (updates.email && updates.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: updates.email
        });
        
        if (emailError) {
          console.error('Email update error:', emailError);
          throw new Error('Failed to update email: ' + emailError.message);
        }
      }

      // Get the user's profile ID
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profileData) {
        console.error('Profile lookup error:', profileError);
        throw new Error('Profile not found');
      }

      // Prepare the database update object
      const dbUpdates: any = {};
      
      if (updates.name) dbUpdates.full_name = updates.name;
      if (updates.email) dbUpdates.email = updates.email;
      if (updates.phone) dbUpdates.phone = updates.phone;
      
      // Only update Patient-specific fields if the user is a Patient
      if (user.role === 'patient') {
        const patientUpdates = updates as Partial<Patient>;
        
        if (patientUpdates.dateOfBirth) {
          dbUpdates.date_of_birth = patientUpdates.dateOfBirth.toISOString().split('T')[0];
        }
        if (patientUpdates.gender) {
          dbUpdates.gender = patientUpdates.gender;
        }
        if (patientUpdates.bloodType) {
          dbUpdates.blood_group = patientUpdates.bloodType;
        }
        if (patientUpdates.allergies) {
          dbUpdates.allergies = patientUpdates.allergies;
        }
        
        // Handle emergency contact
        if (patientUpdates.emergencyContact) {
          dbUpdates.emergency_contact_name = patientUpdates.emergencyContact.name;
          dbUpdates.emergency_contact_phone = patientUpdates.emergencyContact.phone;
          dbUpdates.emergency_contact_relationship = patientUpdates.emergencyContact.relationship;
        }
      }
      
      // Handle Doctor-specific fields if the user is a Doctor
      if (user.role === 'doctor') {
        const doctorUpdates = updates as Partial<Doctor>;
        
        if (doctorUpdates.specialization) {
          dbUpdates.specialization = doctorUpdates.specialization;
        }
        if (doctorUpdates.licenseNumber) {
          dbUpdates.license_number = doctorUpdates.licenseNumber;
        }
        if (doctorUpdates.hospitalAffiliation) {
          dbUpdates.hospital_affiliation = doctorUpdates.hospitalAffiliation;
        }
        if (typeof doctorUpdates.verified === 'boolean') {
          dbUpdates.verified = doctorUpdates.verified;
        }
      }

      // Update the profile in the database
      const { error: updateError } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', profileData.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw new Error('Failed to update profile: ' + updateError.message);
      }

      // Update local state only after successful database update
      const updatedUser = { ...user, ...updates } as (Patient | Doctor) & { id: string };
      setUser(updatedUser);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Profile update failed:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      throw error; // Re-throw so the calling component can handle it
    }
  };

  const value = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
  };

  // Remove logging to prevent unnecessary re-renders
  // const prevValues = React.useRef({ isLoading, isAuthenticated: !!user, userRole: user?.role });
  // React.useEffect(() => {
  //   const currentValues = { isLoading, isAuthenticated: !!user, userRole: user?.role };
  //   if (JSON.stringify(prevValues.current) !== JSON.stringify(currentValues)) {
  //     console.log('🔧 AuthContext: State changed', currentValues);
  //     prevValues.current = currentValues;
  //   }
  // }, [isLoading, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};