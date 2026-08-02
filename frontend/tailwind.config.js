/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', '"Inter Variable"', 'system-ui', 'sans-serif'],
        // Police signature pour le nom de l'entreprise — élégante, professionnelle
        serif: ['"Playfair Display Variable"', 'Georgia', 'serif'],
      },
      colors: {
        // Fond bleu nuit profond (mode sombre par défaut)
        night: {
          950: '#0B1120',
          900: '#0F172A',
          800: '#141E33',
          700: '#1B283F',
          600: '#24324B',
          500: '#334059',
        },
        // Accent vert émeraude — actions primaires, gains, validations, calculs de tarif
        // (le nom de token "sky" est conservé pour ne pas casser les classes déjà utilisées
        // dans tout le code ; seules les valeurs hexadécimales changent vers l'émeraude)
        sky: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        // Accent orange doré — badges, accents, CTA secondaires
        // (le nom de token "cargo" est conservé, valeurs changées vers l'orange doré)
        cargo: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        // Alias rétrocompatible avec l'ancienne palette "dsl" (aligné sur l'émeraude)
        dsl: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
      },
      boxShadow: {
        'glow-sky': '0 0 0 1px rgba(16,185,129,0.4), 0 8px 24px -4px rgba(16,185,129,0.25)',
        'glow-cargo': '0 0 0 1px rgba(245,158,11,0.4), 0 8px 24px -4px rgba(245,158,11,0.25)',
        card: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(0,0,0,0.12)',
        'card-dark': '0 1px 2px rgba(0,0,0,0.2), 0 8px 24px -8px rgba(0,0,0,0.5)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-468px 0' },
          '100%': { backgroundPosition: '468px 0' },
        },
        // Fond "aurora" — trois taches de couleur qui dérivent lentement en boucle
        aurora1: {
          '0%, 100%': { transform: 'translate(0%, 0%) scale(1)' },
          '33%': { transform: 'translate(15%, -10%) scale(1.15)' },
          '66%': { transform: 'translate(-10%, 10%) scale(0.95)' },
        },
        aurora2: {
          '0%, 100%': { transform: 'translate(0%, 0%) scale(1)' },
          '33%': { transform: 'translate(-15%, 12%) scale(0.9)' },
          '66%': { transform: 'translate(10%, -15%) scale(1.2)' },
        },
        aurora3: {
          '0%, 100%': { transform: 'translate(0%, 0%) scale(1)' },
          '50%': { transform: 'translate(-8%, -12%) scale(1.1)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s ease-in-out infinite',
        aurora1: 'aurora1 18s ease-in-out infinite',
        aurora2: 'aurora2 22s ease-in-out infinite',
        aurora3: 'aurora3 26s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
