/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Assistant', 'sans-serif'],
        primary: ['Assistant', 'sans-serif'],
      },
      fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
      },
      colors: {
        black: '#000000',
        white: '#FFFFFF',
        
        gray: {
          1: '#FCFCFC',
          2: '#F4F4F5',
          3: '#E1E1E2',
          4: '#D0D0D4',
          5: '#A1A1AA',
          6: '#7A7A83',
          7: '#52525B',
          8: '#3F3F46',
          9: '#27272A',
          10: '#1D1D20',
        },
        
        green: {
          light: '#A7EA7B',
          dark: '#163300',
        },
        
        blue: {
          light: '#91DCED',
          dark: '#003233',
        },
        
        error: '#B3261E',
      },
    },
  },
  plugins: [],
}