import {
  InputHTMLAttributes,
  forwardRef,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
  useId,
} from 'react';
import { AlertCircle } from 'lucide-react';

const FIELD_BASE =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-night-900 placeholder:text-slate-400 ' +
  'transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 ' +
  'dark:border-night-600 dark:bg-night-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400';

const FIELD_ERROR = 'border-red-400 focus:ring-red-400/50 focus:border-red-400 dark:border-red-500/70';

interface FieldWrapperProps {
  id: string;
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

// Libellé relié au champ (clic sur le libellé = focus, lu par les lecteurs d'écran), aide
// facultative, et message d'erreur annoncé dès qu'il apparaît.
function FieldWrapper({ id, label, error, hint, children }: FieldWrapperProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-night-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      {children}
      {hint && !error && (
        <p id={`${id}-aide`} className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-erreur`} role="alert" className="mt-1 flex items-start gap-1 text-xs text-red-600 dark:text-red-400">
          <AlertCircle size={13} className="mt-px shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

// Attributs d'accessibilité communs : champ invalide et lien vers l'aide ou l'erreur
function ariaChamp(id: string, error?: string, hint?: string) {
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-erreur` : hint ? `${id}-aide` : undefined,
  } as const;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id: idFourni, ...props }, ref) => {
    const idAuto = useId();
    const id = idFourni ?? idAuto;
    return (
      <FieldWrapper id={id} label={label} error={error} hint={hint}>
        <input
          ref={ref}
          {...ariaChamp(id, error, hint)}
          className={`${FIELD_BASE} ${error ? FIELD_ERROR : ''} ${className}`}
          {...props}
        />
      </FieldWrapper>
    );
  },
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id: idFourni, ...props }, ref) => {
    const idAuto = useId();
    const id = idFourni ?? idAuto;
    return (
      <FieldWrapper id={id} label={label} error={error} hint={hint}>
        <textarea
          ref={ref}
          {...ariaChamp(id, error, hint)}
          className={`${FIELD_BASE} resize-none ${error ? FIELD_ERROR : ''} ${className}`}
          {...props}
        />
      </FieldWrapper>
    );
  },
);
Textarea.displayName = 'Textarea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className = '', children, id: idFourni, ...props }, ref) => {
    const idAuto = useId();
    const id = idFourni ?? idAuto;
    return (
      <FieldWrapper id={id} label={label} error={error} hint={hint}>
        <select
          ref={ref}
          {...ariaChamp(id, error, hint)}
          className={`${FIELD_BASE} ${error ? FIELD_ERROR : ''} ${className}`}
          {...props}
        >
          {children}
        </select>
      </FieldWrapper>
    );
  },
);
Select.displayName = 'Select';
