module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      keyframes: {
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(40px) scale(0.95)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.9s cubic-bezier(0.23, 1, 0.32, 1) both',
      },
    },
  },
  plugins: [],
}; 