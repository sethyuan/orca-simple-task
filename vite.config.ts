import react from "@vitejs/plugin-react-swc"
import externalGlobals from "rollup-plugin-external-globals"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  return {
    define: {
      "process.env": {
        NODE_ENV: JSON.stringify(
          command === "build" ? "production" : "development",
        ),
      },
    },
    build: {
      minify: false,
      lib: {
        entry: "src/main.ts",
        fileName: "index",
        formats: ["es"],
      },
      rollupOptions: {
        external: ["react", "valtio"],
      },
    },
    plugins: [react(), externalGlobals({ react: "React", valtio: "Valtio" })],
  }
})
