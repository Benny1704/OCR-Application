import React from 'react';

interface DynamicFieldProps {
  label: string;
  name: string;
  value: string | number | null | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  readOnly?: boolean;
  theme?: string;
}

export const DynamicField: React.FC<DynamicFieldProps> = ({
  label,
  name,
  value,
  onChange,
  readOnly = false,
  theme = 'light',
}) => {
  // The original error was likely caused by trying to access a property on a null value.
  // By checking for null/undefined and defaulting to an empty string, we prevent this.
  const displayValue = value ?? '';
  const isTextArea = typeof displayValue === 'string' && displayValue.length > 100; // Example condition for using a textarea

  const commonProps = {
    id: name,
    name: name,
    value: displayValue,
    onChange: onChange,
    readOnly: readOnly,
    className: `w-full px-3 py-2 text-sm md:text-base rounded-lg border focus:outline-none focus:ring-2 transition-colors ${
      readOnly
        ? 'cursor-not-allowed bg-opacity-50'
        : 'focus:ring-violet-500'
    } ${
      theme === 'dark'
        ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400'
        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
    }`,
  };

  return (
    <div className="w-full">
      <label htmlFor={name} className="block text-xs md:text-sm font-medium mb-1">
        {label}
      </label>
      {isTextArea ? (
        <textarea {...commonProps} rows={3} />
      ) : (
        <input type="text" {...commonProps} />
      )}
    </div>
  );
};