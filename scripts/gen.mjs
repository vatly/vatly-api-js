#!/usr/bin/env node
// Fetch the Vatly OpenAPI spec, down-convert to 3.1.0 (openapi-typescript / @redocly
// do not yet support 3.2.0 — see STOP item 1 in the SDK README), and emit typed schema.
// Run with: pnpm gen

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const SPEC_URL =
  "https://raw.githubusercontent.com/vatly/vatly-docs/refs/heads/main/public/openapi.yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const specDir = resolve(root, "spec");
const rawPath = resolve(specDir, "openapi.yaml");
const patchedPath = resolve(specDir, "openapi.3.1.yaml");
const outDir = resolve(root, "src/generated");
const outFile = resolve(outDir, "schema.ts");

mkdirSync(specDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

console.log(`→ fetching ${SPEC_URL}`);
const res = await fetch(SPEC_URL);
if (!res.ok) {
  console.error(`failed to fetch spec: ${res.status} ${res.statusText}`);
  process.exit(1);
}
const yaml = await res.text();
writeFileSync(rawPath, yaml);

// Only patch required for openapi-typescript@7 + @redocly/openapi-core@1.34 is the version
// stamp. The spec uses no 3.2-only constructs at the time of writing — verified by grep
// for prefixItems / unevaluatedProperties / pathItems / etc. If new 3.2-isms appear,
// this script will need a real down-converter (e.g. @redocly bundle with a transform).
const patched = yaml.replace(/^openapi: 3\.2\.0/m, "openapi: 3.1.0");
if (patched === yaml) {
  console.warn("⚠ openapi: 3.2.0 stamp not found — generation may fail.");
}
writeFileSync(patchedPath, patched);

console.log(`→ running openapi-typescript`);
const result = spawnSync(
  "npx",
  ["--yes", "openapi-typescript", patchedPath, "-o", outFile],
  { stdio: "inherit", cwd: root },
);
process.exit(result.status ?? 1);
