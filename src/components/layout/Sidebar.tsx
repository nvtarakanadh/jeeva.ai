import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Home, 
  FileText, 
  Brain, 
  Shield, 
  Users,
  PlusCircle,
  Hospital,
  Calendar,
  CreditCard,
  FlaskConical,
  Pill,
  Stethoscope,
  Menu
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: ('patient' | 'doctor')[];
  badge?: string;
}

const patientNavItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/dashboard', roles: ['patient'] },
  { label: 'Health Records', icon: FileText, href: '/records', roles: ['patient'] },
  { label: 'AI Insights', icon: Brain, href: '/ai-insights', roles: ['patient'] },
  { label: 'Consultations', icon: Stethoscope, href: '/consultations', roles: ['patient'] },
  { label: 'Prescriptions', icon: Pill, href: '/prescriptions', roles: ['patient'] },
  { label: 'Consultation Notes', icon: Stethoscope, href: '/consultation-notes', roles: ['patient'] },
  { label: 'Consent Management', icon: Shield, href: '/consents', roles: ['patient'] },
  { label: 'Share Data', icon: Hospital, href: '/share-data', roles: ['patient'] },
];

const doctorNavItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/doctor/dashboard', roles: ['doctor'] },
  { label: 'My Patients', icon: Users, href: '/doctor/patients', roles: ['doctor'] },
  { label: 'Consultations', icon: Stethoscope, href: '/doctor/consultations', roles: ['doctor'] },
  { label: 'Prescriptions', icon: Pill, href: '/doctor/prescriptions', roles: ['doctor'] },
  { label: 'Consultation Notes', icon: Stethoscope, href: '/doctor/consultation-notes', roles: ['doctor'] },
  { label: 'Consent Requests', icon: Shield, href: '/doctor/consents', roles: ['doctor'] },
];

const comingSoonItems: NavItem[] = [
  { label: 'Medical Tourism', icon: Calendar, href: '#', roles: ['patient', 'doctor'], badge: 'Soon' },
  { label: 'Clinical Research', icon: FlaskConical, href: '#', roles: ['patient', 'doctor'], badge: 'Soon' },
  { label: 'Finance Partners', icon: CreditCard, href: '#', roles: ['patient', 'doctor'], badge: 'Soon' },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = user?.role === 'doctor' ? doctorNavItems : patientNavItems;

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleNavigation = (href: string) => {
    if (href !== '#') {
      navigate(href);
    }
  };

  return (
    <TooltipProvider>
      <aside className={cn(
        "bg-card border-r border-border h-[calc(100vh-4rem)] overflow-y-auto transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )} role="navigation" aria-label="Sidebar Navigation">
        <div className="p-4 space-y-6">
        {/* Hamburger Menu Button */}
        <div className="flex justify-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-8 w-8 p-0 hover:bg-accent transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* Main Navigation */}
        <div>
          {!isCollapsed && (
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Main Menu
            </h2>
          )}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              const button = (
                <div className="relative">
                  <Button
                    key={item.href}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full h-10",
                      isCollapsed 
                        ? "justify-center p-0" 
                        : "justify-start gap-3",
                      isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                    onClick={() => handleNavigation(item.href)}
                  >
                    <Icon className="h-4 w-4" />
                    {!isCollapsed && (
                      <>
                        {item.label}
                        {item.badge && (
                          <span className="ml-auto text-xs bg-warning text-warning-foreground px-2 py-1 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Button>
                  {/* Active indicator for collapsed state */}
                  {isCollapsed && isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                  )}
                </div>
              );

              return isCollapsed ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    {button}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="ml-2">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              ) : button;
            })}
          </nav>
        </div>

        {/* Coming Soon Section */}
        {!isCollapsed && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Coming Soon
            </h2>
            <nav className="space-y-1">
              {comingSoonItems.map((item) => {
                const Icon = item.icon;
                
                return (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-10 opacity-60 cursor-not-allowed"
                    disabled
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto text-xs bg-warning text-warning-foreground px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Button>
                );
              })}
            </nav>
          </div>
        )}

        {/* ABDM Compliance */}
        {!isCollapsed && (
          <div className="bg-accent-light p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-accent mb-2">ABDM Compliant</h3>
            <p className="text-xs text-muted-foreground">
              This platform follows Ayushman Bharat Digital Mission guidelines for secure health data management.
            </p>
          </div>
        )}
        </div>
      </aside>
    </TooltipProvider>
  );
};