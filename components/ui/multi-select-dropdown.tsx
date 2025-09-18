"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check } from "lucide-react";

interface Option {
  id: number | string;
  label: string;
  value: string | number;
}

interface MultiSelectDropdownProps {
  id: string;
  label: string;
  value: string[];
  onChange: (values: string[]) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function MultiSelectDropdown({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Select options",
  required = false,
  disabled = false,
  className = "",
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<Option[]>(options);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const filtered = options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [options, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Check if click is on the dropdown button
      const isOnButton = dropdownRef.current && dropdownRef.current.contains(target);
      
      // Check if click is on the portal dropdown
      const isOnPortal = target.closest('[data-multiselect-dropdown-portal]');
      
      // Only close if click is outside both button and portal
      if (!isOnButton && !isOnPortal) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOptions = options.filter((option) => 
    value.includes(option.value.toString())
  );

  const handleToggle = (optionValue: string) => {
    const newValues = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValues);
  };

  const handleRemove = (optionValue: string) => {
    const newValues = value.filter(v => v !== optionValue);
    onChange(newValues);
  };

  const handleToggleDropdown = () => {
    if (!disabled) {
      if (!isOpen) {
        // Calculate position when opening
        if (dropdownRef.current) {
          const rect = dropdownRef.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const viewportWidth = window.innerWidth;
          
          // Calculate initial position
          let top = rect.bottom + window.scrollY;
          let left = rect.left + window.scrollX;
          
          // Check if dropdown would go below viewport
          if (top + 240 > viewportHeight + window.scrollY) {
            top = rect.top + window.scrollY - 240; // Position above the input
          }
          
          // Check if dropdown would go right of viewport
          if (left + rect.width > viewportWidth) {
            left = Math.max(0, viewportWidth - rect.width - 10);
          }
          
          // Ensure left position is not negative
          left = Math.max(0, left);
          
          setDropdownPosition({
            top,
            left,
            width: rect.width
          });
        }
      }
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchQuery("");
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div ref={dropdownRef} className="relative">
        <div
          onClick={handleToggleDropdown}
          className={`block w-full min-h-[42px] px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm text-left transition-colors duration-150 ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"
          }`}
        >
          <div className="flex justify-between items-center">
            <div className="flex flex-wrap gap-1 flex-1 min-h-6 items-center">
              {selectedOptions.length > 0 ? (
                selectedOptions.map((option) => (
                  <span
                    key={option.id}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[var(--theme-green)] text-white"
                  >
                    {option.label}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(option.value.toString());
                      }}
                      className="ml-1 hover:text-red-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-gray-500">{placeholder}</span>
              )}
            </div>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 mt-1 ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        
        {isOpen && typeof window !== 'undefined' && createPortal(
          <div 
            data-multiselect-dropdown-portal
            className="fixed bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden z-[2147483646]"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              zIndex: 2147483646,
              position: 'fixed',
              isolation: 'isolate'
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="p-2 border-b border-gray-200 bg-gray-50">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
                autoFocus
              />
            </div>
            
            <div className="max-h-48 overflow-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const isSelected = value.includes(option.value.toString());
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleToggle(option.value.toString())}
                      className="w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150 flex items-center"
                    >
                      <div className="flex items-center w-full">
                        <div className="flex items-center h-4 w-4 mr-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by onClick
                            className="h-4 w-4 text-[var(--theme-green)] focus:ring-[var(--theme-green)] border-gray-300 rounded"
                          />
                        </div>
                        <span className="flex-1">{option.label}</span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-[var(--theme-green)] ml-2" />
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-3 text-sm text-gray-500 text-center">
                  No options found
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
} 