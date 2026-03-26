/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-blue': '#1E3A8A',
        'teal': '#0D9488',
        'amber': '#F59E0B',
      },
    },
  },
  plugins: [],
}
