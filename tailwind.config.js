/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: { 
        primary: "#9855f6", 
        "background-light": "#f7f5f8" 
      },
      fontFamily: { 
        display: ["Inter"] 
      },
    },
  },
  plugins: [],
}