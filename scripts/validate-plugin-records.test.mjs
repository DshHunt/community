import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { validateCommunityRecords, validatePluginRecord } from "./validate-plugin-records.mjs";

async function temporaryRepository(t) {
  const root = await mkdtemp(join(tmpdir(), "dshhunt-community-validation-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "schemas"), { recursive: true });
  await mkdir(join(root, "data", "plugins"), { recursive: true });
  await cp(
    new URL("../schemas/plugin-record.schema.json", import.meta.url),
    join(root, "schemas", "plugin-record.schema.json"),
  );
  return root;
}

async function readExample(fileName) {
  return JSON.parse(await readFile(new URL(`../examples/${fileName}`, import.meta.url), "utf8"));
}

test("minimal and complete public examples satisfy the schema", async () => {
  const schema = JSON.parse(await readFile(new URL("../schemas/plugin-record.schema.json", import.meta.url), "utf8"));
  const minimal = await readExample("plugin-record.minimal.json");
  const full = await readExample("plugin-record.full.json");

  assert.deepEqual(validatePluginRecord(minimal, schema, `${minimal.slug}.json`), []);
  assert.deepEqual(validatePluginRecord(full, schema, `${full.slug}.json`), []);
});

test("reports missing fields, invalid URLs, and identity mismatch with field paths", async () => {
  const schema = JSON.parse(await readFile(new URL("../schemas/plugin-record.schema.json", import.meta.url), "utf8"));
  const record = await readExample("plugin-record.minimal.json");
  delete record.description;
  record.repositoryUrl = "javascript:alert(1)";

  const errors = validatePluginRecord(record, schema, `${record.slug}.json`);
  assert.ok(errors.some((error) => error.includes("$.description: is required")));
  assert.ok(errors.some((error) => error.includes("$.repositoryUrl")));
});

test("checks every JSON file and reports duplicate IDs and slugs", async (t) => {
  const root = await temporaryRepository(t);
  const first = await readExample("plugin-record.minimal.json");
  const second = { ...first };
  const invalid = { ...first, slug: "bad-file", repositoryUrl: "https://github.com/example/another-plugin" };
  await writeFile(join(root, "data", "plugins", `${first.slug}.json`), `${JSON.stringify(first)}\n`);
  await writeFile(join(root, "data", "plugins", "duplicate-slug.json"), `${JSON.stringify(second)}\n`);
  await writeFile(join(root, "data", "plugins", "bad-file.json"), `${JSON.stringify(invalid)}\n`);
  await writeFile(join(root, "data", "plugins", "broken.json"), "{\n");

  const result = await validateCommunityRecords(root);
  assert.equal(result.recordsChecked, 4);
  assert.ok(result.errors.some((error) => error.includes("$.id duplicates")));
  assert.ok(result.errors.some((error) => error.includes("$.slug duplicates")));
  assert.ok(result.errors.some((error) => error.includes("bad-file.json: $.id must match repositoryUrl")));
  assert.ok(result.errors.some((error) => error.includes("broken.json: invalid JSON")));
});

test("rejects a symbolic link instead of reading through it", async (t) => {
  const root = await temporaryRepository(t);
  const record = await readExample("plugin-record.minimal.json");
  const target = join(root, "outside.json");
  await writeFile(target, `${JSON.stringify(record)}\n`);
  await import("node:fs/promises").then(({ symlink }) => symlink(target, join(root, "data", "plugins", `${record.slug}.json`)));

  const result = await validateCommunityRecords(root);
  assert.ok(result.errors.some((error) => error.includes("expected a regular JSON file")));
});

test("CLI emits machine-readable errors and exits nonzero for invalid data", async (t) => {
  const root = await temporaryRepository(t);
  const record = await readExample("plugin-record.minimal.json");
  delete record.name;
  await writeFile(join(root, "data", "plugins", `${record.slug}.json`), `${JSON.stringify(record)}\n`);

  const scriptPath = fileURLToPath(new URL("./validate-plugin-records.mjs", import.meta.url));
  const result = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, "--root", root, "--json"]);
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });

  assert.equal(result.code, 1);
  assert.equal(result.stderr, "");
  assert.equal(JSON.parse(result.stdout).ok, false);
  assert.ok(JSON.parse(result.stdout).errors.some((error) => error.includes("$.name: is required")));
});
