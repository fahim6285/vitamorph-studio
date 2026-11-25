#!/usr/bin/env python3
"""Public CV consistency and privacy audit. Exits nonzero if critical errors exist."""
import argparse
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / 'website'
PROFILE = WEB / 'profile.json'


def is_public_url(value):
    try:
        parts = urlsplit(value)
        return parts.scheme in ('http', 'https') and bool(parts.hostname)
    except ValueError:
        return False


def run(strict=False):
    issues, warnings = [], []
    p = json.loads(PROFILE.read_text(encoding='utf-8'))
    mandatory = ['name', 'role', 'institution', 'summary', 'metrics', 'publications', 'links']
    for field in mandatory:
        if field not in p:
            issues.append(f'Missing field: {field}')
    if strict:
        for key, placeholders in {'name': {'Your Name'}, 'role': {'Professional title'}, 'institution': {'Institution / Organization'}}.items():
            if str(p.get(key, '')).strip() in placeholders or not str(p.get(key, '')).strip():
                issues.append(f'Public site has unfilled field: {key}')
        if not p.get('snapshot'):
            warnings.append('Public profile has no snapshot/as-of date')
    pub = p.get('publications', [])
    if not isinstance(pub, list):
        issues.append('publications must be an array'); pub = []
    seen_title = set(); seen_doi = set()
    for i, item in enumerate(pub, 1):
        if not isinstance(item, dict):
            issues.append(f'Publication {i} must be an object'); continue
        for key in ['title', 'year', 'type']:
            if not str(item.get(key, '')).strip():
                issues.append(f'Publication {i} missing {key}')
        title = re.sub(r'[^a-z0-9]+', '', str(item.get('title', '')).casefold())
        if title and title in seen_title:
            issues.append(f'Duplicate normalized publication title at item {i}')
        seen_title.add(title)
        doi = str(item.get('doi_url') or '').strip()
        if doi:
            if not is_public_url(doi):
                issues.append(f'Invalid DOI link at item {i}: {doi}')
            elif not urlsplit(doi).hostname.endswith('doi.org'):
                warnings.append(f'DOI link not hosted on doi.org at item {i}; check that this is a DOI')
            token = re.sub(r'^https?://(?:dx\.)?doi\.org/', '', doi, flags=re.I).casefold().rstrip('/')
            if token in seen_doi:
                issues.append(f'Duplicate DOI at item {i}: {doi}')
            seen_doi.add(token)
    scope = p.get('publication_scope', 'complete')
    if scope not in {'complete', 'selected'}:
        issues.append('publication_scope must be complete or selected')
    totals = p.get('publication_totals')
    if totals:
        cats = totals.get('categories', {})
        if any(not isinstance(v, int) or v < 0 for v in cats.values()):
            issues.append('Publication total category counts must be nonnegative integers')
        else:
            counted = sum(cats.values())
            if counted != totals.get('total'):
                issues.append(f'Publication categories sum to {counted}, not the stated total {totals.get("total")}')
        if scope == 'complete' and len(pub) != totals.get('total'):
            issues.append(f'Complete archive has {len(pub)} items but total states {totals.get("total")}')
        elif scope == 'selected' and len(pub) < totals.get('total', 0):
            warnings.append('Archive deliberately selected; verify website does not call it a complete list')
    metrics = p.get('metrics', [])
    labels = set()
    for i, metric in enumerate(metrics, 1):
        if not isinstance(metric, dict):
            issues.append(f'Metric {i} must be an object'); continue
        label = str(metric.get('label', '')).strip().casefold()
        if label in labels: warnings.append(f'Repeated metric label: {label}')
        labels.add(label)
        if not metric.get('source'):
            (issues if strict else warnings).append(f'Metric {i} has no source: {metric.get("label", "unnamed")}')
        if not metric.get('as_of'):
            warnings.append(f'Metric {i} has no as-of date: {metric.get("label", "unnamed")}')
    links = p.get('links', {})
    for name, value in links.items():
        if not value: continue
        if name == 'email':
            if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', value):
                issues.append('Malformed public email')
        elif name == 'cv_pdf':
            path = (WEB / str(value)).resolve()
            if not path.is_relative_to(WEB.resolve()):
                issues.append('Unsafe CV PDF path outside website folder')
            elif not path.exists():
                warnings.append(f'CV PDF path not found: {value}')
        elif not is_public_url(value):
            issues.append(f'Invalid public URL for {name}: {value}')
    portrait = p.get('portrait')
    if portrait:
        path = (WEB / portrait).resolve()
        if not path.is_relative_to(WEB.resolve()):
            issues.append('Unsafe portrait path outside website folder')
        elif not path.exists():
            warnings.append(f'Portrait not found: {portrait}')
    restricted = ['phone', 'mobile', 'home_address', 'date_of_birth', 'national_id', 'student_roll_number', 'private_email', 'password']
    for key in restricted:
        if key in p and p[key]:
            issues.append(f'Disallowed public personal field in profile.json: {key}')
    if not (WEB / 'index.html').exists() or not (WEB / 'assets' / 'app.js').exists() or not (WEB / 'assets' / 'style.css').exists():
        issues.append('Critical website asset(s) missing')
    browser_js = WEB / 'assets' / 'profile.js'
    if not browser_js.exists() or browser_js.stat().st_mtime < PROFILE.stat().st_mtime:
        warnings.append('Browser profile.js may be missing/stale; run scripts/build_profile.py')
    print('VitaMorph Studio — Public profile audit')
    print(f'Publications: {len(pub)} | Metrics: {len(metrics)} | Strict public check: {strict}')
    for m in issues: print('ERROR:', m)
    for m in warnings: print('NOTE:', m)
    print('PASS: no blocking errors' if not issues else f'FAIL: {len(issues)} blocking error(s)')
    return not issues

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--public', action='store_true', help='Disallow placeholder names and unsourced metrics')
    args = parser.parse_args()
    raise SystemExit(0 if run(args.public) else 1)

