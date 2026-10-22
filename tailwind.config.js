/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                alphabag: {
                    black:       "var(--bg-color)",
                    dark:        "var(--panel-color)",
                    darkgray:    "var(--card-color)",
                    'dark-card': "var(--card-color)",
                    hover:        "var(--hover-color)",
                    gray:        "var(--border-color)",
                    border:      "var(--border-color)",
                    'border-light': "var(--border-light)",
                    yellow:      "var(--yellow)",
                    yellowHover: "var(--yellow-hover)",
                    green:       "var(--green)",
                    red:         "var(--red)",
                    blue:        "var(--blue)",
                    text:        "var(--text-color)",
                    subtext:     "var(--subtext-color)",
                    muted:       "var(--muted-color)",
                    'ultra-muted': "#3F3F46",
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
            },
            borderRadius: {
                none: '0px',
                sm: '2px',
                DEFAULT: '4px',
                md: '4px',
                lg: '6px',
                xl: '8px',
                '2xl': '8px',
                '3xl': '8px',
                '4xl': '8px',
                full: '9999px',
            },
            boxShadow: {
                none: 'none',
                sm: 'none',
                DEFAULT: 'none',
                md: 'none',
                lg: 'none',
                xl: 'none',
                '2xl': 'none',
                'glass': 'none',
                'glass-deep': 'none',
                'glass-premium': 'none',
                'panel': 'none',
                'modal': '0 8px 24px rgba(0,0,0,0.5)',
            },
            backgroundImage: {},
            animation: {
                'fade-in-up': 'fadeInUp 0.3s ease-out forwards',
                'slide-in': 'slideIn 0.2s ease-out',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideIn: {
                    '0%': { opacity: '0', transform: 'translateY(-6px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
}
