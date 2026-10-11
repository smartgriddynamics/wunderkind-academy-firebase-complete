/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        academy: {
          navy: '#183153',
          deep: '#10243A',
          gold: '#D6A84F',
          light: '#F5F7FA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        soft: '0 18px 60px rgba(16, 36, 58, 0.10)',
      },
    },
  },
  plugins: [],
}
