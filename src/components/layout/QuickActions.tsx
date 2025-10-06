import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  UserCheck, 
  Calendar, 
  Pill, 
  BarChart3, 
  FileText,
  Stethoscope,
  Users,
  Shield,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface QuickAction {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  color: string;
  bgColor: string;
}

const QuickActions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const doctorActions: QuickAction[] = [
    {
      id: 'request-consent',
      title: 'Request Consent',
      icon: UserCheck,
      href: '/doctor/consents',
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100'
    },
    {
      id: 'schedule',
      title: 'Schedule',
      icon: Calendar,
      onClick: () => {
        // Prefer opening via global function exposed by the dashboard
        const opener = (window as any).openDoctorScheduleModal;
        if (typeof opener === 'function') {
          opener();
          return;
        }
        // Fallback: scroll to calendar area
        const el = document.querySelector('[data-calendar-section]');
        if (el) (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100'
    },
    {
      id: 'upload-prescription',
      title: 'Upload Prescription',
      icon: Pill,
      href: '/doctor/prescriptions',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100'
    },
    {
      id: 'patients',
      title: 'View Patients',
      icon: Users,
      href: '/doctor/patients',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 hover:bg-cyan-100'
    }
  ];

  const patientActions: QuickAction[] = [
    {
      id: 'upload-record',
      title: 'Upload Record',
      icon: Upload,
      href: '/patient/health-records',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      id: 'consent-management',
      title: 'Consent Management',
      icon: Shield,
      href: '/patient/consent-management',
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100'
    },
    {
      id: 'schedule',
      title: 'Schedule Appointment',
      icon: Calendar,
      onClick: () => {
        // This will open the scheduling modal
        const scheduleButton = document.querySelector('[data-patient-schedule-button]');
        if (scheduleButton) {
          (scheduleButton as HTMLElement).click();
        }
      },
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100'
    },
    {
      id: 'prescriptions',
      title: 'My Prescriptions',
      icon: Pill,
      href: '/patient/prescriptions',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100'
    },
    {
      id: 'ai-insights',
      title: 'AI Insights',
      icon: BarChart3,
      href: '/patient/ai-insights',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100'
    },
    {
      id: 'consultations',
      title: 'My Consultations',
      icon: Stethoscope,
      href: '/patient/consultations',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 hover:bg-cyan-100'
    }
  ];

  const actions = user?.role === 'doctor' ? doctorActions : patientActions;

  const handleActionClick = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      navigate(action.href);
    }
  };

  return (
    <div className="w-full bg-white border-b border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 justify-items-center">
          {actions.map((action) => (
            <Card 
              key={action.id}
              className="w-[150px] h-[120px] cursor-pointer transition-shadow duration-200 hover:shadow-lg"
              onClick={() => handleActionClick(action)}
            >
              <CardContent className="p-4 h-full flex flex-col items-center justify-center">
                <div className={`w-12 h-12 rounded-xl ${action.bgColor} flex items-center justify-center mb-3 transition-colors duration-200`}>
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                </div>
                <span className="text-sm font-medium text-gray-700 text-center leading-tight">
                  {action.title}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
