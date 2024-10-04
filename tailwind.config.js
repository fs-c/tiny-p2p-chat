/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,tsx,jsx,ts,js}'],
    theme: {
        extend: {
            colors: {
                'primary-purple': '#000000  ',
            },
            backgroundImage: {
                default: "url('/bg5_downscaled.jpg')",
            },
        },
    },
    plugins: [require('@tailwindcss/forms')],
};
