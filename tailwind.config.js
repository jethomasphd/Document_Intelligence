/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0d14',
        'bg-surface': '#111827',
        'bg-raised': '#1a2236',
        'accent-cyan': '#00d4ff',
        'accent-gold': '#f0a500',
        'text-primary': '#e2e8f0',
        'text-muted': '#64748b',
        'border-line': '#1e2d45',
        'success': '#10b981',
        'warning': '#f59e0b',
        'error': '#ef4444',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
