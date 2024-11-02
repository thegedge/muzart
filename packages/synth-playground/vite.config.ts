import preact from "@preact/preset-vite";
import { promises as fs } from "node:fs";
import { defineConfig, ServerOptions, UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const fileExists = async (path: string) => {
  return await fs
    .access(path)
    .then(() => true)
    .catch(() => false);
};

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }): Promise<UserConfig> => {
  let port = 80;
  let https: ServerOptions["https"] | undefined;

  const certFileExists = await fileExists("synth-playground.dev+4.pem");
  if (certFileExists) {
    port = 443;
    https = {
      cert: "synth-playground.dev+4.pem",
      key: "synth-playground.dev+4-key.pem",
    };
  }

  return {
    build: {
      minify: mode == "production",
    },

    esbuild: {
      minifyIdentifiers: mode == "production",
      keepNames: mode != "production",
    },

    plugins: [tsconfigPaths(), preact()],

    server: {
      port,
      strictPort: true,
      host: "::",
      https,
    },

    preview: {
      port,
      strictPort: true,
      host: "::",
      https,
    },
  };
});
