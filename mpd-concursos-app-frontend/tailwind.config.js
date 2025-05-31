/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '576px',
      'md': '768px',
      'lg': '992px',
      'xl': '1200px',
      '2xl': '1400px',
    },
    extend: {
      colors: {
        primary: '#1976D2',
        secondary: '#424242',
        accent: '#4CAF50',
        background: '#333333',
        surface: '#424242',
        error: '#f44336',
        warning: '#ff9800',
        success: '#4caf50',
      },
      spacing: {
        'xs': '0.25rem',
        'sm': '0.5rem',
        'md': '1rem',
        'lg': '1.5rem',
        'xl': '2rem',
      },
      borderRadius: {
        'sm': '4px',
        DEFAULT: '8px',
        'lg': '12px',
      },
      boxShadow: {
        DEFAULT: '0 2px 8px rgba(0, 0, 0, 0.3)',
        'light': '0 1px 4px rgba(0, 0, 0, 0.2)',
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.25rem',
        'xl': '1.5rem',
      },
      zIndex: {
        'behind': -1,
        'normal': 1,
        'above': 10,
        'modal': 100,
        'tooltip': 1000,
        'max': 9999,
      },
    },
  },
  plugins: [],
}

