import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Suspense, lazy } from 'react';

const PatientDashboard = lazy(() => import('@/components/dashboard/PatientDashboard'));
const DoctorDashboard = lazy(() => import('@/components/dashboard/DoctorDashboard'));

const Dashboard = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen">
        <LoadingSpinner 
          size="lg" 
          text="Initializing your dashboard..." 
          className="min-h-screen"
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <LoadingSpinner 
          size="lg" 
          text="Loading your profile..." 
          className="min-h-screen"
        />
      </div>
    );
  }

  // Render appropriate dashboard based on user role
  return (
    <Suspense fallback={<LoadingSpinner size="lg" text="Loading dashboard..." className="min-h-screen" /> }>
      {profile.role === 'doctor' ? <DoctorDashboard /> : <PatientDashboard />}
    </Suspense>
  );
};

export default Dashboard;