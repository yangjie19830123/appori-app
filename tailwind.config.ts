import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // WSI 设计系统专用色卡（命名都做了 namespace，跟其他工具不冲突）
        cream: {
          50: "#FFFCF2",
          100: "#FFF6E5",
          200: "#FBF0D6",
          300: "#F5E6BD",
        },
        ink: {
          DEFAULT: "#1A1A1A",
          soft: "#2A2A2A",
          mute: "#6B6B6B",
        },
        country: {
          jp: "#E60012",
          us: "#1E3A8A",
          uk: "#0E7C66",
          sg: "#E91E63",
          au: "#FFCD00",
          kr: "#7C3AED",
        },
        pop: {
          yellow: "#FFE66D",
          mint: "#98E2C6",
          pink: "#FECDD3",
          lilac: "#C4B5FD",
          lime: "#D9F99D",
          coral: "#FF8A80",
        },
        grade: {
          s: "#FFD93D",
          a: "#98E2C6",
          b: "#7DD3FC",
          c: "#C4B5FD",
          d: "#FCA5A5",
        },
      },
      boxShadow: {
        stamp: "4px 4px 0 0 #1A1A1A",
        "stamp-sm": "3px 3px 0 0 #1A1A1A",
        "stamp-lg": "6px 6px 0 0 #1A1A1A",
        "stamp-xl": "8px 8px 0 0 #1A1A1A",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out both",
        "pop-in": "popIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "wiggle": "wiggle 0.6s ease-in-out",
        "bounce-soft": "bounceSoft 1.5s ease-in-out infinite",
        "spin-slow": "spin 6s linear infinite",
        "shake": "shake 0.4s ease-in-out",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        popIn: {
          "0%": { opacity: "0", transform: "scale(0.85) rotate(-2deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(0)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-3deg)" },
          "75%": { transform: "rotate(3deg)" },
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
