import { defineConfig } from "tsdown";

export default defineConfig({
	dts: true,
	clean: true,
	minify: false,
	// Why no maps: the output is not minified, so a stack trace reads as it is.
	sourcemap: false,
	target: "ES2025",
	tsconfig: "tsconfig.json",
	fixedExtension: false,
	format: "esm",
	entry: {
		index: "./src/index.ts",
	},
});
