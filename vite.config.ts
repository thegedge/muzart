import preact from "@preact/preset-vite";
import fs from "node:fs/promises";
import { defineConfig, ModuleNode, ServerOptions, UserConfig } from "vite";

const includeAllImporters = (modules: ModuleNode[]) => {
  const modulesToUpdate: ModuleNode[] = [];
  const _includeAllImporters = (module: ModuleNode) => {
    if (modulesToUpdate.includes(module)) {
      return;
    }

    modulesToUpdate.push(module);
    if (module.id?.endsWith("/Score.tsx")) {
      return;
    }

    for (const importer of module.importers) {
      _includeAllImporters(importer);
    }
  };

  for (const module of modules) {
    _includeAllImporters(module);
  }

  return modulesToUpdate;
};

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }): Promise<UserConfig> => {
  let port = 80;
  let https: ServerOptions["https"] | undefined;
  if (mode !== "production") {
    const certFileExists = await fs
      .access("muzart.dev+4.pem")
      .then(() => true)
      .catch(() => false);

    if (certFileExists) {
      port = 443;
      https = {
        cert: "muzart.dev+4.pem",
        key: "muzart.dev+4-key.pem",
      };
    }
  }

  return {
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
        async handleHotUpdate({ server, file, modules }) {
          if (file.endsWith("/score.css")) {
            server.ws.send({
              type: "custom",
              event: "muzart:render",
            });
          } else if (file.includes("/render/")) {
            return includeAllImporters(modules);
          }
        },
      },
    ],

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
