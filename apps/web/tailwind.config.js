/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('../../packages/design/src/tailwind.preset.js')],
  content: ['./app/**/*.{js,jsx,ts,tsx}', '../../packages/design/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
