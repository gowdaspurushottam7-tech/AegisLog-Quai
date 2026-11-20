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
        soc: {
          bg: "#0B0F19",
          card: "#111827",
          border: "#1F2937",
          accent: "#3B82F6",
          danger: "#EF4444",
          success: "#10B981",
          warning: "#F59E0B",
          terminal: "#030712"
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Consolas', 'Monaco', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash-red': 'flashRed 1.5s infinite',
      },
      keyframes: {
        flashRed: {
          '0%, 100%': { borderColor: 'rgba(239, 68, 68, 0.8)', boxShadow: '0 0 25px rgba(239, 68, 68, 0.4)' },
          '50%': { borderColor: 'rgba(239, 68, 68, 0.2)', boxShadow: 'none' },
        }
      }
    },
  },
  plugins: [],
}
