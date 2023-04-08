import preact from "@preact/preset-vite";
import fs from "node:fs/promises";
import { TlsOptions } from "node:tls";
import { defineConfig, ModuleNode } from "vite";

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
    resolve: {
      alias: {
        "react": "preact/compat",
        "react-dom": "preact/compat",
      },
    },

    build: {
      minify: mode == "production",
    },

    esbuild: {
      logOverride: {
        "this-is-undefined-in-esm": "silent",
      },
    },

    test: {
      exclude: [".direnv", "node_modules", ".git", "dist"],
    },

    plugins: [
      preact(),

      {
        name: "re-render-score",
        enforce: "post",
        handleHotUpdate({ file, modules }) {
          if (file.includes("/render/")) {
            const modulesToUpdate: ModuleNode[] = [];
            const includeAllImporters = (module: ModuleNode) => {
              if (modulesToUpdate.includes(module)) {
                return;
              }

              if (module.id?.endsWith(".css")) {
                return;
              }

              modulesToUpdate.push(module);
              if (module.id?.endsWith("/Score.tsx")) {
                return;
              }

              for (const importer of module.importers) {
                includeAllImporters(importer);
              }
            };

            for (const module of modules) {
              includeAllImporters(module);
            }

            return modulesToUpdate;
          }
        },
      },
    ],

    server: {
      port: 3001,
      host: "muzart.dev",
      https,
    },

    preview: {
      port: 3001,
      host: "muzart.dev",
      https,
    },
  };
});
