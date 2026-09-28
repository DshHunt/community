import { lstat, readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export async function validateCommunityRecords(root = repositoryRoot) {
  const schemaPath = join(root, "schemas", "plugin-record.schema.json");
  const dataPath = join(root, "data", "plugins");
  const schema = JSON.parse(await readFile(schemaPath, "utf8"));
  const names = (await readdir(dataPath)).filter((name) => name.endsWith(".json")).sort();
  const errors = [];
  const records = [];

  for (const name of names) {
    const filePath = join(dataPath, name);
    let fileStat;
    try {
      fileStat = await lstat(filePath);
    } catch {
      errors.push(`${name}: could not inspect file`);
      continue;
    }
    if (!fileStat.isFile()) {
      errors.push(`${name}: expected a regular JSON file`);
      continue;
    }

    let record;
    try {
      record = JSON.parse(await readFile(filePath, "utf8"));
    } catch {
      errors.push(`${name}: invalid JSON`);
      continue;
    }

    const recordErrors = validatePluginRecord(record, schema, name);
    errors.push(...recordErrors);
    if (isRecord(record)) records.push({ name, record });
  }

  const firstFileById = new Map();
  const firstFileBySlug = new Map();
  for (const { name, record } of records) {
    if (typeof record.id === "string") {
      const firstName = firstFileById.get(record.id);
      if (firstName) {
        errors.push(`${name}: $.id duplicates ${firstName}`);
      } else {
        firstFileById.set(record.id, name);
      }
    }
    if (typeof record.slug === "string") {
      const firstName = firstFileBySlug.get(record.slug);
      if (firstName) {
        errors.push(`${name}: $.slug duplicates ${firstName}`);
      } else {
        firstFileBySlug.set(record.slug, name);
      }
    }
  }

  return { recordsChecked: names.length, errors };
}

export function validatePluginRecord(record, schema, fileName) {
  const errors = validateAgainstSchema(record, schema);
  if (!isRecord(record)) return errors;

  if (typeof record.slug === "string" && fileName !== `${record.slug}.json`) {
    errors.push(`${fileName}: $.slug must match the filename (${record.slug}.json)`);
  }

  if (typeof record.name === "string" && record.name.trim() !== record.name) {
    errors.push(`${fileName}: $.name must not have leading or trailing whitespace`);
  }
  if (typeof record.description === "string" && record.description.trim() !== record.description) {
    errors.push(`${fileName}: $.description must not have leading or trailing whitespace`);
  }
  if (typeof record.submissionNotes === "string" && record.submissionNotes.trim() !== record.submissionNotes) {
    errors.push(`${fileName}: $.submissionNotes must not have leading or trailing whitespace`);
  }

  const expectedId = githubRepositoryId(record.repositoryUrl);
  if (expectedId && typeof record.id === "string" && record.id !== expectedId) {
    errors.push(`${fileName}: $.id must match repositoryUrl (${expectedId})`);
  }
  if (typeof record.repositoryUrl === "string" && !isPublicHttpsUrl(record.repositoryUrl)) {
    errors.push(`${fileName}: $.repositoryUrl must be an HTTPS GitHub repository URL without credentials, query, or fragment`);
  }
  if (typeof record.homepageUrl === "string" && !isPublicHttpsUrl(record.homepageUrl)) {
    errors.push(`${fileName}: $.homepageUrl must be an absolute HTTPS URL without credentials`);
  }

  return errors;
}

function validateAgainstSchema(value, schema, path = "$") {
  const errors = [];
  if ("const" in schema && !Object.is(value, schema.const)) {
    errors.push(`${path}: must equal ${JSON.stringify(schema.const)}`);
  }
  if (schema.enum && !schema.enum.some((allowed) => Object.is(value, allowed))) {
    errors.push(`${path}: must be one of ${schema.enum.map((item) => JSON.stringify(item)).join(", ")}`);
  }

  if (schema.type === "object") {
    if (!isRecord(value)) {
      errors.push(`${path}: must be an object`);
      return errors;
    }
    for (const required of schema.required ?? []) {
      if (!Object.hasOwn(value, required)) errors.push(`${path}.${required}: is required`);
    }
    for (const [key, child] of Object.entries(value)) {
      const childSchema = schema.properties?.[key];
      if (!childSchema) {
        if (schema.additionalProperties === false) errors.push(`${path}.${key}: additional property is not allowed`);
        continue;
      }
      errors.push(...validateAgainstSchema(child, childSchema, `${path}.${key}`));
    }
    return errors;
  }

  if (schema.type === "array") {
    if (!Array.isArray(value)) {
      errors.push(`${path}: must be an array`);
      return errors;
    }
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${path}: must contain at least ${schema.minItems} item(s)`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(`${path}: must contain at most ${schema.maxItems} item(s)`);
    }
    if (schema.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) {
      errors.push(`${path}: items must be unique`);
    }
    if (schema.items) {
      value.forEach((item, index) => errors.push(...validateAgainstSchema(item, schema.items, `${path}[${index}]`)));
    }
    return errors;
  }

  if (schema.type === "string") {
    if (typeof value !== "string") {
      errors.push(`${path}: must be a string`);
      return errors;
    }
    const length = [...value].length;
    if (schema.minLength !== undefined && length < schema.minLength) errors.push(`${path}: must not be empty`);
    if (schema.maxLength !== undefined && length > schema.maxLength) errors.push(`${path}: exceeds ${schema.maxLength} characters`);
    if (schema.pattern && !new RegExp(schema.pattern, "u").test(value)) errors.push(`${path}: has an invalid format`);
    if (schema.format === "uri" && !isAbsoluteUrl(value)) errors.push(`${path}: must be an absolute URL`);
  } else if (schema.type === "integer" && !Number.isInteger(value)) {
    errors.push(`${path}: must be an integer`);
  }

  return errors;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isAbsoluteUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol.length > 1 && url.hostname.length > 0;
  } catch {
    return false;
  }
}

function isPublicHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

function githubRepositoryId(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.hostname.toLowerCase() !== "github.com" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) return null;
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length !== 2) return null;
    const owner = segments[0];
    const repository = segments[1].replace(/\.git$/iu, "");
    if (!/^[a-z0-9](?:[a-z0-9-]{0,38})$/iu.test(owner) || !/^[a-z0-9](?:[a-z0-9._-]{0,99})$/iu.test(repository)) return null;
    return `github:${owner.toLowerCase()}/${repository.toLowerCase()}`;
  } catch {
    return null;
  }
}

async function main(args) {
  const options = parseArguments(args);
  const { recordsChecked, errors } = await validateCommunityRecords(options.root);
  if (options.json) {
    process.stdout.write(`${JSON.stringify({ ok: errors.length === 0, recordsChecked, errors }, null, 2)}\n`);
    if (errors.length > 0) process.exitCode = 1;
    return;
  }
  if (errors.length > 0) {
    process.stderr.write(`Community data validation failed (${recordsChecked} file(s) checked):\n`);
    for (const error of errors) process.stderr.write(`- ${error}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`Community data validation passed (${recordsChecked} file(s) checked).\n`);
}

function parseArguments(args) {
  let root = repositoryRoot;
  let json = false;
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--root" && args[index + 1]) {
      root = resolve(args[index + 1]);
      index += 1;
    } else if (args[index] === "--json") {
      json = true;
    } else {
      throw new Error(`unknown or incomplete argument: ${args[index] ?? "<missing>"}`);
    }
  }
  return { root, json };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  void main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`Community data validation could not run: ${error instanceof Error ? error.message : "unexpected error"}\n`);
    process.exitCode = 1;
  });
}
