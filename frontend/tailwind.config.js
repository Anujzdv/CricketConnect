/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary deep blue brand palette
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#1e3270',
          950: '#172554',
          DEFAULT: '#1d4ed8',
        },
        // Neutral grays for light UI
        gray: {
          50:  '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        // Status / accent colors
        green:  { DEFAULT: '#16a34a', light: '#bbf7d0', dark: '#14532d' },
        amber:  { DEFAULT: '#d97706', light: '#fef3c7', dark: '#92400e' },
        red:    { DEFAULT: '#dc2626', light: '#fee2e2', dark: '#7f1d1d' },
        // Legacy aliases
        surface: {
          950: '#060910',
          900: '#0a0f1e',
          850: '#0d1525',
          800: '#111c30',
          700: '#1a2840',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'sm':   '0 1px 2px 0 rgba(0,0,0,0.05)',
        'card': '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        'md':   '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        'lg':   '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
        'brand':'0 4px 14px rgba(29, 78, 216, 0.3)',
      },
    },
  },
  plugins: [],
}
