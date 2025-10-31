import type { Config } from "tailwindcss";
import clientConfig from "./client/tailwind.config";

export default {
  ...clientConfig,
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
} satisfies Config;
