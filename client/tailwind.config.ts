import type { Config } from "tailwindcss";

const withOpacity = (variable: string) => `hsl(var(${variable}) / <alpha-value>)`;
const asValue = (variable: string) => `var(${variable})`;

const config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: ".5625rem", // 9px
        md: ".375rem", // 6px
        sm: ".1875rem", // 3px
      },
      colors: {
        background: withOpacity("--background"),
        foreground: withOpacity("--foreground"),
        border: withOpacity("--border"),
        input: withOpacity("--input"),
        ring: withOpacity("--ring"),
        card: {
          DEFAULT: withOpacity("--card"),
          foreground: withOpacity("--card-foreground"),
          border: withOpacity("--card-border"),
        },
        popover: {
          DEFAULT: withOpacity("--popover"),
          foreground: withOpacity("--popover-foreground"),
          border: withOpacity("--popover-border"),
        },
        primary: {
          DEFAULT: withOpacity("--primary"),
          foreground: withOpacity("--primary-foreground"),
          border: asValue("--primary-border"),
        },
        secondary: {
          DEFAULT: withOpacity("--secondary"),
          foreground: withOpacity("--secondary-foreground"),
          border: asValue("--secondary-border"),
        },
        muted: {
          DEFAULT: withOpacity("--muted"),
          foreground: withOpacity("--muted-foreground"),
          border: asValue("--muted-border"),
        },
        accent: {
          DEFAULT: withOpacity("--accent"),
          foreground: withOpacity("--accent-foreground"),
          border: asValue("--accent-border"),
        },
        destructive: {
          DEFAULT: withOpacity("--destructive"),
          foreground: withOpacity("--destructive-foreground"),
          border: asValue("--destructive-border"),
        },
        success: {
          DEFAULT: withOpacity("--success"),
          foreground: withOpacity("--success-foreground"),
        },
        warning: {
          DEFAULT: withOpacity("--warning"),
          foreground: withOpacity("--warning-foreground"),
        },
        info: {
          DEFAULT: withOpacity("--info"),
          foreground: withOpacity("--info-foreground"),
        },
        sidebar: {
          DEFAULT: withOpacity("--sidebar"),
          foreground: withOpacity("--sidebar-foreground"),
          border: withOpacity("--sidebar-border"),
          ring: withOpacity("--sidebar-ring"),
        },
        "sidebar-primary": {
          DEFAULT: withOpacity("--sidebar-primary"),
          foreground: withOpacity("--sidebar-primary-foreground"),
          border: asValue("--sidebar-primary-border"),
        },
        "sidebar-accent": {
          DEFAULT: withOpacity("--sidebar-accent"),
          foreground: withOpacity("--sidebar-accent-foreground"),
          border: asValue("--sidebar-accent-border"),
        },
        chart: {
          1: withOpacity("--chart-1"),
          2: withOpacity("--chart-2"),
          3: withOpacity("--chart-3"),
          4: withOpacity("--chart-4"),
          5: withOpacity("--chart-5"),
        },
        status: {
          online: "rgb(34 197 94)",
          away: "rgb(245 158 11)",
          busy: "rgb(239 68 68)",
          offline: "rgb(156 163 175)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
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
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;

export default config;
