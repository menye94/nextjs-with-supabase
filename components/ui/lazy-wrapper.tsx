"use client";

import { lazy, ComponentType } from "react";

interface LazyWrapperOptions {
  retries?: number;
  retryDelay?: number;
}

export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default?: T } & Record<string, T>>,
  exportName?: string,
  options: LazyWrapperOptions = {}
): React.LazyExoticComponent<T> {
  const { retries = 3, retryDelay = 1000 } = options;

  return lazy(async () => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const module = await importFn();
        
        // Handle both default and named exports
        if (exportName && module[exportName]) {
          return { default: module[exportName] };
        } else if (module.default) {
          return { default: module.default };
        } else {
          // If no specific export name and no default, try to find the first export
          const firstExport = Object.values(module)[0];
          if (firstExport && typeof firstExport === 'function') {
            return { default: firstExport };
          }
        }
        
        throw new Error(`Component not found in module. Available exports: ${Object.keys(module).join(', ')}`);
        
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries) {
          console.warn(`Lazy loading attempt ${attempt} failed, retrying in ${retryDelay}ms...`, error);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    throw lastError!;
  });
}

// Convenience functions for common export patterns
export function createDefaultLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: LazyWrapperOptions
) {
  return createLazyComponent(importFn, undefined, options);
}

export function createNamedLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<Record<string, T>>,
  exportName: string,
  options?: LazyWrapperOptions
) {
  return createLazyComponent(importFn, exportName, options);
}
