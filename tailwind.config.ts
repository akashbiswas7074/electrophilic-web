import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
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
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        nav: {
          DEFAULT: "hsl(var(--nav-bg))",
          hover: "hsl(var(--nav-hover))",
          active: "hsl(var(--nav-active))",
          text: "hsl(var(--nav-text))",
        },
        navbar: {
          DEFAULT: "hsl(var(--navbar-bg))",
          scroll: "hsl(var(--navbar-scroll-bg))",
          muted: "hsl(var(--navbar-muted))",
          hover: "hsl(var(--navbar-hover))",
          active: "hsl(var(--navbar-active))",
        },
        // Black and white theme specific colors
        bw: {
          black: "#000000",
          "dark-gray": "#2B2B2B",
          "medium-gray": "#6B6B6B",
          "light-gray": "#E5E5E5",
          "off-white": "#F9F9F9",
          white: "#FFFFFF",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "nav-slide-down": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-2px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(2px)" },
        },
        "navbar-in": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "navbar-out": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-100%)", opacity: "0" },
        },
        "menu-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide": {
          "0%": { opacity: "0", transform: "translateY(-100%)" },
          "15%": { opacity: "1", transform: "translateY(0)" },
          "85%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(100%)" },
        },
        "nav-slide": {
          from: {
            transform: "translateY(-100%)",
            opacity: "0",
          },
          to: {
            transform: "translateY(0)",
            opacity: "1",
          },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeOut: {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(10px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "nav-slide": "nav-slide-down 0.3s ease-out",
        "fade-in": "fade-in 0.6s ease-out",
        "slide-up": "slide-up 0.6s ease-out",
        "shake": "shake 0.5s ease-in-out",
        "navbar-in": "navbar-in 0.3s ease-out",
        "navbar-out": "navbar-out 0.3s ease-in",
        "menu-in": "menu-in 0.2s ease-out",
        "slide": "slide 4s ease-in-out infinite",
        "nav-slide-in": "nav-slide 0.5s ease-out forwards",
        "fadeIn": "fadeIn 0.5s ease-out forwards",
        "fade-out": "fadeOut 0.3s ease-out forwards",
      },
      spacing: {
        navbar: "4rem", // Height for navbar
        "navbar-scroll": "3.5rem", // Height for navbar when scrolled
      },
      backdropBlur: {
        navbar: "10px",
        xl: "20px",
        "2xl": "40px",
      },
      backgroundImage: {
        "glass-gradient":
          "linear-gradient(to right bottom, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05))",
      },
      transitionProperty: {
        navbar: "background-color, height, backdrop-filter, box-shadow",
      },
      zIndex: {
        navbar: "100",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
