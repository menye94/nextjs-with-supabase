import React from "react";
import { Calendar } from "lucide-react";
import { Input } from "./input";

interface DateInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
  label?: string;
  size?: "default" | "small";
}

export function DateInput({
  id,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  min,
  max,
  className = "",
  label,
  size = "default"
}: DateInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleCalendarClick = () => {
    if (inputRef.current && !disabled) {
      inputRef.current.showPicker?.() ?? inputRef.current.focus();
    }
  };

  const sizeClasses = size === "small" 
    ? "w-32 p-2 pr-8" 
    : "w-full p-3 pr-10";

  const iconSize = size === "small" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className="relative group">
      <Input
        ref={inputRef}
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        className={`${sizeClasses} border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] transition-colors [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none disabled:bg-gray-50 disabled:text-gray-500 ${className}`}
      />
      <button
        type="button"
        onClick={handleCalendarClick}
        disabled={disabled}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-[var(--theme-green)] disabled:text-gray-300 disabled:cursor-not-allowed transition-colors group-hover:text-gray-500"
        title="Click calendar icon to open date picker"
      >
        <Calendar className={iconSize} />
      </button>
    </div>
  );
} 