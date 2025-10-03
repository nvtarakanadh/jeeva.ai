import React, { useState, useEffect } from 'react';
import { Skeleton } from './skeleton-loading';

interface ProgressiveLoadingProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
  minLoadingTime?: number;
}

export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  children,
  fallback = <Skeleton className="h-32 w-full" />,
  delay = 0,
  minLoadingTime = 200
}) => {
  const [showContent, setShowContent] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const timer = setTimeout(() => {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsed);
      
      setTimeout(() => {
        setShowContent(true);
      }, remainingTime);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, minLoadingTime, startTime]);

  if (!showContent) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Hook for progressive data loading
export const useProgressiveData = <T,>(
  data: T | null,
  loading: boolean,
  options: {
    delay?: number;
    minLoadingTime?: number;
  } = {}
) => {
  const [showData, setShowData] = useState(false);
  const [startTime] = useState(Date.now());
  const { delay = 0, minLoadingTime = 300 } = options;

  useEffect(() => {
    if (!loading && data) {
      const timer = setTimeout(() => {
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsed);
        
        setTimeout(() => {
          setShowData(true);
        }, remainingTime);
      }, delay);

      return () => clearTimeout(timer);
    } else if (loading) {
      setShowData(false);
    }
  }, [data, loading, delay, minLoadingTime, startTime]);

  return {
    showData: showData && !loading && data !== null,
    isLoading: loading || !showData
  };
};

// Progressive stats component
export const ProgressiveStats: React.FC<{
  stats: Array<{
    label: string;
    value: string;
    icon: React.ComponentType<any>;
    href: string;
  }>;
  loading: boolean;
}> = ({ stats, loading }) => {
  const { showData, isLoading } = useProgressiveData(stats, loading, {
    delay: 100,
    minLoadingTime: 200
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-12 w-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <ProgressiveLoading
          key={stat.label}
          delay={index * 50}
          minLoadingTime={100}
          fallback={
            <div className="p-6 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
            </div>
          }
        >
          <div className="p-6 border rounded-lg hover:shadow-medium transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className="p-3 bg-primary-light rounded-lg">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        </ProgressiveLoading>
      ))}
    </div>
  );
};

// Progressive list component
export const ProgressiveList: React.FC<{
  items: any[];
  loading: boolean;
  renderItem: (item: any, index: number) => React.ReactNode;
  fallbackCount?: number;
}> = ({ items, loading, renderItem, fallbackCount = 3 }) => {
  const { showData, isLoading } = useProgressiveData(items, loading, {
    delay: 200,
    minLoadingTime: 300
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: fallbackCount }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <ProgressiveLoading
          key={item.id || index}
          delay={index * 100}
          minLoadingTime={150}
          fallback={
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          }
        >
          {renderItem(item, index)}
        </ProgressiveLoading>
      ))}
    </div>
  );
};
