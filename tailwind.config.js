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
                    black:      "var(--bg-color)",
                    dark:       "var(--panel-color)",
                    darkgray:   "var(--card-color)",
                    'dark-card':"var(--card-color)",
                    gray:       "var(--border-color)",
                    border:     "var(--border-color)",
                    'border-light': "var(--border-light)",
                    yellow:     "var(--yellow)",
                    yellowHover:"var(--yellow-hover)",
                    green:      "var(--green)",
                    red:        "var(--red)",
                    blue:       "var(--blue)",
                    text:       "var(--text-color)",
                    subtext:    "var(--subtext-color)",
                    muted:      "var(--muted-color)",
                    'ultra-muted': "#3F3F46",
                }
            },
            fontFamily: {
                sans: ['IBM Plex Sans', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
            },
            borderRadius: {
                xl: '0.5rem',
                '2xl': '0.5rem',
                '3xl': '0.5rem',
                '4xl': '0.75rem',
            },
            boxShadow: {
                'glow-yellow': '0 0 20px rgba(252,213,53,0.15)',
                'glow-yellow-lg': '0 0 40px rgba(252,213,53,0.25)',
                'glow-green':  '0 0 20px rgba(16,185,129,0.15)',
                'glass':       '0 8px 32px 0 rgba(0,0,0,0.6)',
                'glass-deep':  '0 20px 40px -10px rgba(0,0,0,0.8), 0 0 20px 0 rgba(0,0,0,0.4) inset, 0 1px 1px 0 rgba(255,255,255,0.05) inset',
                'glass-premium': '0 30px 60px -15px rgba(0,0,0,0.9), 0 0 30px 0 rgba(0,0,0,0.5) inset, 0 1px 2px 0 rgba(255,255,255,0.1) inset',
                'panel':       '0 4px 24px rgba(0,0,0,0.4)',
            },
            backgroundImage: {
                'glass-gradient': 'linear-gradient(135deg, rgba(20,20,23,0.8) 0%, rgba(0,0,0,0.95) 100%)',
                'yellow-gradient': 'linear-gradient(135deg, #FCD535 0%, #E6BF1A 100%)',
                'mesh-alphabag': 'radial-gradient(circle at 15% 50%, rgba(252,213,53,0.03), transparent 25%), radial-gradient(circle at 85% 30%, rgba(16,185,129,0.03), transparent 25%)',
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
                'glow-pulse': 'glowPulse 2s ease-in-out infinite',
                'slide-in': 'slideIn 0.3s ease-out',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                glowPulse: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(252,213,53,0.15)' },
                    '50%':      { boxShadow: '0 0 40px rgba(252,213,53,0.35)' },
                },
                slideIn: {
                    '0%': { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
            },
        },
    },
    plugins: [],
}
