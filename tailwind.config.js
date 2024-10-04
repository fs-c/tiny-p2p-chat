/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,tsx,jsx,ts,js}'],
    theme: {
        extend: {
            colors: {
                'primary-purple': '#4c00c7',
            },
            backgroundImage: {
                default: "url('/bg.jpg')",
            },
        },
    },
    plugins: [require('@tailwindcss/forms')],
};
