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
        obsidian: {
          bg: "#09090B",
          card: "#111114",
          border: "#222228",
          terminal: "#0E0E12",
          text: "#F4F4F5",
          muted: "#A1A1AA"
        },
        mist: {
          bg: "#EAEFF5",
          card: "#F4F7FA",
          border: "#D2DCE8",
          terminal: "#E2E9F2",
          text: "#0F172A",
          muted: "#475569"
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Consolas', 'Monaco', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: [],
}
