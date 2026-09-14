import type { Config } from 'tailwindcss';

/**
 * Colors use channel + <alpha-value> so utilities like border-annex-mint/60 work
 * (plain CSS variables cannot be opacity-modified by Tailwind @apply / JIT).
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: 'rgb(11 18 32 / <alpha-value>)',
          950: 'rgb(5 8 15 / <alpha-value>)',
          800: 'rgb(16 25 44 / <alpha-value>)',
          700: 'rgb(18 26 46 / <alpha-value>)',
          600: 'rgb(26 36 60 / <alpha-value>)',
        },
        annex: {
          blue: 'rgb(91 140 255 / <alpha-value>)',
          deep: 'rgb(29 78 216 / <alpha-value>)',
          teal: 'rgb(14 165 164 / <alpha-value>)',
          mint: 'rgb(45 212 191 / <alpha-value>)',
          lilac: 'rgb(139 176 255 / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 80px rgba(29, 78, 216, 0.35)',
        aurora: '0 0 120px rgba(91, 140, 255, 0.28), 0 0 40px rgba(45, 212, 191, 0.12)',
      },
      backgroundImage: {
        'aurora-cta': 'linear-gradient(135deg, var(--primary) 0%, var(--glow) 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
