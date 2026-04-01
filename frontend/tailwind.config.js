/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'vara-dark': '#0a0a0f',
        'vara-darker': '#050508',
        'vara-light': '#1a1a2e',
        'vara-accent': '#00ff88',
        'vara-danger': '#ff4757',
        'vara-warning': '#ffa502',
        'vara-success': '#26de81',
        'vara-info': '#4834d4',
        'vara-border': '#2a2a3e',
        'vara-card': '#16213e',
        'vara-text': '#e8e8e8',
        'vara-text-secondary': '#a0a0b8',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
