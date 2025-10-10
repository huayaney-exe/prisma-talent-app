/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Prisma Brand Colors from brandbook.md
        black: '#000000',
        white: '#FFFFFF',
        cyan: '#47FFBF',
        purple: '#8376FF',
        pink: '#FF48C7',

        // Neutrals
        gray: {
          900: '#111111',
          800: '#222222',
          700: '#333333',
          600: '#666666',
          500: '#888888',
          400: '#999999',
          300: '#BBBBBB',
          200: '#CCCCCC',
          100: '#F5F5F5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
        '4xl': '6rem',
        '5xl': '8rem',
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
      },
      animation: {
        'lift': 'lift 220ms cubic-bezier(0, 0, 0.2, 1)',
      },
      keyframes: {
        lift: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-2px)' },
        },
      },
    },
  },
  plugins: [],
};
