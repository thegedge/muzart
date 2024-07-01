import preact from "@preact/preset-vite";
import { promises as fs } from "node:fs";
import { defineConfig, ModuleNode, ServerOptions, UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

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

  const certFileExists = await fileExists("muzart.dev+4.pem");
  if (certFileExists) {
    port = 443;
    https = {
      cert: "muzart.dev+4.pem",
      key: "muzart.dev+4-key.pem",
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

    plugins: [
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      tsconfigPaths(),
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
