/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Palette pastel cho UI cartoon
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // Mint green chính
          600: '#16a34a',
        },
        secondary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',  // Tím nhạt
          600: '#9333ea',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',  // Cam nhạt
          600: '#ea580c',
        },
        surface: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#2d3748',  // Dark gray thay vì đen
          900: '#1a202c',  // Navy dark
        }
      },
      borderRadius: {
        'cartoon': '16px',
        'cartoon-lg': '24px',
        'cartoon-xl': '32px',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 8px 30px rgba(0, 0, 0, 0.12)',
        'soft-xl': '0 12px 40px rgba(0, 0, 0, 0.15)',
        'glow-primary': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-secondary': '0 0 20px rgba(168, 85, 247, 0.3)',
      },
      fontFamily: {
        'cartoon': ['Nunito', 'Comic Neue', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-soft': 'bounce-soft 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
      keyframes: {
        'bounce-soft': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

