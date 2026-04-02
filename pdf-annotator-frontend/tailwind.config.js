/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(214.3 31.8% 91.4%)",
        background: "hsl(0 0% 100%)",
        foreground: "hsl(222.2 84% 4.9%)",
        primary: {
          600: '#2563eb',
          700: '#1d4ed8',
        },
        annotation: {
          yellow: '#fef3c7',
          blue: '#dbeafe',
          green: '#d1fae5',
          red: '#fee2e2',
          purple: '#e9d5ff',
        },
      },
    },
  },
  plugins: [],
}