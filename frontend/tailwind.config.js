/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#061018",
          900: "#0b1a28",
          800: "#12263a",
          700: "#1c3650"
        },
        mint: {
          400: "#3ee0c4",
          500: "#14b8a6",
          600: "#0f766e"
        },
        sand: {
          50: "#f7f5f0",
          100: "#efeae0"
        }
      },
      fontFamily: {
        sans: ["DM Sans", "Segoe UI", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"]
      },
      boxShadow: {
        card: "0 18px 50px -28px rgba(6,16,24,0.45)"
      }
    }
  },
  plugins: []
};
