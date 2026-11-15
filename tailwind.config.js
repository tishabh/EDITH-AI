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
        aurora: {
          cyan: '#00cec9',
          blue: '#4facfe',
          violet: '#6c5ce7',
          purple: '#7f00ff',
          magenta: '#e84393',
          pink: '#ff758c',
          emerald: '#00f5a0',
          dark: '#07090e',
          surface: '#0f172a',
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          card: 'rgba(15, 23, 42, 0.55)',
          border: 'rgba(255, 255, 255, 0.14)',
          highlight: 'rgba(255, 255, 255, 0.25)',
          input: 'rgba(255, 255, 255, 0.06)',
          hover: 'rgba(255, 255, 255, 0.12)',
        }
      },
      backdropBlur: {
        'xs': '2px',
        '2xl': '24px',
        '3xl': '40px',
      },
      animation: {
        'blob-1': 'blob 22s infinite alternate ease-in-out',
        'blob-2': 'blob 18s infinite alternate-reverse ease-in-out',
        'blob-3': 'blob 26s infinite alternate ease-in-out',
        'shimmer': 'shimmer 4s infinite linear',
        'pulse-subtle': 'pulseSubtle 3s infinite ease-in-out',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1) rotate(0deg)' },
          '33%': { transform: 'translate(50px, -70px) scale(1.15) rotate(45deg)' },
          '66%': { transform: 'translate(-40px, 40px) scale(0.9) rotate(90deg)' },
          '100%': { transform: 'translate(30px, -20px) scale(1.05) rotate(180deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.85' },
        }
      },
      boxShadow: {
        'liquid': '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 1px 0 rgba(255, 255, 255, 0.25)',
        'liquid-glow': '0 0 25px rgba(108, 92, 231, 0.45), inset 0 1px 1px 0 rgba(255, 255, 255, 0.3)',
        'liquid-cyan': '0 0 25px rgba(0, 206, 201, 0.35), inset 0 1px 1px 0 rgba(255, 255, 255, 0.3)',
      }
    },
  },
  plugins: [],
}
