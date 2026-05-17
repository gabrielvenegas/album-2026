import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080c0a',
        surface: '#111816',
        border: '#1e2b24',
        owned: '#22c55e',
        duplicate: '#f97316',
        missing: '#374151',
        gold: '#fbbf24',
        text: '#f0fdf4',
        muted: '#6b7280',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
