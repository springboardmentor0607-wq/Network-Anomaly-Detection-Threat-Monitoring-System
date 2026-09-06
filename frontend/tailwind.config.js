/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        soc: {
          bg: '#0a0f1d',
          card: '#111827',
          cardBorder: '#1f2937',
          accent: '#00e5ff',
          neonGreen: '#00ff88',
          danger: '#ff3366',
          warning: '#ffb703'
        }
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  }
};
