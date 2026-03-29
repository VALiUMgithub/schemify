/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            /**
             * Design token system.
             *
             * Usage guide:
             *   bg-brand-600        → primary button background
             *   text-brand-600      → primary link / accent text
             *   bg-sidebar-bg       → sidebar panel background
             *   text-content-secondary → body copy / descriptions
             *   bg-surface          → card / panel backgrounds
             *   border-border       → standard divider / input border
             */
            colors: {
                // ── Brand (green scale) ─────────────────────────────────────────────
                brand: {
                    50: "rgb(var(--color-brand-50) / <alpha-value>)",
                    100: "rgb(var(--color-brand-100) / <alpha-value>)",
                    200: "rgb(var(--color-brand-200) / <alpha-value>)",
                    300: "rgb(var(--color-brand-300) / <alpha-value>)",
                    400: "rgb(var(--color-brand-400) / <alpha-value>)",
                    500: "rgb(var(--color-brand-500) / <alpha-value>)",
                    600: "rgb(var(--color-brand-600) / <alpha-value>)", // primary action color
                    700: "rgb(var(--color-brand-700) / <alpha-value>)", // primary hover
                    800: "rgb(var(--color-brand-800) / <alpha-value>)",
                    900: "rgb(var(--color-brand-900) / <alpha-value>)",
                },

                // ── Sidebar (dark navy) ──────────────────────────────────────────────
                sidebar: {
                    bg: "rgb(var(--color-sidebar-bg) / <alpha-value>)", // sidebar background
                    hover: "rgb(var(--color-sidebar-hover) / <alpha-value>)", // nav item hover
                    active: "rgb(var(--color-sidebar-active) / <alpha-value>)", // active nav item bg
                    border: "rgb(var(--color-sidebar-border) / <alpha-value>)", // divider inside sidebar
                    text: "rgb(var(--color-sidebar-text) / <alpha-value>)", // default nav text
                    "text-active": "rgb(var(--color-sidebar-text-active) / <alpha-value>)", // active nav text
                    "text-hover": "rgb(var(--color-sidebar-text-hover) / <alpha-value>)", // hovered nav text
                },

                // ── Surface (backgrounds/cards) ──────────────────────────────────────
                surface: {
                    DEFAULT: "rgb(var(--color-surface) / <alpha-value>)", // card / modal background
                    muted: "rgb(var(--color-surface-muted) / <alpha-value>)", // page background
                    subtle: "rgb(var(--color-surface-subtle) / <alpha-value>)", // inner section fill
                },

                // ── Borders ──────────────────────────────────────────────────────────
                border: {
                    DEFAULT: "rgb(var(--color-border) / <alpha-value>)", // standard border
                    strong: "rgb(var(--color-border-strong) / <alpha-value>)", // stronger border
                    focus: "rgb(var(--color-border-focus) / <alpha-value>)", // focused input ring
                },

                // ── Content (text) ───────────────────────────────────────────────────
                content: {
                    primary: "rgb(var(--color-content-primary) / <alpha-value>)", // headings / primary text
                    secondary: "rgb(var(--color-content-secondary) / <alpha-value>)", // body text
                    muted: "rgb(var(--color-content-muted) / <alpha-value>)", // placeholder / captions
                    inverse: "rgb(var(--color-content-inverse) / <alpha-value>)", // text on dark backgrounds
                },

                // ── Status ───────────────────────────────────────────────────────────
                status: {
                    "success-bg": "rgb(var(--color-status-success-bg) / <alpha-value>)",
                    "success-text": "rgb(var(--color-status-success-text) / <alpha-value>)",
                    "warning-bg": "rgb(var(--color-status-warning-bg) / <alpha-value>)",
                    "warning-text": "rgb(var(--color-status-warning-text) / <alpha-value>)",
                    "error-bg": "rgb(var(--color-status-error-bg) / <alpha-value>)",
                    "error-text": "rgb(var(--color-status-error-text) / <alpha-value>)",
                    "info-bg": "rgb(var(--color-status-info-bg) / <alpha-value>)",
                    "info-text": "rgb(var(--color-status-info-text) / <alpha-value>)",
                },
            },

            // ── Typography ─────────────────────────────────────────────────────────
            fontFamily: {
                sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
            },

            // ── Shadows ────────────────────────────────────────────────────────────
            boxShadow: {
                card: "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)",
                "card-hover": "0 4px 12px 0 rgb(0 0 0 / 0.10), 0 2px 4px -1px rgb(0 0 0 / 0.06)",
                modal: "0 20px 60px -10px rgb(0 0 0 / 0.20)",
            },

            // ── Widths ─────────────────────────────────────────────────────────────
            width: {
                sidebar: "240px",
                "sidebar-collapsed": "64px",
            },
        },
    },
    plugins: [],
};
