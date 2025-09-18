"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface Option {
  id: number | string;
  label: string;
  value: string | number;
}

interface SearchableDropdownProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SearchableDropdown({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  required = false,
  disabled = false,
  className = "",
}: SearchableDropdownProps) {
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
      const target = event.target as Node;
      
      // Check if click is on the dropdown button
      const isOnButton = dropdownRef.current && dropdownRef.current.contains(target);
      
      // Check if click is on the portal dropdown
      const isOnPortal = target.closest('[data-dropdown-portal]');
      
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

  const selectedOption = options.find((option) => option.value.toString() === value);

  const handleSelect = (option: Option) => {
    onChange(option.value.toString());
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleToggle = () => {
    if (!disabled) {
      if (!isOpen) {
        // Calculate position when opening
        if (dropdownRef.current) {
          const rect = dropdownRef.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const dropdownHeight = 240; // Approximate max height
          
          // Check if there's enough space below
          const spaceBelow = viewportHeight - rect.bottom;
          const spaceAbove = rect.top;
          
          let top = rect.bottom + window.scrollY;
          
          // If not enough space below, position above the input
          if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
            top = rect.top + window.scrollY - dropdownHeight;
          }
          
          // Ensure dropdown doesn't go off-screen horizontally
          const viewportWidth = window.innerWidth;
          let left = rect.left + window.scrollX;
          if (left + rect.width > viewportWidth) {
            left = viewportWidth - rect.width - 10; // 10px margin from edge
          }
          if (left < 10) {
            left = 10; // 10px margin from left edge
          }
          
          setDropdownPosition({
            top: top,
            left: left,
            width: rect.width
          });
          
          // Scroll the dropdown into view if it's partially hidden
          setTimeout(() => {
            const dropdownElement = document.querySelector('[data-dropdown-portal]') as HTMLElement;
            if (dropdownElement) {
              dropdownElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest',
                inline: 'nearest'
              });
            }
          }, 0);
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
                 <button
           type="button"
           onClick={handleToggle}
           disabled={disabled}
           className={`block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] sm:text-sm text-left transition-colors duration-150 ${
             disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"
           }`}
         >
           <div className="flex justify-between items-center">
             <span className={selectedOption ? "text-gray-900" : "text-gray-500"}>
               {selectedOption ? selectedOption.label : placeholder}
             </span>
             <svg
               className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
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
         </button>
        
                                                                       {isOpen && typeof window !== 'undefined' && createPortal(
            <div 
              data-dropdown-portal
              className="fixed z-[99999] bg-white border border-gray-300 rounded-md shadow-xl max-h-60 overflow-hidden"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                minWidth: '200px'
              }}
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
                   filteredOptions.map((option) => (
                     <button
                       key={option.id}
                       type="button"
                       onClick={() => handleSelect(option)}
                       className={`w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150 ${
                         option.value.toString() === value ? "bg-[var(--theme-green)] text-white hover:bg-[var(--theme-green-dark)]" : "hover:text-gray-900"
                       }`}
                     >
                       {option.label}
                     </button>
                   ))
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