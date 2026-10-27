/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B192C',
          800: '#1E3E62',
          700: '#19376D',
          600: '#003366',
        },
        slate: {
          850: '#151f30',
        },
        aicte: {
          blue: '#0B3B60',
          saffron: '#FF9933',
          green: '#138808',
          teal: '#0D9488',
        }
      }
    },
  },
  plugins: [],
}
