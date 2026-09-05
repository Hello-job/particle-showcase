import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { lstat, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const skillDirectory = path.join(root, "skills/particle-showcase");
const starterDirectory = path.join(skillDirectory, "assets/starter");
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

const portableScripts = [
  "dev",
  "build",
  "preview",
  "typecheck",
  "lint",
  "format",
  "format:check",
  "test",
];

const starterReadme = `# Particle Showcase

A React + TypeScript / TSX starter for an interactive WebGL particle showcase.
Includes Astra, DeepSeek, Kimi and GLM examples, with pointer interaction,
drag rotation, scroll transitions and replay.

## Development

Use the Node.js version in \`.nvmrc\` and npm, then run:

\`\`\`sh
npm ci
npm run dev
\`\`\`

\`npm run typecheck\`, \`npm run lint\`, \`npm test\` and \`npm run format:check\` validate
the source. \`npm run build\` creates a static site in \`dist/\`;
\`npm run preview\` serves that build locally.

## Source map

- \`src/app/\`: application composition.
- \`src/components/showcase/\`: header, hero, shape targets and controls.
- \`src/config/showcase.json\`: model names, brands, default version and shapes.
- \`src/particles/ParticleBackground.tsx\`: React scene lifecycle.
- \`src/particles/engine/\`: typed scene API and DOM/scroll coordination.
- \`src/particles/shapes/\`: shape registry and custom SVG sampling.
- \`src/particles/vendor/astra/\`: retained third-party JavaScript renderer.
- \`src/styles/\`: page and particle styles.
- \`public/assets/\`: bundled logos, fonts and fallback image.

Use the parent Skill's \`references/engine-and-shapes.md\` for new SVG shapes.
The canvas requires measurable DOM anchors and one active scene per page.
For subdirectory hosting, set Vite's \`base\` to the deployment path. Resolve new
public assets with \`assetUrl\` from \`src/lib/assets.ts\`; the bundled logos and
poster already use it, and version links preserve the current directory.

The application code uses TypeScript. The extracted renderer intentionally
remains isolated JavaScript behind a typed boundary; it is not a new original
engine. Preserve [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and
\`src/particles/vendor/astra/README.md\`. Source availability does not grant
redistribution rights to all bundled source, fonts or brand assets.

This starter is generated from the maintained showcase source. Maintainers
update the main application and run \`npm run skill:sync\` in the source
repository, then verify and pack the Skill. Generated projects can be edited
independently.
`;

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

async function sourceFiles() {
  const files = new Map();
  for (const directory of ["src", "public/assets"]) {
    for (const item of await collectFiles(path.join(root, directory), directory))
      files.set(...item);
  }

  const required = [
    "index.html",
    "vite.config.ts",
    "eslint.config.js",
    ".prettierrc.json",
    ".prettierignore",
    ".editorconfig",
    ".gitignore",
    ".nvmrc",
    "THIRD_PARTY_NOTICES.md",
    "tests/showcase-config.test.ts",
  ];
  const tsconfigs = (await readdir(root)).filter((name) =>
    /^tsconfig(?:\.[\w-]+)?\.json$/.test(name),
  );
  if (tsconfigs.length === 0) throw new Error("No source TypeScript configuration found.");
  for (const relative of [...required, ...tsconfigs]) {
    files.set(relative, await readFile(path.join(root, relative)));
  }
  for (const relative of ["LICENSE", "LICENSE.md"]) {
    if (existsSync(path.join(root, relative))) {
      files.set(relative, await readFile(path.join(root, relative)));
    }
  }

  const manifest = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  const lock = JSON.parse(await readFile(path.join(root, "package-lock.json"), "utf8"));
  manifest.name = "particle-showcase-starter";
  manifest.private = true;
  manifest.scripts = Object.fromEntries(
    portableScripts.map((name) => {
      if (!manifest.scripts[name]) throw new Error(`Source package is missing script: ${name}`);
      return [name, manifest.scripts[name]];
    }),
  );
  if (Object.values(manifest.scripts).some((script) => /sites|manage-skill/.test(script))) {
    throw new Error("Portable scripts must not require Sites or Skill maintenance files.");
  }
  lock.name = manifest.name;
  if (!lock.packages?.[""]) throw new Error("Expected package-lock v2 or v3 root package.");
  lock.packages[""].name = manifest.name;
  files.set("package.json", Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`));
  files.set("package-lock.json", Buffer.from(`${JSON.stringify(lock, null, 2)}\n`));
  files.set("README.md", Buffer.from(starterReadme));
  if (!files.has("src/app/App.tsx") || !files.has("src/config/showcase.json")) {
    throw new Error("The TypeScript application must be ready before synchronizing the Skill.");
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
  const expected = await sourceFiles();
  const actual = await collectFiles(starterDirectory);
  const differences = [];
  for (const [name, bytes] of expected) {
    if (!actual.has(name)) differences.push(`missing ${name}`);
    else if (!bytes.equals(actual.get(name))) differences.push(`changed ${name}`);
  }
  for (const name of actual.keys()) {
    if (!expected.has(name)) differences.push(`extra ${name}`);
  }
  if (differences.length > 0) {
    throw new Error(`Starter drift detected; run npm run skill:sync:\n${differences.join("\n")}`);
  }
  const skillFiles = await collectFiles(skillDirectory);
  validatePortability(skillFiles);
  console.log(
    `Skill checked: ${expected.size} starter files match the source; package is portable.`,
  );
}

async function sync() {
  const expected = await sourceFiles();
  validatePortability(expected);
  if (existsSync(starterDirectory) && (await lstat(starterDirectory)).isSymbolicLink()) {
    throw new Error("Refusing to replace a starter directory that is a symbolic link.");
  }
  // Replace only this generated subtree, after all source inputs have been validated.
  await rm(starterDirectory, { recursive: true, force: true });
  for (const [relative, bytes] of expected) {
    const destination = path.join(starterDirectory, relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, bytes);
  }
  console.log(`Synchronized ${expected.size} starter files from the main application.`);
  await check();
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
  if (command === "sync") await sync();
  else if (command === "check") await check();
  else if (command === "pack") await pack();
  else throw new Error("Usage: node scripts/manage-skill.mjs <sync|check|pack>");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
