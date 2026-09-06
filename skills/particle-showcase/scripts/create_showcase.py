#!/usr/bin/env python3
"""Export a standalone particle showcase from a local source repository."""

import argparse
import html
import json
from pathlib import Path
import re
import shlex
import sys


PORTABLE_SCRIPTS = (
    "dev", "build", "preview", "typecheck", "lint", "format", "format:check", "test"
)
EXCLUDED_NAMES = {
    "node_modules", "dist", ".git", ".openai", ".DS_Store", "__pycache__", ".venv",
    "coverage",
}
REQUIRED_FILES = (
    "index.html", "vite.config.ts", "eslint.config.js", ".prettierrc.json",
    ".prettierignore", ".editorconfig", ".gitignore", ".nvmrc", "LICENSE.md",
    "THIRD_PARTY_NOTICES.md", "package.json", "package-lock.json", "tsconfig.json",
    "src/app/App.tsx", "src/config/showcase.json", "src/particles/core/README.md",
    "src/particles/core/renderer.ts",
)
PROJECT_README = """# Particle Showcase

An interactive React + TypeScript particle showcase exported from a local source
repository. Includes Astra, DeepSeek, Kimi and GLM shapes, pointer interaction,
drag rotation, scroll transitions and replay.

## Development

Use the Node.js version in `.nvmrc`, then run `npm ci` and `npm run dev`.
Run `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`
and `npm run build` to validate the project. Production output is in `dist/`.

## Customize

- `src/config/showcase.json`: default brand, model title and version switch.
- `src/app/` and `src/components/showcase/`: page composition and SVG anchors.
- `src/particles/shapes/`: shape registry and SVG sampling.
- `src/particles/engine/`: scene lifecycle, pointer and scroll coordination.
- `src/particles/core/`: readable TypeScript motion, simulation and rendering.
- `src/styles/` and `public/assets/`: layout, local fonts and brand assets.

Start with [the core reading guide](src/particles/core/README.md). The renderer is
a reconstruction of compiled Astra modules, with GLSL shaders and preserved
source provenance. Keep [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and
[LICENSE.md](LICENSE.md). This export does not grant new third-party rights.

The exported project runs independently of the source repository and Skill.
"""


def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def excluded(name):
    return name in EXCLUDED_NAMES or name.endswith(".pyc") or (
        name.startswith(".env") and name != ".env.example"
    )


def collect_tree(directory, prefix, files):
    if directory.is_symlink():
        raise ValueError(f"Source directory must not be a symbolic link: {prefix}")
    for item in sorted(directory.iterdir()):
        if excluded(item.name):
            continue
        relative = prefix / item.name
        if item.is_symlink():
            raise ValueError(f"Source entry must not be a symbolic link: {relative}")
        if item.is_dir():
            collect_tree(item, relative, files)
        elif item.is_file():
            files[relative] = item.read_bytes()
        else:
            raise ValueError(f"Unsupported source entry: {relative}")


def export_files(source):
    """Read all inputs before creating the destination; keep one source of truth."""
    for relative in REQUIRED_FILES:
        item = source / relative
        if not item.is_file() or item.is_symlink():
            raise ValueError(f"Source repository is incomplete: missing regular file {relative}")
    files = {}
    for relative in ("src", "public/assets"):
        collect_tree(source / relative, Path(relative), files)
    for relative in REQUIRED_FILES:
        files[Path(relative)] = (source / relative).read_bytes()
    for item in source.glob("tsconfig.*.json"):
        if item.is_symlink():
            raise ValueError(f"Source entry must not be a symbolic link: {item.name}")
        files[Path(item.name)] = item.read_bytes()
    tests = source / "tests"
    if tests.is_symlink():
        raise ValueError("Source tests directory must not be a symbolic link.")
    for item in sorted(tests.glob("*.test.ts")):
        if item.is_symlink():
            raise ValueError(f"Source entry must not be a symbolic link: tests/{item.name}")
        files[Path("tests") / item.name] = item.read_bytes()
    for name in ("fixtures", "helpers"):
        if (tests / name).exists():
            collect_tree(tests / name, Path("tests") / name, files)

    manifest = json.loads(files[Path("package.json")])
    lock = json.loads(files[Path("package-lock.json")])
    manifest["name"] = "particle-showcase-starter"
    manifest["private"] = True
    manifest["scripts"] = {name: manifest["scripts"][name] for name in PORTABLE_SCRIPTS}
    if any(re.search(r"sites|manage-skill", script) for script in manifest["scripts"].values()):
        raise ValueError("Exported scripts must not depend on Sites or Skill maintenance.")
    lock["name"] = manifest["name"]
    lock["packages"][""]["name"] = manifest["name"]
    files[Path("package.json")] = json_bytes(manifest)
    files[Path("package-lock.json")] = json_bytes(lock)
    files[Path("README.md")] = PROJECT_README.encode("utf-8")
    return files


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, help="Local particle-showcase source repository")
    parser.add_argument("--dest", required=True, type=Path, help="New or empty project directory")
    parser.add_argument("--brand", choices=["astra", "deepseek", "kimi", "glm"], default="deepseek")
    parser.add_argument("--title", help="Title for the selected brand")
    parser.add_argument("--single-brand", action="store_true", help="Hide the version switch")
    args = parser.parse_args()

    script = Path(__file__).resolve()
    if args.source is not None:
        source = args.source.expanduser().resolve()
    else:
        source = script.parents[3]
        if script != source / "skills/particle-showcase/scripts/create_showcase.py":
            parser.error("This lightweight Skill has no bundled application. Pass --source /path/to/repository.")
    if not (source / "src/particles/core/renderer.ts").is_file():
        parser.error("Particle source repository not found. Pass --source /path/to/repository to a local checkout.")

    target = args.dest.expanduser().absolute()
    if target.is_symlink():
        parser.error("Destination must not be a symbolic link.")
    target = target.resolve()
    for protected in (source, script.parents[1]):
        if target == protected or protected in target.parents:
            parser.error("Destination must be outside the source repository and Skill folder.")
    if target.exists() and (not target.is_dir() or any(target.iterdir())):
        parser.error("Destination is not an empty directory; existing files were not changed.")
    if args.title is not None and not args.title.strip():
        parser.error("Title must contain visible text.")

    try:
        files = export_files(source)
        config_path = Path("src/config/showcase.json")
        config = json.loads(files[config_path])
        config["defaultVariant"] = args.brand
        config["showVersionSwitch"] = not args.single_brand
        if args.title is not None:
            config["versions"][args.brand]["modelName"] = args.title
        files[config_path] = json_bytes(config)
        title = html.escape(config["versions"][args.brand]["modelName"] + " — Particle Constellation")
        files[Path("index.html")] = re.sub(
            r"<title>.*?</title>", lambda _: f"<title>{title}</title>",
            files[Path("index.html")].decode("utf-8"), flags=re.DOTALL,
        ).encode("utf-8")
    except (ValueError, KeyError, OSError) as error:
        parser.error(f"Cannot export this source repository: {error}")

    for relative, contents in files.items():
        destination = target / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(contents)
    print(f"Created particle showcase: {target}")
    print(f"Default: {args.brand}; version switch: {config['showVersionSwitch']}")
    print(f"Next, run in {shlex.quote(str(target))}:")
    print("  npm ci\n  npm run typecheck\n  npm run lint\n  npm run build\n  npm run dev")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except OSError as error:
        print(f"Could not create showcase: {error}", file=sys.stderr)
        sys.exit(1)
