import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
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
        border: "#E0E0E0",
        input: "#F5F5F5",
        ring: "#4285F4",
        background: "#FFFFFF",
        foreground: "#202124",
        primary: {
          DEFAULT: "#4285F4", // Blue
          foreground: "#FFFFFF",
          hover: "#3367D6",
        },
        secondary: {
          DEFAULT: "#34A853", // Green
          foreground: "#FFFFFF",
          hover: "#0F9D58",
        },
        destructive: {
          DEFAULT: "#EA4335", // Red
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F1F3F4",
          foreground: "#5F6368",
        },
        accent: {
          DEFAULT: "#FBBC05", // Yellow
          foreground: "#202124",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#202124",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#202124",
          hover: "#F8F9FA",
        },
        success: {
          DEFAULT: "#34A853",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#FBBC05",
          foreground: "#202124",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
