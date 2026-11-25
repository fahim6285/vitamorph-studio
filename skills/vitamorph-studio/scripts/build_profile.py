#!/usr/bin/env python3
"""Build the browser-readable profile.js from one authoritative profile.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'website' / 'profile.json'
OUTPUT = ROOT / 'website' / 'assets' / 'profile.js'


def main():
    profile = json.loads(SOURCE.read_text(encoding='utf-8'))
    if not isinstance(profile, dict):
        raise SystemExit('ERROR: profile.json must contain one JSON object')
    payload = json.dumps(profile, ensure_ascii=False, indent=2).replace('</', '<\\/')
    OUTPUT.write_text('/* Built from profile.json — edit the JSON, not this file. */\nwindow.VITAMORPH_PROFILE = ' + payload + ';\n', encoding='utf-8')
    print(f'Built {OUTPUT.relative_to(ROOT)} from {SOURCE.relative_to(ROOT)}')


if __name__ == '__main__':
    main()

