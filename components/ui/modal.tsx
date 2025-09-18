"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  disableClose?: boolean;
  isLoading?: boolean;
  loadingProgress?: { current: number; total: number };
}

export function Modal({ isOpen, onClose, title, children, disableClose = false, isLoading = false, loadingProgress }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !disableClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, disableClose]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[1000] ${disableClose ? 'bg-black/70' : 'bg-black/50'}`}
        onClick={disableClose ? undefined : onClose}
        style={{ cursor: disableClose ? 'not-allowed' : 'pointer' }}
      />
      
      {/* Modal */}
      <div className="relative z-[1001] bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              {title}
              {isLoading && (
                <span className="ml-2 text-sm text-gray-500 font-normal">
                  (Processing...)
                </span>
              )}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={disableClose}
            className={`h-8 w-8 p-0 hover:bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 hover:border-gray-300 ${
              disableClose ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={disableClose ? "Please wait for the operation to complete" : "Close"}
          >
            <X className="h-4 w-4 text-gray-600" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto relative">
          {children}
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--theme-green)] mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Creating pricing records...</p>
                {loadingProgress && (
                  <div className="mb-4">
                    <div className="w-64 bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-[var(--theme-green)] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {loadingProgress.current} of {loadingProgress.total} records created
                    </p>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-2">Please wait, this may take a moment</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
} 