"""One-time, scoped retirement of mapped legacy demo scaffolding."""
from pathlib import Path

root = Path(__file__).resolve().parents[1]
replacements = {
    "Irene Mulyagonja": "Esther Namuli",
    "Joseph Muvawala": "Daniel Ocen",
    "Hon. Bahati D.": "Moses Kato",
    "Dr. Jane Aceng": "Lydia Auma",
    "James Saaka": "Peter Waiswa",
    "Directorate for Strategy & Execution Monitoring and Results": "Directorate of Socio-Economic Monitoring and Research",
    "DSEMR, OPM": "DSEMR, Office of the President",
    "OPM — Field Verification": "DSEMR — Field Verification",
}
for relative in ("app/data/seed.js", "app/components/SecretariatView.jsx"):
    path = root / relative
    text = path.read_text(encoding="utf-8")
    for old, new in replacements.items():
        text = text.replace(old, new)
    path.write_text(text, encoding="utf-8")

# These exact files are preserved in the baseline commit.
for relative in ("app/data/seed.js.bak_20260618_092959", "app/data/seed.js.bak_20260621_113820", "app/components/Landing.jsx.bak_20260618_092959", "swap_images.py"):
    path = (root / relative).resolve()
    if not path.is_relative_to(root):
        raise RuntimeError("Path escaped repository")
    path.unlink(missing_ok=True)

path = root / "public/data-audit.html"
text = path.read_text(encoding="utf-8")
text = "\n".join(line for line in text.splitlines() if "fonts.googleapis.com" not in line)
text = text.replace("<body>", '<body><aside style="padding:20px;background:#fff1bd;color:#422006">Historical exhibition audit. Figures and directive numbering remain unverified. Simulated operational data; not an official government record.</aside>')
path.write_text(text, encoding="utf-8")
