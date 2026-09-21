/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Unique sophisticated color palette - warm terracotta & sage
        primary: {
          50: '#faf5f2',
          100: '#f5ebe4',
          200: '#e8d5c4',
          300: '#d4b8a0',
          400: '#c49578',
          500: '#b8765a',
          600: '#a85d45',
          700: '#8f4a38',
          800: '#763d2f',
          900: '#5c3328',
          950: '#3d1f18',
        },
        accent: {
          50: '#f0f7f4',
          100: '#e0efe8',
          200: '#c5e0d0',
          300: '#9cc7ad',
          400: '#6faf8d',
          500: '#4d9b75',
          600: '#3d8263',
          700: '#326a52',
          800: '#2a5644',
          900: '#24453a',
        },
        // Rich deep colors for depth
        midnight: {
          50: '#f8f9fc',
          100: '#eef0f5',
          200: '#dde2ed',
          300: '#c5cce0',
          400: '#a8b4ce',
          500: '#8a9abc',
          600: '#6f7a9f',
          700: '#5a6385',
          800: '#4a5270',
          900: '#3e4560',
          950: '#1a1d29',
        },
        // Warm coral for highlights
        coral: {
          50: '#fff7f5',
          100: '#ffece7',
          200: '#ffd4c9',
          300: '#ffb4a3',
          400: '#ff8f77',
          500: '#ff6c55',
          600: '#f8533e',
          700: '#e43e32',
          800: '#c5352f',
          900: '#a73132',
        },
        success: {
          50: '#f2fcf7',
          100: '#e1f8e8',
          500: '#2eb85c',
          600: '#249649',
          700: '#1d7a3d',
        },
        warning: {
          50: '#fffaf0',
          100: '#fef3cd',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          50: '#fef7f7',
          100: '#fde8e8',
          500: '#e74c3c',
          600: '#c0392b',
        },
        dark: {
          900: '#1a1a1e',
          800: '#25252b',
          700: '#2d2d35',
          600: '#3a3a45',
        }
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
        heading: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
        'card': '0 2px 16px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 24px rgba(184, 118, 90, 0.3)',
        'glow-accent': '0 0 24px rgba(77, 155, 117, 0.3)',
        'warm': '0 4px 20px rgba(184, 118, 90, 0.15)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #faf5f2 0%, #f5ebe4 50%, #e8d5c4 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%)',
        'warm-gradient': 'linear-gradient(135deg, #b8765a 0%, #a85d45 100%)',
        'sage-gradient': 'linear-gradient(135deg, #4d9b75 0%, #3d8263 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'bounce-subtle': 'bounceSubtle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
