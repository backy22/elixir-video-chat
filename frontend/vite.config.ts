import react from "@vitejs/plugin-react"
import { tamaguiPlugin } from "@tamagui/vite-plugin"
import { defineConfig } from "vite"

export default defineConfig({
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === "development"),
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development"),
  },
  plugins: [tamaguiPlugin(), react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://127.0.0.1:4000", changeOrigin: true },
      "/socket": { target: "ws://127.0.0.1:4000", ws: true },
    },
  },
  build: {
    outDir: "../priv/static",
    emptyOutDir: true,
  },
})
