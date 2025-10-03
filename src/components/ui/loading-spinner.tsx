import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  textClassName?: string;
  centered?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6', 
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className,
  textClassName,
  centered = false
}) => {
  const spinnerElement = (
    <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />
  );

  if (text) {
    const content = (
      <div className={cn('flex flex-col items-center space-y-2', centered && 'justify-center min-h-[200px]')}>
        {spinnerElement}
        <p className={cn('text-muted-foreground text-sm', textClassName)}>{text}</p>
      </div>
    );

    return content;
  }

  return spinnerElement;
};

// Convenience components for common use cases
export const PageLoadingSpinner: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" text={text} />
  </div>
);

export const CardLoadingSpinner: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="flex items-center justify-center py-8">
    <LoadingSpinner size="md" text={text} />
  </div>
);

export const ButtonLoadingSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingSpinner size="sm" className={cn('mr-2', className)} />
);

export const InlineLoadingSpinner: React.FC<{ text?: string; className?: string }> = ({ 
  text, 
  className 
}) => (
  <div className={cn('flex items-center gap-2', className)}>
    <LoadingSpinner size="sm" />
    {text && <span className="text-sm text-muted-foreground">{text}</span>}
  </div>
);
