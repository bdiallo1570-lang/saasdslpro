import toast, { ToastOptions } from 'react-hot-toast';

const BASE_OPTIONS: ToastOptions = {
  duration: 3500,
  style: {
    background: 'var(--toast-bg, #141E33)',
    color: 'var(--toast-fg, #F1F5F9)',
    border: '1px solid var(--toast-border, #24324B)',
    borderRadius: '12px',
    fontSize: '14px',
    padding: '12px 16px',
  },
};

export const notify = {
  success: (message: string) =>
    toast.success(message, { ...BASE_OPTIONS, iconTheme: { primary: '#10B981', secondary: '#0F172A' } }),
  error: (message: string) =>
    toast.error(message, { ...BASE_OPTIONS, iconTheme: { primary: '#F87171', secondary: '#0F172A' } }),
  info: (message: string) => toast(message, BASE_OPTIONS),
  loading: (message: string) => toast.loading(message, BASE_OPTIONS),
  dismiss: toast.dismiss,
};
