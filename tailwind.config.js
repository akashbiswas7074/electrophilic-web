/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        // Primary brand colors
        brand: {
          primary: {
            DEFAULT: "#6d28d9", // purple-700
            light: "#8b5cf6",   // purple-500
            dark: "#4c1d95",    // purple-900
          },
          secondary: {
            DEFAULT: "#4f46e5", // indigo-600
            light: "#6366f1",   // indigo-500
            dark: "#3730a3",    // indigo-800
          },
          accent: {
            DEFAULT: "#9333ea", // purple-600
            light: "#a855f7",   // purple-500
            dark: "#7e22ce",    // purple-700
          },
        },
        // UI colors
        ui: {
          background: {
            dark: "#111827",    // gray-900
            DEFAULT: "#1f2937", // gray-800
            light: "#374151",   // gray-700
          },
          card: {
            dark: "#0f172a",    // slate-900
            DEFAULT: "#1e293b", // slate-800
            light: "#334155",   // slate-700
          },
          border: {
            DEFAULT: "#1f2937", // gray-800
            light: "#374151",   // gray-700
          },
        },
        // Status colors
        status: {
          success: "#10b981", // emerald-500
          warning: "#f59e0b", // amber-500
          error: "#ef4444",   // red-500
          info: "#3b82f6",    // blue-500
        },
      },
      keyframes: {
        "pulse-slow": {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.7' },
          '50%': { transform: 'scale(1.03)', opacity: '0.9' },
        },
        "gradient-shift": {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        "pulse-slow": "pulse-slow 5s infinite",
        "gradient-shift": "gradient-shift 15s ease infinite",
      },
      backgroundImage: {
        "gradient-radial-dark": "radial-gradient(ellipse at top right, #312e81, #111827, #000000)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
