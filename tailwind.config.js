/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          magenta: '#C80893',
          plum: '#871281',
          charcoal: '#444444',
          green: '#83C704',
          lime: '#A9D203',
          lightGray: '#E6E7E9',
          surface: '#FFFFFF', // Provisional neutral surface pending approval
          border: '#D5D7DC',
          darkText: '#262626',
        },
      },
      fontFamily: {
        heading: ['Tajawal', 'Janna LT', 'sans-serif'],
        subheading: ['Tajawal', 'Janna LT', 'sans-serif'],
        body: ['IBM Plex Sans Arabic', 'Noto Sans Arabic', 'Tajawal', 'Janna LT', 'sans-serif'],
        sans: ['IBM Plex Sans Arabic', 'Noto Sans Arabic', 'Tajawal', 'Janna LT', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        badge: '6px',
        input: '8px',
        btn: '8px',
        card: '12px',
        modal: '16px',
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(68, 68, 68, 0.08), 0 1px 2px -1px rgba(68, 68, 68, 0.08)',
        card: '0 2px 6px 0 rgba(68, 68, 68, 0.06)',
        dialog: '0 10px 25px -5px rgba(68, 68, 68, 0.2), 0 8px 10px -6px rgba(68, 68, 68, 0.2)',
      },
    },
  },
  plugins: [],
}
