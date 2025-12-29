import React, { Suspense } from 'react';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="space-y-4 w-full max-w-md mx-auto p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  </div>
);

// Lazy loading wrapper with performance tracking
export function LazyWrapper({ children, fallback = <LoadingSkeleton /> }: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function LazyComponent(props: P) {
    return (
      <LazyWrapper fallback={fallback}>
        <Component {...props} />
      </LazyWrapper>
    );
  };
}

// Performance tracking for lazy loaded components
export function trackComponentLoad(componentName: string) {
  const loadTime = performance.now();
  
  return () => {
    const loadDuration = performance.now() - loadTime;
    
    // Store performance metric
    const metric = {
      type: 'component_load',
      componentName,
      loadTime: loadDuration,
      timestamp: Date.now()
    };
    
    const existingMetrics = JSON.parse(localStorage.getItem('componentMetrics') || '[]');
    existingMetrics.push(metric);
    
    // Keep only last 100 metrics
    if (existingMetrics.length > 100) {
      existingMetrics.splice(0, existingMetrics.length - 100);
    }
    
    localStorage.setItem('componentMetrics', JSON.stringify(existingMetrics));
    
    // Log slow component loads
    if (loadDuration > 100) {
      console.warn(`🐌 Slow component load: ${componentName} - ${loadDuration.toFixed(2)}ms`);
    }
  };
}