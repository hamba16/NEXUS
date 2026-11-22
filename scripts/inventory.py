"""Generate a reproducible inventory without reading secret-bearing files."""
import hashlib
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
paths = sorted(p for folder in ("app", "public") for p in (root / folder).rglob("*") if p.is_file())
paths += [root / p for p in ("package.json", "next.config.mjs", "tailwind.config.js", "postcss.config.js", "swap_images.py") if (root / p).exists()]
records = []
for path in paths:
    data = path.read_bytes()
    content = data.decode("utf-8", errors="replace") if path.suffix in {".js", ".jsx", ".css", ".py", ".html", ".json", ".mjs"} else ""
    records.append({"path": path.relative_to(root).as_posix(), "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(), "imports": re.findall(r"(?:from|import)\s+['\"]([^'\"]+)", content), "env_names": sorted(set(re.findall(r"process\.env\.([A-Z_]+)", content))), "external_urls": sorted(set(re.findall(r"https?://[^\s'\"<>`]+", content)))})
dest = root / "docs/release/baseline/inventory.json"
dest.parent.mkdir(parents=True, exist_ok=True)
dest.write_text(json.dumps(records, indent=2), encoding="utf-8")
print(f"Inventoried {len(records)} files: {dest}")
