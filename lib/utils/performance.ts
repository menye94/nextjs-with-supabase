// Performance monitoring utilities

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100;

  // Track page load performance
  trackPageLoad(pageName: string) {
    if (typeof window !== 'undefined') {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      
      this.addMetric({
        loadTime,
        renderTime: 0,
        timestamp: Date.now()
      });

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Page load time for ${pageName}: ${loadTime}ms`);
      }
    }
  }

  // Track component render performance
  trackRender(componentName: string, renderTime: number) {
    this.addMetric({
      loadTime: 0,
      renderTime,
      timestamp: Date.now()
    });

    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      console.warn(`Slow render detected for ${componentName}: ${renderTime}ms (target: <16ms)`);
    }
  }

  // Track API call performance
  trackApiCall(endpoint: string, duration: number) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`API call to ${endpoint}: ${duration}ms`);
    }

    if (duration > 1000) {
      console.warn(`Slow API call detected: ${endpoint} took ${duration}ms`);
    }
  }

  // Track memory usage
  trackMemoryUsage() {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100;
      
      if (usage > 80) {
        console.warn(`High memory usage detected: ${usage.toFixed(1)}%`);
      }
    }
  }

  private addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Keep only the last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  // Get performance summary
  getSummary() {
    if (this.metrics.length === 0) return null;

    const loadTimes = this.metrics.map(m => m.loadTime).filter(t => t > 0);
    const renderTimes = this.metrics.map(m => m.renderTime).filter(t => t > 0);

    return {
      avgLoadTime: loadTimes.length > 0 ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length : 0,
      avgRenderTime: renderTimes.length > 0 ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length : 0,
      maxLoadTime: loadTimes.length > 0 ? Math.max(...loadTimes) : 0,
      maxRenderTime: renderTimes.length > 0 ? Math.max(...renderTimes) : 0,
      totalMetrics: this.metrics.length
    };
  }

  // Clear metrics
  clear() {
    this.metrics = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React performance hooks
export function usePerformanceTracking(componentName: string) {
  const startTime = Date.now();

  return {
    trackRender: () => {
      const renderTime = Date.now() - startTime;
      performanceMonitor.trackRender(componentName, renderTime);
    }
  };
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memoization utility
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Intersection Observer for lazy loading
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) {
  if (typeof window === 'undefined') return null;
  
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  });
}

// Resource preloading utility
export function preloadResource(url: string, type: 'image' | 'script' | 'style' = 'image') {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = type === 'image' ? 'preload' : 'prefetch';
  link.as = type;
  link.href = url;
  document.head.appendChild(link);
}

// Bundle size monitoring
export function trackBundleSize() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;
    
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src && src.includes('_next')) {
        // This is a simplified estimation
        totalSize += 100; // Assume 100KB per script
      }
    });
    
    console.log(`Estimated bundle size: ${totalSize}KB`);
  }
}

// Performance budget checking
export const PERFORMANCE_BUDGETS = {
  pageLoad: 3000, // 3 seconds
  componentRender: 16, // 16ms (60fps)
  apiCall: 1000, // 1 second
  memoryUsage: 80 // 80%
};

export function checkPerformanceBudget(
  metric: keyof typeof PERFORMANCE_BUDGETS,
  value: number
): boolean {
  const budget = PERFORMANCE_BUDGETS[metric];
  const isWithinBudget = value <= budget;
  
  if (!isWithinBudget && process.env.NODE_ENV === 'development') {
    console.warn(`Performance budget exceeded for ${metric}: ${value}ms (budget: ${budget}ms)`);
  }
  
  return isWithinBudget;
}

// Export utilities
export {
  PerformanceMonitor,
  type PerformanceMetrics
};
