import { Request, Response, NextFunction } from 'express';

interface PerformanceMetric {
  timestamp: number;
  method: string;
  url: string;
  responseTime: number;
  statusCode: number;
  userAgent?: string;
}

interface DatabaseMetric {
  timestamp: number;
  query: string;
  duration: number;
  success: boolean;
}

class PerformanceMonitor {
  private apiMetrics: PerformanceMetric[] = [];
  private dbMetrics: DatabaseMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics

  // API Performance Middleware
  trackAPIPerformance = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Override res.end to capture response time
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const responseTime = Date.now() - startTime;
      
      // Store metric
      const metric: PerformanceMetric = {
        timestamp: Date.now(),
        method: req.method,
        url: req.originalUrl,
        responseTime,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent')
      };
      
      performanceMonitor.addAPIMetric(metric);
      
      // Log slow requests (>1000ms)
      if (responseTime > 1000) {
        console.warn(`🐌 Slow API request: ${req.method} ${req.originalUrl} - ${responseTime}ms`);
      }
      
      // Call original end
      originalEnd.call(this, chunk, encoding);
    };
    
    next();
  };

  // Database Performance Tracking
  trackDatabaseQuery(query: string, duration: number, success: boolean = true) {
    const metric: DatabaseMetric = {
      timestamp: Date.now(),
      query: query.substring(0, 100), // Truncate long queries
      duration,
      success
    };
    
    this.addDBMetric(metric);
    
    // Log slow queries (>500ms)
    if (duration > 500) {
      console.warn(`🐌 Slow DB query: ${query.substring(0, 50)}... - ${duration}ms`);
    }
  }

  private addAPIMetric(metric: PerformanceMetric) {
    this.apiMetrics.push(metric);
    if (this.apiMetrics.length > this.maxMetrics) {
      this.apiMetrics.shift();
    }
  }

  private addDBMetric(metric: DatabaseMetric) {
    this.dbMetrics.push(metric);
    if (this.dbMetrics.length > this.maxMetrics) {
      this.dbMetrics.shift();
    }
  }

  // Get performance statistics
  getAPIStats(timeWindow: number = 300000) { // Last 5 minutes
    const cutoff = Date.now() - timeWindow;
    const recentMetrics = this.apiMetrics.filter(m => m.timestamp > cutoff);
    
    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        slowRequests: 0,
        errorRate: 0,
        requestsPerMinute: 0
      };
    }

    const totalRequests = recentMetrics.length;
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const slowRequests = recentMetrics.filter(m => m.responseTime > 1000).length;
    const errorRequests = recentMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorRequests / totalRequests) * 100;
    const requestsPerMinute = (totalRequests / (timeWindow / 60000));

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      slowRequests,
      errorRate: Math.round(errorRate * 100) / 100,
      requestsPerMinute: Math.round(requestsPerMinute * 100) / 100
    };
  }

  getDBStats(timeWindow: number = 300000) {
    const cutoff = Date.now() - timeWindow;
    const recentMetrics = this.dbMetrics.filter(m => m.timestamp > cutoff);
    
    if (recentMetrics.length === 0) {
      return {
        totalQueries: 0,
        averageQueryTime: 0,
        slowQueries: 0,
        failedQueries: 0
      };
    }

    const totalQueries = recentMetrics.length;
    const averageQueryTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries;
    const slowQueries = recentMetrics.filter(m => m.duration > 500).length;
    const failedQueries = recentMetrics.filter(m => !m.success).length;

    return {
      totalQueries,
      averageQueryTime: Math.round(averageQueryTime),
      slowQueries,
      failedQueries
    };
  }

  // Get recent API metrics for detailed analysis
  getRecentAPIMetrics(limit: number = 50) {
    return this.apiMetrics.slice(-limit).reverse();
  }

  // Get recent DB metrics for detailed analysis
  getRecentDBMetrics(limit: number = 50) {
    return this.dbMetrics.slice(-limit).reverse();
  }
}

export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;