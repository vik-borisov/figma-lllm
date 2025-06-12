# AGENTS

This repository contains a minimal Figma plugin written in TypeScript.

## Development guidelines

- Keep the TypeScript source in `src/` and compiled output in `dist/`.
- After making changes, run `npm install` if needed, then `npm run build` to compile the plugin.
- Commit both the `src` and `dist` folders so the plugin can be used without building.
- Run `npm test` to execute any tests (currently none).
- Use two spaces for indentation in TypeScript and HTML files.
- Ensure `manifest.json` points to the compiled files in `dist/`.
