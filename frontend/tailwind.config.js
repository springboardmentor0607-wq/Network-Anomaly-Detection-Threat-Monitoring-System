/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#0a0d14',
          card: '#111625',
          border: '#1e2638',
          accent: '#00f0ff',
          cyan: '#00e5ff',
          blue: '#1a365d',
          darkblue: '#0d1b2a',
          emerald: '#10b981',
          green: '#00ff66',
          orange: '#ff9900',
          red: '#ff2a5f',
          purple: '#9d4edd'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 240, 255, 0.35)',
        'glow-red': '0 0 20px rgba(255, 42, 95, 0.35)',
        'glow-green': '0 0 20px rgba(0, 255, 102, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
  },
  plugins: [],
}
