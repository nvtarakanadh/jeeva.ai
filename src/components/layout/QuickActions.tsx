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
  gradient: string;
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
      bgColor: 'bg-green-50 hover:bg-green-100',
      gradient: 'from-green-50 to-green-100'
    },
    {
      id: 'schedule',
      title: 'Schedule',
      icon: Calendar,
      onClick: () => {
        // Open schedule modal directly if available
        const opener = (window as any).openDoctorScheduleModal;
        if (typeof opener === 'function') {
          opener();
          return;
        }
        // Fallback: scroll to calendar section
        const calendarSection = document.querySelector('[data-calendar-section]') ||
                               document.querySelector('.calendar-container') ||
                               document.querySelector('[class*="calendar"]');
        if (calendarSection) {
          calendarSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      },
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      gradient: 'from-purple-50 to-purple-100'
    },
    {
      id: 'upload-prescription',
      title: 'Upload Prescription',
      icon: Pill,
      href: '/doctor/prescriptions',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      gradient: 'from-orange-50 to-orange-100'
    },
    {
      id: 'patients',
      title: 'View Patients',
      icon: Users,
      href: '/doctor/patients',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 hover:bg-cyan-100',
      gradient: 'from-cyan-50 to-cyan-100'
    }
  ];

  const patientActions: QuickAction[] = [
    {
      id: 'upload-record',
      title: 'Upload Record',
      icon: Upload,
      href: '/patient/health-records',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      gradient: 'from-blue-50 to-blue-100'
    },
    {
      id: 'consent-management',
      title: 'Consent Management',
      icon: Shield,
      href: '/patient/consent-management',
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      gradient: 'from-green-50 to-green-100'
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
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      gradient: 'from-purple-50 to-purple-100'
    },
    {
      id: 'prescriptions',
      title: 'My Prescriptions',
      icon: Pill,
      href: '/patient/prescriptions',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      gradient: 'from-orange-50 to-orange-100'
    },
    {
      id: 'consultations',
      title: 'My Consultations',
      icon: Stethoscope,
      href: '/patient/consultations',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 hover:bg-cyan-100',
      gradient: 'from-cyan-50 to-cyan-100'
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
    <div className="w-full bg-white border-b border-gray-200 py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-sm font-semibold tracking-wide text-gray-500 mb-2 text-left">Quick Actions</h2>
        <div className="flex md:flex-wrap flex-nowrap gap-4 overflow-x-auto scroll-smooth scrollbar-hide mb-4">
          {actions.map((action) => (
            <button
              key={action.id}
              className="w-[76px] h-[76px] max-w-[80px] max-h-[80px] flex-shrink-0 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-300 transform hover:scale-105 transition-transform duration-200 flex flex-col items-center justify-center"
              onClick={() => handleActionClick(action)}
              type="button"
            >
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-1`}>
                <action.icon className={`h-5 w-5 ${action.color}`} />
              </div>
              <span className="text-[11px] font-medium text-gray-700 text-center leading-snug break-words px-1">
                {action.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
