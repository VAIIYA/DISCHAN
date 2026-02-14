/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffe5cc',
          200: '#ffd4a8',
          300: '#f8b26d',
          400: '#f59e0b',
          500: '#ea580c',
          600: '#f472b6',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
