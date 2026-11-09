// Exercise the actual npm tarball in an isolated consumer, without publishing.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const temp = mkdtempSync(join(tmpdir(), "vatly-package-"));
const run = (command, args, cwd = temp) => execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
try {
  const [pack] = JSON.parse(run("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", temp], root));
  assert.equal(pack.name, "@getvatly/sdk");
  for (const path of ["dist/index.js", "dist/index.cjs", "dist/index.d.ts", "dist/index.d.cts", "dist/webhooks.js", "dist/webhooks.cjs", "dist/webhooks.d.ts", "dist/webhooks.d.cts", "README.md", "LICENSE", "CHANGELOG.md", "openapi.yaml"]) {
    assert(pack.files.some(file => file.path === path), `Missing packed file: ${path}`);
  }
  assert(!pack.files.some(file => /(?:\.test\.|^src\/|^node_modules\/|\.env)/.test(file.path)));
  writeFileSync(join(temp, "package.json"), JSON.stringify({ private: true }));
  run("npm", ["install", "--offline", "--ignore-scripts", "--no-audit", "--no-fund", join(temp, pack.filename)]);
  const exercise = `
async function main() {
  const assert = require("node:assert/strict");
  const { createServer } = require("node:http");
  const { createHmac } = require("node:crypto");
  const pkg = require("@getvatly/sdk/package.json");
  const { VatlyClient, buildClientInfoHeader } = sdk;
  assert.equal(pkg.version, ${JSON.stringify(pack.version)});
  assert(buildClientInfoHeader().includes("sdk=vatly-sdk-js/" + pkg.version));
  let calls = [];
  const server = createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    calls.push({ method: req.method, url: req.url, body, key: req.headers["idempotency-key"] });
    res.setHeader("Content-Type", "application/json");
    if (calls.length === 1) {
      res.writeHead(409, { "Retry-After": "0" });
      res.end(JSON.stringify({ message: "Busy", details: { idempotency_outcome: "in_progress" } }));
    } else if (req.method === "DELETE") { res.writeHead(204); res.end(); }
    else { res.writeHead(201); res.end(JSON.stringify({ id: "customer_result", email: "ada@example.com" })); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const client = new VatlyClient({ apiKey: "test_abcdefghij0123456789", baseUrl: "http://127.0.0.1:" + server.address().port + "/v1" });
    assert.equal((await client.customers.create({ email: "ada@example.com" })).id, "customer_result");
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0], calls[1]);
    assert.equal(calls[0].method, "POST");
    assert.equal(calls[0].url, "/v1/customers");
    assert(calls[0].key);
    assert.deepEqual(JSON.parse(calls[0].body), { email: "ada@example.com" });
    assert.equal(await client.subscriptions.cancel("sub /?", { immediately: true }), undefined);
    assert.equal(calls[2].url, "/v1/subscriptions/sub%20%2F%3F?immediately=1");
    const body = JSON.stringify({ eventName: "subscription.updated", reason: "renewed", object: { id: "sub_1" } });
    const t = Math.floor(Date.now() / 1000);
    const digest = createHmac("sha256", "test-signing-secret").update(t + "." + body).digest("hex");
    const event = await hooks.constructWebhookEvent(body, "t=" + t + ",v1=" + digest, "test-signing-secret");
    assert.equal(event.eventName, "subscription.updated");
    assert.equal(event.reason, "renewed");
    assert.equal(event.object.id, "sub_1");
  } finally { await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
`;
  writeFileSync(join(temp, "smoke.cjs"), `const sdk = require("@getvatly/sdk");\nconst hooks = require("@getvatly/sdk/webhooks");\n${exercise}`);
  writeFileSync(join(temp, "smoke.mjs"), `import * as sdk from "@getvatly/sdk";\nimport * as hooks from "@getvatly/sdk/webhooks";\nimport { createRequire } from "node:module";\nconst require = createRequire(import.meta.url);\n${exercise}`);
  for (const file of ["smoke.mjs", "smoke.cjs"]) run(process.execPath, [file]);

  const consumer = `
import { VatlyClient, fromMinorUnits, type SubscriptionBillingUpdateLink, type Subscription, type PortalSession, type RequestOptions, type CreateOneOffProductRequest } from "@getvatly/sdk";
import { constructWebhookEvent, type VatlyWebhookEvent } from "@getvatly/sdk/webhooks";
const client = new VatlyClient({ apiKey: "test_abcdefghij0123456789" });
// @ts-expect-error named server selection is not part of the public SDK
new VatlyClient({ apiKey: "test_abcdefghij0123456789", server: "staging" });
const options: RequestOptions = { timeoutMs: 1000 };
const canceled: Promise<void> = client.subscriptions.cancel("sub_1", { ...options, immediately: true });
const link: Promise<SubscriptionBillingUpdateLink> = client.subscriptions.createBillingUpdateLink("sub_1", { redirectUrlSuccess: "https://example.com/ok", redirectUrlCanceled: "https://example.com/no" });
const portal: Promise<PortalSession> = client.customers.createPortalSession("customer_1");
const updated: Promise<Subscription> = client.subscriptions.update("sub_1", { quantity: 2 });
const product: CreateOneOffProductRequest = { name: "Example", description: "License", productType: "saas", basePrice: { value: "12.34", currency: "EUR" } };
client.oneOffProducts.create(product);
client.oneOffProducts.create({ ...product, basePrice: fromMinorUnits(1234n, "EUR") });
client.testHelpers.fastForwardRenewal("sub_1", { paymentStatus: "paid" });
client.testHelpers.simulateOrderPayment("order_1", { paymentStatus: "failed" });
const event: Promise<VatlyWebhookEvent> = constructWebhookEvent("{}", "signature", "secret");
function handle(e: VatlyWebhookEvent) {
  if (!e.known) {
    const name: string = e.eventName;
    const object: unknown = e.object;
    // @ts-expect-error unsupported resource shapes must be checked by the caller
    e.object.id;
    return name;
  }
  if (e.eventName === "subscription.updated") { const sub: Subscription = e.object; return sub.scheduledUpdate; }
  if (e.eventName === "one_off_product.archived") return e.object.archivedAt;
}
function handleKnownFirst(e: VatlyWebhookEvent) {
  if (e.known) return e.eventName;
  const name: string = e.eventName;
  return name;
}
// @ts-expect-error paymentStatus is required
client.testHelpers.simulateOrderPayment("order_1", {});
// @ts-expect-error new product prices are EUR-only
client.oneOffProducts.create({ ...product, basePrice: { value: "12.34", currency: "USD" } });
`;
  for (const extension of ["mts", "cts"]) writeFileSync(join(temp, `consumer.${extension}`), consumer);
  const examples = ["basic-crud", "nextjs-webhook-route", "customer-portal", "webhook-endpoints"];
  for (const example of examples) copyFileSync(join(root, "examples", `${example}.ts`), join(temp, `${example}.mts`));
  const tsc = join(root, "node_modules/typescript/bin/tsc");
  const args = ["--noEmit", "--strict", "--target", "ES2022", "--typeRoots", join(root, "node_modules/@types"), "--types", "node"];
  run(process.execPath, [tsc, ...args, "--module", "NodeNext", "--moduleResolution", "NodeNext", "consumer.mts", "consumer.cts", ...examples.map(example => `${example}.mts`)]);
  run(process.execPath, [tsc, ...args, "--module", "ESNext", "--moduleResolution", "Bundler", "consumer.mts"]);
  const installed = JSON.parse(readFileSync(join(temp, "node_modules/@getvatly/sdk/package.json"), "utf8"));
  assert.equal(installed.publishConfig.tag, "alpha");
  console.log("Packed @getvatly/sdk: ESM/CJS HTTP + webhook smoke tests, NodeNext/Bundler typings, and examples passed.");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
