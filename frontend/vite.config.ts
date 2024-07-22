import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	optimizeDeps: {
		include: ["recoil"],
	},
	resolve: {
		alias: {
			"@assets": path.resolve(__dirname, "./src/assets"),
		},
	},
});
