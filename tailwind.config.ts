import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        emerald: {
          600: '#059669',
          400: '#34d399',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
