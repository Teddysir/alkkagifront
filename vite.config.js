import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/code-cdn': {
        target: 'https://d3ud9ocg2cusae.cloudfront.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/code-cdn/, '')
      },
      '/api': {
        target: 'https://alkkagiback.shop',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
