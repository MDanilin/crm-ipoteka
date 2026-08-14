import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        ink:     '#111111',
        'body-text': '#444444',
        muted:   '#888888',
        caption: '#999999',
        faint:   '#bbbbbb',
        divider: '#eeeeee',
        'c-border': '#f0f0f0',
        'c-border-input': '#e5e5e5',
        'c-surface': '#f5f5f5',
        'c-hover':   '#f8f8f8',
        accent: {
          DEFAULT: '#e1261c',
          hover:   '#c41f16',
          dim:     '#fef2f2',
        },
        success: { DEFAULT: '#166534', bg: '#dcfce7' },
        warning: { DEFAULT: '#92400e', bg: '#fef3c7' },
        danger:  { DEFAULT: '#991b1b', bg: '#fee2e2' },
        info:    { DEFAULT: '#1d4ed8', bg: '#dbeafe' },
        avatar: { bg: '#f3dcd8', text: '#7c3f36' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
