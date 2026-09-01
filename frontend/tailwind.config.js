/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          base: '#0A0E27',
          surface: '#0F1629',
          elevated: '#151D35',
          subtle: '#0D1220',
          border: '#1A2540',
        },
        primary: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
        },
        accent: {
          purple: '#A78BFA',
          indigo: '#6366F1',
          violet: '#7C3AED',
        },
        severity: {
          low: '#10B981',
          medium: '#F59E0B',
          high: '#F97316',
          critical: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'sm-glow': '0 0 20px rgba(14, 165, 233, 0.1)',
        'md-glow': '0 0 30px rgba(14, 165, 233, 0.15)',
        'lg-glow': '0 0 40px rgba(14, 165, 233, 0.2)',
      }
    },
  },
  plugins: [],
}
