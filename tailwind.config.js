/** @type {import('tailwindcss').Config} */
const sharedConfig = require("@casalvi/tailwind-config");

module.exports = {
  ...sharedConfig,
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    // Include shared UI components
    '../../packages/ui/src/**/*.{ts,tsx}'
  ],
  presets: [sharedConfig],
  plugins: [
    require('@tailwindcss/typography')
  ]
}
