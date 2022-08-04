import react from "@vitejs/plugin-react";
import fs from "node:fs/promises";
import { TlsOptions } from "node:tls";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  let https: TlsOptions | false = false;
  if (mode !== "production") {
    const certFileExists = await fs
      .access("muzart.dev+4.pem")
      .then(() => true)
      .catch(() => false);

    if (certFileExists) {
      https = {
        cert: "muzart.dev+4.pem",
        key: "muzart.dev+4-key.pem",
      };
    }
  }

  return {
    plugins: [react()],

    server: {
      port: 3001,
      host: "muzart.dev",
      https,
    },

    preview: {
      port: 3002,
    },
  };
});
