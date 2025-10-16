import React, { useState } from 'react';
import { formatIndianCurrency } from './Helper';

interface DynamicFieldProps {
  label: string;
  name: string;
  value: string | number | null | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  disabled?: boolean;
  theme?: string;
  type?: string;
  isRequired?: boolean;
  isCurrency?: boolean;
}

export const DynamicField = ({
  label,
  name,
  value,
  onChange,
  disabled = false,
  theme = 'light',
  type = 'text',
  isRequired = false,
  isCurrency = false,
}: DynamicFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const displayValue = value ?? '';
  const isTextArea = typeof displayValue === 'string' && displayValue.length > 100;
  
  // Check if field is empty and required
  const isEmpty = displayValue === '' || displayValue === null || displayValue === undefined;
  const showError = isRequired && isEmpty && (isTouched || disabled);

  const handleFocus = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };
  
  const handleBlur = () => {
    setIsEditing(false);
    setIsTouched(true);
  };

  const commonProps = {
    id: name,
    name: name,
    onChange: onChange,
    disabled: disabled,
    onFocus: handleFocus,
    onBlur: handleBlur,
    className: `w-full px-3 py-2 text-sm md:text-base rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${
      disabled
        ? 'cursor-not-allowed bg-opacity-50'
        : 'focus:ring-violet-500'
    } ${
      showError
        ? theme === 'dark'
          ? 'border-red-500 bg-red-900/20 text-red-200 placeholder-red-400 focus:border-red-400 focus:ring-red-500/50'
          : 'border-red-500 bg-red-50 text-red-900 placeholder-red-400 focus:border-red-400 focus:ring-red-500/50'
        : theme === 'dark'
          ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400'
          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
    }`,
  };

  // Determine the value to display
  const valueToShow = isEditing || !isCurrency ? displayValue : formatIndianCurrency(displayValue);

  // Determine the input type: 'number' when editing a currency field, 'text' otherwise.
  const inputType = isEditing && isCurrency ? 'number' : 'text';

  return (
    <div className="w-full">
      <label htmlFor={name} className={`block text-xs md:text-sm font-medium mb-1 ${
        showError 
          ? theme === 'dark' ? 'text-red-400' : 'text-red-600'
          : ''
      }`}>
        {label} {isRequired && <span className="text-red-500 text-base">*</span>}
      </label>
      <div className="relative">
        {isTextArea ? (
          <textarea {...commonProps} value={displayValue} rows={3} />
        ) : (
          <input
            type={isCurrency ? inputType : type}
            {...commonProps}
            value={valueToShow}
          />
        )}
        {showError && (
          <div className={`absolute -bottom-5 left-0 text-xs font-medium flex items-center gap-1 ${
            theme === 'dark' ? 'text-red-400' : 'text-red-600'
          }`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            This field is required
          </div>
        )}
      </div>
    </div>
  );
};