import React, { Suspense, lazy, ComponentType } from 'react';
import { PageSkeleton, CardSkeleton, ListSkeleton } from './skeleton-loading';

interface LazyComponentProps {
  fallback?: React.ReactNode;
}

// Higher-order component for lazy loading
export const withLazyLoading = <P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));
  
  return (props: P) => (
    <Suspense fallback={fallback || <PageSkeleton />}>
      <LazyComponent {...(props as any)} />
    </Suspense>
  );
};

// Lazy load page components
export const LazyDoctorDashboard = withLazyLoading(
  lazy(() => import('@/pages/doctor/Dashboard')),
  <PageSkeleton />
);

export const LazyPatientDashboard = withLazyLoading(
  lazy(() => import('@/pages/patient/Dashboard')),
  <PageSkeleton />
);

export const LazyPrescriptions = withLazyLoading(
  lazy(() => import('@/pages/doctor/Prescriptions')),
  <PageSkeleton />
);

export const LazyConsultationNotes = withLazyLoading(
  lazy(() => import('@/pages/doctor/ConsultationNotes')),
  <PageSkeleton />
);


export const LazyConsultations = withLazyLoading(
  lazy(() => import('@/pages/doctor/Consultations')),
  <PageSkeleton />
);

export const LazyPatients = withLazyLoading(
  lazy(() => import('@/pages/doctor/Patients')),
  <PageSkeleton />
);

export const LazyConsents = withLazyLoading(
  lazy(() => import('@/pages/doctor/Consents')),
  <PageSkeleton />
);

// Patient pages
export const LazyPatientConsultationNotes = withLazyLoading(
  lazy(() => import('@/pages/patient/ConsultationNotes')),
  <PageSkeleton />
);

export const LazyPatientPrescriptions = withLazyLoading(
  lazy(() => import('@/pages/patient/Prescriptions')),
  <PageSkeleton />
);

export const LazyPatientConsultations = withLazyLoading(
  lazy(() => import('@/pages/patient/Consultations')),
  <PageSkeleton />
);

export const LazyPatientAccess = withLazyLoading(
  lazy(() => import('@/pages/patient/PatientAccess')),
  <PageSkeleton />
);

export const LazyConsentManagement = withLazyLoading(
  lazy(() => import('@/pages/patient/ConsentManagement')),
  <PageSkeleton />
);

export const LazyAIInsights = withLazyLoading(
  lazy(() => import('@/pages/patient/AIInsights')),
  <PageSkeleton />
);

// Lazy load heavy components
export const LazyCreatePrescription = withLazyLoading(
  lazy(() => import('@/components/prescription/CreatePrescription')),
  <CardSkeleton />
);

export const LazyCreateConsultationNote = withLazyLoading(
  lazy(() => import('@/components/consultation/CreateConsultationNote')),
  <CardSkeleton />
);

export const LazyConsultationBooking = withLazyLoading(
  lazy(() => import('@/components/consultation/ConsultationBooking')),
  <CardSkeleton />
);

// Utility for conditional lazy loading
export const ConditionalLazy = ({ 
  condition, 
  children, 
  fallback 
}: { 
  condition: boolean; 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) => {
  if (condition) {
    return <Suspense fallback={fallback || <div>Loading...</div>}>{children}</Suspense>;
  }
  return <>{children}</>;
};
