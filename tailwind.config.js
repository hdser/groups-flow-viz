/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        circles: {
          purple: '#7B3FF2',
          blue: '#2563EB',
          green: '#10B981',
          dark: '#1F2937',
          light: '#F3F4F6'
        }
      }
    },
  },
  plugins: [],
}