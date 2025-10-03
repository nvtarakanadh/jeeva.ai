import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PageSkeleton } from '@/components/ui/skeleton-loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('patient' | 'doctor')[];
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles, 
  fallbackPath = '/auth' 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  // Remove logging to prevent unnecessary re-renders
  // const prevState = React.useRef({ isAuthenticated, isLoading, userRole: user?.role });
  // React.useEffect(() => {
  //   const currentState = { isAuthenticated, isLoading, userRole: user?.role };
  //   if (JSON.stringify(prevState.current) !== JSON.stringify(currentState)) {
  //     console.log('🔧 ProtectedRoute: State changed', currentState);
  //     prevState.current = currentState;
  //   }
  // }, [isAuthenticated, isLoading, user?.role]);

  // Handle redirects in useEffect with debouncing
  useEffect(() => {
    if (isLoading) return; // Don't navigate while loading

    // Debounce navigation to prevent rapid redirects
    const navigationTimeout = setTimeout(() => {
      if (!isAuthenticated || !user) {
        navigate(fallbackPath);
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        
        // Redirect to appropriate dashboard based on role
        const correctPath = user.role === 'doctor' ? '/doctor/dashboard' : '/dashboard';
        navigate(correctPath);
        return;
      }
    }, 100); // Small delay to prevent rapid navigation

    return () => clearTimeout(navigationTimeout);
  }, [isAuthenticated, isLoading, user, allowedRoles, navigate, fallbackPath]);

  // Show loading while checking authentication
  if (isLoading) {
    return <PageSkeleton />;
  }

  // Don't render if not authenticated or wrong role
  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return <PageSkeleton />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
