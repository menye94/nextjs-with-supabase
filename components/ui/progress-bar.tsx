"use client";

import { useState, useEffect } from "react";

interface ProgressBarProps {
  isLoading: boolean;
  className?: string;
}

export function ProgressBar({ isLoading, className = "" }: ProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      return () => clearInterval(interval);
    } else {
      setProgress(100);
      const timer = setTimeout(() => {
        setProgress(0);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!isLoading && progress === 0) return null;

  return (
    <div className={`fixed top-0 left-0 w-full h-1 bg-gray-200 z-50 ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-theme-green to-theme-green-dark transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
