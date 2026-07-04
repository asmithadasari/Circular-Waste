/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        moss: {
          50: "#f2f7f3",
          100: "#dfece1",
          200: "#b9d8bf",
          300: "#8ebd98",
          400: "#5f9d70",
          500: "#3e8153",
          600: "#2c6941",
          700: "#245536",
          800: "#1f452d",
          900: "#1a3a26",
        },
        clay: {
          400: "#d9a441",
          500: "#c48a2b",
        },
        ink: "#16211a",
        paper: "#f6f4ee",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
}
