/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}'
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#2196F3',
        },
        secondary: {
          500: '#9C27B0',
        },
        success: '#4CAF50',
        error: '#F44336',
        status: '#FFA726',
      },
    },
  },
  plugins: [],
}

