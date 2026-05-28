import type { Config } from 'tailwindcss';

// PRD §10.1 Design System tokens
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#000000', soft: '#0A0A0A', card: '#121212', border: '#1f1f1f' },
        accent: { DEFAULT: '#00BCD4', hover: '#00a5bb', soft: 'rgba(0,188,212,0.1)' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '8px', input: '4px' },
    },
  },
  plugins: [],
};
export default config;
