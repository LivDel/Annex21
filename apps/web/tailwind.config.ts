import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B1220',
          800: '#10192c',
          700: '#121a2e',
          600: '#1a243c',
        },
        annex: {
          blue: '#5B8CFF',
          deep: '#1D4ED8',
          teal: '#0EA5A4',
          mint: '#2DD4BF',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 80px rgba(29, 78, 216, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
