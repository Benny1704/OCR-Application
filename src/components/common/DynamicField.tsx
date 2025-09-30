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
  const displayValue = value ?? '';
  const isTextArea = typeof displayValue === 'string' && displayValue.length > 100;

  const handleFocus = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };
  const handleBlur = () => setIsEditing(false);

  const commonProps = {
    id: name,
    name: name,
    onChange: onChange,
    disabled: disabled,
    onFocus: handleFocus,
    onBlur: handleBlur,
    className: `w-full px-3 py-2 text-sm md:text-base rounded-lg border focus:outline-none focus:ring-2 transition-colors ${
      disabled
        ? 'cursor-not-allowed bg-opacity-50'
        : 'focus:ring-violet-500'
    } ${
      theme === 'dark'
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
      <label htmlFor={name} className="block text-xs md:text-sm font-medium mb-1">
        {label} {isRequired && <span className="text-red-500">*</span>}
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
      </div>
    </div>
  );
};