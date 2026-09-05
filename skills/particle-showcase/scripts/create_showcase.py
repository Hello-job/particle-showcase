#!/usr/bin/env python3
"""Create a standalone React + TypeScript particle showcase in an empty directory."""

import argparse
import html
import json
from pathlib import Path
import re
import shlex
import shutil
import sys


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dest', required=True, type=Path, help='New or empty project directory')
    parser.add_argument('--brand', choices=['astra', 'deepseek', 'kimi', 'glm'], default='deepseek')
    parser.add_argument('--title', help='Title for the selected brand')
    parser.add_argument('--single-brand', action='store_true', help='Hide the version switch')
    args = parser.parse_args()

    starter = Path(__file__).resolve().parents[1] / 'assets' / 'starter'
    target = args.dest.expanduser().absolute()
    if target.is_symlink():
        parser.error('Destination must not be a symbolic link.')
    target = target.resolve()
    if target == starter or starter in target.parents:
        parser.error('Destination must be outside the bundled starter.')
    if target.exists() and (not target.is_dir() or any(target.iterdir())):
        parser.error('Destination is not an empty directory; existing files were not changed.')
    config_relative_path = Path('src/config/showcase.json')
    config_path = starter / config_relative_path
    if not config_path.is_file():
        parser.error('Bundled starter is missing. Install the entire skill folder, not just SKILL.md.')

    config = json.loads(config_path.read_text(encoding='utf-8'))
    config['defaultVariant'] = args.brand
    config['showVersionSwitch'] = not args.single_brand
    if args.title is not None:
        if not args.title.strip():
            parser.error('Title must contain visible text.')
        config['versions'][args.brand]['modelName'] = args.title

    shutil.copytree(starter, target, dirs_exist_ok=True)
    (target / config_relative_path).write_text(
        json.dumps(config, ensure_ascii=False, indent=2) + '\n', encoding='utf-8'
    )
    entry = target / 'index.html'
    title = html.escape(config['versions'][args.brand]['modelName'] + ' — Particle Constellation')
    entry.write_text(re.sub(r'<title>.*?</title>', lambda _: f'<title>{title}</title>',
                           entry.read_text(encoding='utf-8'), flags=re.DOTALL), encoding='utf-8')
    print(f'Created particle showcase: {target}')
    print(f'Default: {args.brand}; version switch: {config["showVersionSwitch"]}')
    print(f'Next, run in {shlex.quote(str(target))}:')
    print('  npm ci')
    print('  npm run typecheck')
    print('  npm run lint')
    print('  npm run build')
    print('  npm run dev -- --port 5173 --strictPort')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except OSError as error:
        print(f'Could not create showcase: {error}', file=sys.stderr)
        sys.exit(1)
