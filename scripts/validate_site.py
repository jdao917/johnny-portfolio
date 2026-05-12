import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]

errors = []

REQUIRED_PATHS = [
    "index.html",
    "styles.css",
    "script.js",
    "projects",
    "docs",
    "data",
]

REQUIRED_DEMO_KEYS = [
    "title",
    "summary",
    "steps",
    "logs",
    "metrics",
    "table",
    "architecture",
]

BLOCKED_TERMS = [
    "UMass",
    "umasschan",
    "research-prod",
    "forhealth",
]

SECRET_PATTERNS = [
    r"\b\d{12}\b",                         # possible AWS account ID
    r"\bAKIA[0-9A-Z]{16}\b",               # AWS access key
    r"\bASIA[0-9A-Z]{16}\b",               # AWS temp access key
    r"aws_secret_access_key\s*=",
    r"password\s*=",
    r"BEGIN PRIVATE KEY",
]


def add_error(message):
    errors.append(message)


def should_skip_link(link):
    return (
        not link
        or link.startswith("#")
        or link.startswith("mailto:")
        or link.startswith("tel:")
        or link.startswith("http://")
        or link.startswith("https://")
        or link.startswith("javascript:")
    )


def resolve_local_path(source_file, link):
    clean_link = unquote(link.split("#", 1)[0].split("?", 1)[0])

    if should_skip_link(clean_link):
        return None

    if not clean_link:
        return None

    return (source_file.parent / clean_link).resolve()


print("Validating portfolio site...")

# Required files/folders
for required in REQUIRED_PATHS:
    path = ROOT / required
    if not path.exists():
        add_error(f"Missing required path: {required}")

# JSON validation
for json_file in sorted((ROOT / "data").glob("*.json")):
    try:
        data = json.loads(json_file.read_text(encoding="utf-8"))
    except Exception as exc:
        add_error(f"Invalid JSON: {json_file.relative_to(ROOT)} - {exc}")
        continue

    missing_keys = [key for key in REQUIRED_DEMO_KEYS if key not in data]
    if missing_keys:
        add_error(f"{json_file.relative_to(ROOT)} missing keys: {', '.join(missing_keys)}")

# HTML link validation
html_files = list(ROOT.glob("*.html")) + list((ROOT / "projects").glob("*.html")) + list((ROOT / "docs").glob("*.html"))

for html_file in html_files:
    text = html_file.read_text(encoding="utf-8")

    links = re.findall(r'(?:href|src|data-demo-file)=["\']([^"\']+)["\']', text)

    for link in links:
        target = resolve_local_path(html_file, link)

        if target is None:
            continue

        if not str(target).startswith(str(ROOT)):
            add_error(f"{html_file.relative_to(ROOT)} links outside repo: {link}")
            continue

        if not target.exists():
            add_error(f"{html_file.relative_to(ROOT)} has broken link: {link}")

# Project page navigation check
for project_file in sorted((ROOT / "projects").glob("*.html")):
    text = project_file.read_text(encoding="utf-8")
    if "../index.html#projects" not in text:
        add_error(f"{project_file.relative_to(ROOT)} missing Back to Projects link")

# Sensitive term / secret scan
scan_extensions = {".html", ".js", ".css", ".json", ".md"}

for file_path in ROOT.rglob("*"):
    if ".git" in file_path.parts:
        continue

    if file_path.suffix.lower() not in scan_extensions:
        continue

    text = file_path.read_text(encoding="utf-8", errors="ignore")
    rel = file_path.relative_to(ROOT)

    for term in BLOCKED_TERMS:
        if re.search(re.escape(term), text, re.IGNORECASE):
            add_error(f"Blocked term found in {rel}: {term}")

    for pattern in SECRET_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            add_error(f"Possible secret/account value found in {rel}: {pattern}")

if errors:
    print("")
    print("Validation failed:")
    for error in errors:
        print(f" - {error}")
    sys.exit(1)

print("Validation passed.")
print("Checked required files, JSON, local links, project navigation, and sensitive terms.")
