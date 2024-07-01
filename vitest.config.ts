import { defineConfig, type UserConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(async (): Promise<UserConfig> => {
  return {
    test: {
      exclude: [".direnv", "**/node_modules", ".git", "**/dist"],
    },
  };
});
