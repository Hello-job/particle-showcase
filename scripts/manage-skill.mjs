import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const skillDirectory = path.join(root, "skills/particle-showcase");
const archivePath = path.join(root, "deliverables/particle-showcase-skill.zip");
const command = process.argv[2];
const excludedNames = new Set([
  "node_modules",
  "dist",
  ".git",
  ".openai",
  ".DS_Store",
  "__pycache__",
  ".venv",
]);

async function collectFiles(directory, prefix = "") {
  const files = new Map();
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name, "en"),
  )) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not portable: ${relative}`);
    if (excludedNames.has(entry.name) || entry.name.endsWith(".pyc")) {
      throw new Error(`Generated or machine-local content found: ${relative}`);
    }
    if (entry.isDirectory()) {
      for (const item of await collectFiles(absolute, relative)) files.set(...item);
    } else if (entry.isFile()) {
      files.set(relative, await readFile(absolute));
    } else {
      throw new Error(`Unsupported filesystem entry: ${relative}`);
    }
  }
  return files;
}

function validatePortability(files) {
  const textExtensions = /\.(?:[cm]?[jt]sx?|json|md|html|css|svg|py|ya?ml|txt)$/;
  for (const [name, contents] of files) {
    if (path.isAbsolute(name) || name.split("/").includes("..")) {
      throw new Error(`Unsafe package path: ${name}`);
    }
    if (
      textExtensions.test(name) &&
      /\/(?:Users|home)\/[^/\s]+|\/var\/folders\//.test(contents.toString())
    ) {
      throw new Error(`Machine-specific absolute path found in ${name}`);
    }
  }
}

async function check() {
  const files = await collectFiles(skillDirectory);
  validatePortability(files);
  for (const required of [
    "SKILL.md",
    "agents/openai.yaml",
    "scripts/create_showcase.py",
    "references/engine-and-shapes.md",
    "references/provenance.md",
    "references/verification.md",
  ]) {
    if (!files.has(required)) throw new Error(`Missing Skill file: ${required}`);
  }
  for (const name of files.keys()) {
    if (/^(?:assets|src|public)\//.test(name)) {
      throw new Error(
        `The Skill must reference the source repository, not bundle a second application: ${name}`,
      );
    }
  }
  const bytes = [...files.values()].reduce((sum, contents) => sum + contents.length, 0);
  console.log(`Skill checked: ${files.size} files, ${bytes} bytes; no bundled application.`);
}

async function pack() {
  await check();
  await mkdir(path.dirname(archivePath), { recursive: true });
  const result = spawnSync(
    "python3",
    [
      "-c",
      [
        "import pathlib, sys, zipfile",
        "source, output = map(pathlib.Path, sys.argv[1:])",
        "with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:",
        "    for item in sorted(source.rglob('*')):",
        "        if item.is_file():",
        "            info = zipfile.ZipInfo('particle-showcase/' + item.relative_to(source).as_posix(), (1980, 1, 1, 0, 0, 0))",
        "            info.create_system = 3",
        "            info.external_attr = 0o100644 << 16",
        "            info.compress_type = zipfile.ZIP_DEFLATED",
        "            archive.writestr(info, item.read_bytes(), compresslevel=9)",
      ].join("\n"),
      skillDirectory,
      archivePath,
    ],
    { encoding: "utf8" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || "Could not create Skill archive.");
  const digest = createHash("sha256")
    .update(await readFile(archivePath))
    .digest("hex");
  console.log(`Packed deliverables/particle-showcase-skill.zip\nSHA-256: ${digest}`);
  console.log("The installed Skill was not modified. Install the validated package explicitly.");
}

try {
  if (command === "check") await check();
  else if (command === "pack") await pack();
  else throw new Error("Usage: node scripts/manage-skill.mjs <check|pack>");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
