import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: { outDir: mode === "sites" ? "dist/client" : "dist" },
  server: { host: "127.0.0.1" },
}));
