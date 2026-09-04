/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cyber: {
          darker: "#070b14",
          card: "#0d1527",
          border: "#1b2a4a",
          accent: "#00f0ff",
          blue: "#1e6091",
          danger: "#ff3366",
          warning: "#f59e0b",
          success: "#10b981"
        }
      }
    },
  },
  plugins: [],
}