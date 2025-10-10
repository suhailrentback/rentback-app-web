// tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          600: '#059669', // emerald-600 (your logo stroke)
          400: '#34D399', // emerald-400 (dark mode accent)
        },
      },
    },
  },
  plugins: [],
};
