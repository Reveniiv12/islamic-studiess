// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5", // لونك الأساسي
        'primary-dark': '#3730A3', // لون أغمق
      },
      fontFamily: {
        tajawal: ["Tajawal", "sans-serif"], // تعريف خط Tajawal
      },
    },
  },
  plugins: [],
};