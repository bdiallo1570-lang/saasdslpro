import { InputHTMLAttributes, forwardRef, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

const FIELD_BASE =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-night-900 placeholder:text-slate-400 ' +
  'transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 ' +
  'dark:border-night-600 dark:bg-night-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400';

interface FieldWrapperProps {
  label?: string;
  error?: string;
  children: ReactNode;
}

function FieldWrapper({ label, error, children }: FieldWrapperProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-night-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <FieldWrapper label={label} error={error}>
      <input
        ref={ref}
        className={`${FIELD_BASE} ${error ? 'border-red-400 focus:ring-red-400/50 focus:border-red-400' : ''} ${className}`}
        {...props}
      />
    </FieldWrapper>
  ),
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <FieldWrapper label={label} error={error}>
      <textarea ref={ref} className={`${FIELD_BASE} resize-none ${className}`} {...props} />
    </FieldWrapper>
  ),
);
Textarea.displayName = 'Textarea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = '', children, ...props }, ref) => (
    <FieldWrapper label={label} error={error}>
      <select ref={ref} className={`${FIELD_BASE} ${className}`} {...props}>
        {children}
      </select>
    </FieldWrapper>
  ),
);
Select.displayName = 'Select';
