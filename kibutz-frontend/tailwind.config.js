/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: '#000000',
      white: '#FFFFFF',
      
      // Custom gray scale (1-10)
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
        // Tailwind compatibility aliases
        50: '#FCFCFC',
        100: '#F4F4F5',
        200: '#E1E1E2',
        300: '#D0D0D4',
        400: '#A1A1AA',
        500: '#7A7A83',
        600: '#52525B',
        700: '#52525B',
        800: '#3F3F46',
        900: '#27272A',
      },
      
      green: {
        light: '#A7EA7B',
        dark: '#163300',
        // Tailwind compatibility aliases
        50: '#F0FDF4',
        100: '#DCFCE7',
        200: '#BBF7D0',
        300: '#86EFAC',
        400: '#4ADE80',
        500: '#A7EA7B',
        600: '#163300',
        700: '#163300',
      },
      
      blue: {
        light: '#91DCED',
        dark: '#003233',
        // Tailwind compatibility aliases
        50: '#EFF6FF',
        100: '#DBEAFE',
        200: '#BFDBFE',
        600: '#003233',
        700: '#003233',
      },
      
      red: {
        50: '#FEF2F2',
        100: '#FEE2E2',
        400: '#B3261E',
        500: '#B3261E',
        600: '#B3261E',
        700: '#B3261E',
      },
      
      yellow: {
        500: '#EAB308',
        600: '#CA8A04',
      },
      
      orange: {
        400: '#FB923C',
        500: '#F97316',
      },
      
      pink: {
        100: '#FCE7F3',
        600: '#DB2777',
      },
      
      error: '#B3261E',
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-assistant)', 'sans-serif'],
        primary: ['var(--font-assistant)', 'sans-serif'],
        serif: ['var(--font-noto-serif-hebrew)', 'serif'],
      },
      fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
      },
    },
  },
  plugins: [],
}