/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'roloil-dark': '#111827',
        'roloil-gray': '#1F2937',
        'roloil-light-gray': '#374151',
        'roloil-purple': '#8B5CF6',
        'roloil-text': '#E5E7EB',
      },
    },
  },
  plugins: [],
}