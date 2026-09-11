import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: 'var(--navy)',
          950: 'var(--void)',
          800: 'var(--void-800)',
          700: 'var(--void-700)',
          600: 'var(--void-600)',
        },
        annex: {
          blue: 'var(--glow)',
          deep: 'var(--primary)',
          teal: 'var(--teal)',
          mint: 'var(--teal-bright)',
          lilac: 'var(--aurora-lilac)',
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
