/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'nexus-dark': '#0D1117',
        'nexus-bg': '#161B22',
        'nexus-surface': '#21262D',
        'nexus-primary': 'var(--color-accent)',
        'nexus-secondary': 'var(--color-accent)',
        'nexus-accent': 'var(--color-accent)',
        'nexus-text': '#C9D1D9',
        'nexus-text-secondary': '#8B949E',
        'nexus-border': '#30363D',
        'cyan-glow': 'rgba(0, 255, 255, 0.5)',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'serif': ['Lora', 'serif'],
        'mono': ['Roboto Mono', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(0, 255, 255, 0.3), 0 0 5px rgba(0, 255, 255, 0.5)',
      }
    },
  },
  plugins: [],
}
