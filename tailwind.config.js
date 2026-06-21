/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        sub: "var(--sub)",
        "sub-alt": "var(--sub-alt)",
        text: "var(--text)",
        main: "var(--main)",
        error: "var(--error)",
        "error-extra": "var(--error-extra)",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      keyframes: {
        caret: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pop": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.94)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        caret: "caret 1s ease-in-out infinite",
        "fade-in": "fade-in 0.4s ease forwards",
        pop: "pop 0.12s ease",
      },
    },
  },
  plugins: [],
};
