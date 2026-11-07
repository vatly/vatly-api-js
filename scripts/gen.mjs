#!/usr/bin/env node
// Fetch explicitly with `pnpm gen`; verify the committed snapshot offline with
// `pnpm gen:check`. Builds never depend on network access.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";

const root = new URL("../", import.meta.url);
const specPath = new URL("spec/openapi.yaml", root);
const referencePath = new URL("openapi.yaml", root);
const outputPath = new URL("src/generated/schema.ts", root);
const check = process.argv.includes("--check");
const source = "https://docs.vatly.com/openapi.yaml";
let yaml;
if (check) {
  yaml = readFileSync(specPath, "utf8");
} else {
  console.log(`Fetching ${source}`);
  const response = await fetch(source, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Spec fetch failed: ${response.status}`);
  yaml = await response.text();
}

// Do not silently downgrade future OpenAPI versions: the generator must support
// the real contract. Defaults on optional request fields must remain optional.
const schema = astToString(await openapiTS(yaml, { defaultNonNullable: false }));
if (check) {
  if (readFileSync(referencePath, "utf8") !== yaml || readFileSync(outputPath, "utf8") !== schema) {
    throw new Error("OpenAPI snapshots/types are out of sync. Run pnpm gen.");
  }
  console.log("OpenAPI snapshots and generated types are in sync.");
} else {
  for (const path of [specPath, referencePath]) writeFileSync(path, yaml);
  writeFileSync(outputPath, schema);
  console.log(`Generated ${fileURLToPath(outputPath)}`);
}
