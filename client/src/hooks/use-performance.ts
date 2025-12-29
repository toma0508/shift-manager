import { useState, useEffect, useCallback } from 'react';

interface FrontendMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  largestContentfulPaint: number;
}

interface APICallMetric {
  url: string;
  method: string;
  duration: number;
  timestamp: number;
  success: boolean;
}

export function usePerformanceTracking() {
  const [metrics, setMetrics] = useState<FrontendMetrics | null>(null);
  const [apiCalls, setApiCalls] = useState<APICallMetric[]>([]);

  // Track Web Vitals
  useEffect(() => {
    const measurePerformance = () => {
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        const metrics: FrontendMetrics = {
          pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
          firstContentfulPaint: 0,
          firstInputDelay: 0,
          cumulativeLayoutShift: 0,
          largestContentfulPaint: 0
        };

        // Get paint metrics
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          metrics.firstContentfulPaint = fcpEntry.startTime;
        }

        setMetrics(metrics);
      }
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, []);

  // Track API calls
  const trackAPICall = useCallback((url: string, method: string, duration: number, success: boolean) => {
    const metric: APICallMetric = {
      url,
      method,
      duration,
      timestamp: Date.now(),
      success
    };

    setApiCalls(prev => {
      const newCalls = [...prev, metric].slice(-50); // Keep last 50 calls
      return newCalls;
    });

    // Log slow API calls
    if (duration > 1000) {
      console.warn(`🐌 Slow API call: ${method} ${url} - ${duration}ms`);
    }
  }, []);

  // Create performance-aware fetch wrapper
  const performanceFetch = useCallback(async (url: string, options?: RequestInit) => {
    const startTime = performance.now();
    let success = false;

    try {
      const response = await fetch(url, options);
      success = response.ok;
      return response;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      trackAPICall(url, options?.method || 'GET', duration, success);
    }
  }, [trackAPICall]);

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    const recentCalls = apiCalls.filter(call => Date.now() - call.timestamp < 300000); // Last 5 minutes
    
    if (recentCalls.length === 0) {
      return {
        totalCalls: 0,
        averageResponseTime: 0,
        slowCalls: 0,
        errorRate: 0
      };
    }

    const totalCalls = recentCalls.length;
    const averageResponseTime = recentCalls.reduce((sum, call) => sum + call.duration, 0) / totalCalls;
    const slowCalls = recentCalls.filter(call => call.duration > 1000).length;
    const failedCalls = recentCalls.filter(call => !call.success).length;
    const errorRate = (failedCalls / totalCalls) * 100;

    return {
      totalCalls,
      averageResponseTime: Math.round(averageResponseTime),
      slowCalls,
      errorRate: Math.round(errorRate * 100) / 100
    };
  }, [apiCalls]);

  return {
    metrics,
    apiCalls,
    trackAPICall,
    performanceFetch,
    getPerformanceSummary
  };
}