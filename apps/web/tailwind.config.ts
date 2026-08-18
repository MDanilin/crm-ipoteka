import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Graphite ramp (UzUsta Operations design system) ─────────────
        // Cool graphite base, 9 steps: g0=white ... g90=near-black.
        // Surfaces from 00–20, borders from 30, text from 60–90.
        // Flat top-level keys (not nested under `g`) so classes read as
        // bg-g90 / text-g70 — a nested `g: {90: ...}` would instead force
        // Tailwind to generate the hyphenated bg-g-90.
        g0:  '#ffffff',
        g5:  '#f8f9fb',
        g10: '#f1f3f6',
        g20: '#e7eaef',
        g30: '#d5dae1',
        g40: '#aeb6c2',
        g60: '#7c8695',
        g70: '#515b6b',
        g80: '#333c49',
        g90: '#171c24',

        // ── Legacy c.* alias — same steps, kept so any missed usage still
        // resolves instead of rendering unstyled black-on-transparent.
        c: {
          0: '#ffffff', 1: '#f8f9fb', 2: '#f1f3f6', 3: '#e7eaef', 4: '#d5dae1',
          5: '#aeb6c2', 6: '#7c8695', 7: '#515b6b', 8: '#333c49', 9: '#171c24',
        },

        // ── Semantic tokens (maps to CSS variables) ───────────────────
        line:  '#e4e8ed',   // external borders
        line2: '#eef1f4',   // internal row dividers

        // ── Accent — the ONE interactive color: focus, selection, links,
        // active nav. Never used for decoration or brand flourish. ──────
        accent: {
          DEFAULT: '#2e5f94',
          hover:   '#24507f',
          dim:     '#edf3fa',
          deep:    '#24507f',
          border:  '#d2e0ef',
        },
        ac: { DEFAULT: '#2e5f94', hover: '#24507f', bg: '#edf3fa', border: '#d2e0ef' },

        // ── Semantic status — data states only, never decoration ───────
        ok:     { DEFAULT: '#2f7d5f', bg: '#eaf3ee', border: '#d4e5dc' },
        warn:   { DEFAULT: '#8a6a1c', bg: '#f6f2e6', border: '#e8dfc6' },
        at:     { DEFAULT: '#8a6a1c', bg: '#f6f2e6', border: '#e8dfc6' },
        danger: { DEFAULT: '#a13c3c', bg: '#f8eded', border: '#ebd5d5' },
        dn:     { DEFAULT: '#a13c3c', bg: '#f8eded', border: '#ebd5d5' },

        // ── Legacy aliases (kept for backward compat) ─────────────────
        ink:     '#171c24',
        'body-text': '#515b6b',
        muted:   '#7c8695',
        caption: '#7c8695',
        faint:   '#aeb6c2',
        divider: '#e4e8ed',
        'c-border':       '#e4e8ed',
        'c-border-input': '#d5dae1',
        'c-surface':      '#f1f3f6',
        'c-hover':        '#e7eaef',

        success: { DEFAULT: '#2f7d5f', bg: '#eaf3ee' },
        warning: { DEFAULT: '#8a6a1c', bg: '#f6f2e6' },
      },

      fontFamily: {
        sans:    ['var(--font-inter)',    'system-ui', 'sans-serif'],
        display: ['var(--font-inter)',    'system-ui', 'sans-serif'],
        mono:    ['var(--font-jetbrains)', 'ui-monospace', 'JetBrains Mono', 'monospace'],
      },

      borderRadius: {
        sm:  '3px',
        DEFAULT: '5px',
        md:  '6px',
        lg:  '8px',
        xl:  '10px',
        '2xl': '12px',
      },
    },
  },
  plugins: [],
};

export default config;
