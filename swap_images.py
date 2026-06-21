#!/usr/bin/env python3
"""
APEX Nexus — Image URL Swap Script
------------------------------------
Injects curated image URLs into:
  - app/data/seed.js      (23 Presidential Directive cards)
  - app/components/Landing.jsx  (hero background)

Usage:
  python swap_images.py               # dry run — shows what will change
  python swap_images.py --apply       # writes changes to disk
  python swap_images.py --apply --verbose  # writes + prints each substitution

Run from the project root (the folder containing /app).
"""

import re
import sys
import shutil
from pathlib import Path
from datetime import datetime

# ─────────────────────────────────────────────
#  IMAGE URL MAP
#  Keys: directive ID or "HERO" for Landing.jsx
#  Values: direct image URLs
# ─────────────────────────────────────────────
IMAGE_URLS = {
    # ── Landing page hero ────────────────────
    "HERO":   "https://upload.wikimedia.org/wikipedia/commons/c/cc/Parliament-Of-Uganda.JPG",

    # ── Presidential Directive cards ─────────
    "PD-001": "https://tse3.mm.bing.net/th/id/OIP.3G1B6XHYDB2Zj6lxuLT8hQHaE8?r=0&cb=thfvnextfalcon2&rs=1&pid=ImgDetMain&o=7&rm=3",
    "PD-002": "https://presidentialinitiatives.go.ug/wp-content/uploads/2024/11/image-31.png",
    "PD-003": "https://sp-ao.shortpixel.ai/client/to_webp,q_glossy,ret_img,w_800,h_445/https://ugandaupdatenews.com/wp-content/uploads/2022/08/muse.jpg",
    "PD-004": "https://www.independent.co.ug/wp-content/uploads/2020/06/gulu.jpg",
    "PD-005": "https://awagha.org/public/images/new.jpg",
    "PD-006": "https://ugandainvest.go.ug/wp-content/uploads/2025/09/Tilenga-1-scaled.jpg",
    "PD-007": "https://nilepost.co.ug/new_cms/wp-content/uploads/2025/11/Group-photo-of-Uganda-delegation-at-official-booth.jpg",
    "PD-008": "https://tse3.mm.bing.net/th/id/OIP.akoIMCkP-q6uaFdseHUepgHaE8?r=0&cb=thfvnextfalcon2&rs=1&pid=ImgDetMain&o=7&rm=3",
    "PD-009": "https://tse3.mm.bing.net/th/id/OIP.oYnhUPdykF4yJHdKM-nSrgHaE5?r=0&cb=thfvnextfalcon2&rs=1&pid=ImgDetMain&o=7&rm=3",
    "PD-010": "https://nilepost.co.ug/wp-content/uploads/2021/04/Namugerwa-right-particpating-in-a-demo-on-climate-change.jpg",
    "PD-011": "https://softpower.ug/wp-content/uploads/2025/09/G13hqR3WcAA1Rk1.jpeg",
    "PD-012": "https://newvision-media.s3.amazonaws.com/cms/47739d18-c3ef-49b0-a2b3-c4c6c8005637.jpg",
    "PD-013": "https://www.independent.co.ug/wp-content/uploads/2017/12/Ugs-real-estates-2-1.jpg",
    "PD-014": "https://thfvnext.bing.com/th/id/R.f386f8198d3de2db0ffd2d0dfd405492?rik=Gj7kuZzrFJdi5g&riu=http%3a%2f%2fwww.igg.go.ug%2fstatic%2fimages%2fgallery%2fAnti-Corruption_Youth_Team_Uganda.jpg&ehk=pA9uo1tCi%2ftnmvwkH4qBZi2atMT103Pagd9V2hpamAY%3d&risl=&pid=ImgRaw&r=0",
    "PD-015": "https://justice.go.ug/wp-content/uploads/2022/03/0W2A0970-scaled.jpg",
    "PD-016": "https://static.africa-press.net/uganda/sites/34/2025/09/sm_1758077845.773744.jpg",
    "PD-017": "https://tse1.mm.bing.net/th/id/OIP.6iNwk2snrv5Vj0pM16nv-wHaEK?r=0&cb=thfvnextfalcon2&rs=1&pid=ImgDetMain&o=7&rm=3",
    "PD-018": "https://ntv.co.ug/wp-content/uploads/2025/12/Screenshot-2025-12-03-at-10.04.23-PM.png",
    "PD-019": "https://www.independent.co.ug/wp-content/uploads/2024/12/Diaspora-munyonyo-4.jpg",
    "PD-020": "https://nilepost.co.ug/new_cms/wp-content/uploads/2025/08/WhatsApp-Image-2025-08-01-at-11.05.38.jpeg",
    "PD-021": "https://ugandabaati.com/wp-content/uploads/2022/09/Pic4.jpeg",
    "PD-022": "https://www.vng-international.nl/app/data/uploads/2024/12/IMG-20221021-WA0000.jpg",
    "PD-023": "https://wipc.org/wp-content/uploads/2020/05/TJ-Tweetchat-01-1-1400x700.jpg",
}

# ─────────────────────────────────────────────
#  FILE PATHS  (relative to project root)
# ─────────────────────────────────────────────
SEED_PATH    = Path("app/data/seed.js")
LANDING_PATH = Path("app/components/Landing.jsx")


def backup(path: Path) -> Path:
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    bak = path.with_suffix(path.suffix + f".bak_{ts}")
    shutil.copy2(path, bak)
    return bak


def patch_seed(content: str, dry_run: bool, verbose: bool) -> tuple[str, int]:
    """
    Walk through each directive block in seed.js.
    Locate the `image:` field that follows each `id: 'PD-XXX'` and replace its value.
    Returns (new_content, change_count).
    """
    changes = 0
    lines = content.splitlines(keepends=True)
    result = []
    current_id = None

    for line in lines:
        # Detect directive id
        id_match = re.search(r"id:\s*'(PD-\d+)'", line)
        if id_match:
            current_id = id_match.group(1)

        # Detect image field while we have an active directive id
        if current_id and re.match(r"\s*image:\s*'[^']*'\s*,?\s*$", line):
            new_url = IMAGE_URLS.get(current_id)
            if new_url:
                new_line = re.sub(r"(image:\s*)'[^']*'", f"\\1'{new_url}'", line)
                if new_line != line:
                    changes += 1
                    if verbose:
                        m = re.search(r"image:\s*'([^']*)'", line)
                        old_val = (m.group(1) if m and m.group(1) else "(empty)")
                        print(f"  {current_id}: '{old_val}' → '{new_url}'")
                    line = new_line
            current_id = None  # consume — each directive has one image field

        result.append(line)

    return "".join(result), changes


def patch_landing(content: str, dry_run: bool, verbose: bool) -> tuple[str, int]:
    """
    Replace the UGANDA_PARLIAMENT_IMG constant value in Landing.jsx.
    """
    new_url = IMAGE_URLS["HERO"]
    new_content = re.sub(
        r"(const UGANDA_PARLIAMENT_IMG\s*=\s*)'[^']*'",
        f"\\1'{new_url}'",
        content
    )
    changed = int(new_content != content)
    if changed and verbose:
        old = re.search(r"const UGANDA_PARLIAMENT_IMG\s*=\s*'([^']*)'", content)
        print(f"  HERO: '{old.group(1) if old else '?'}' → '{new_url}'")
    return new_content, changed


def main():
    apply   = "--apply"   in sys.argv
    verbose = "--verbose" in sys.argv

    mode = "APPLY" if apply else "DRY RUN"
    print(f"\n{'─'*55}")
    print(f"  APEX Nexus Image Swap  [{mode}]")
    print(f"{'─'*55}\n")

    total_changes = 0

    for path, patcher, label in [
        (SEED_PATH,    patch_seed,    "seed.js"),
        (LANDING_PATH, patch_landing, "Landing.jsx"),
    ]:
        if not path.exists():
            print(f"  ✗ Not found: {path}  (run from project root)\n")
            continue

        content = path.read_text(encoding="utf-8")
        new_content, changes = patcher(content, dry_run=not apply, verbose=verbose)
        total_changes += changes

        if apply and changes:
            bak = backup(path)
            path.write_text(new_content, encoding="utf-8")
            print(f"  ✓ {label}: {changes} substitution(s) — backup → {bak.name}")
        elif apply and not changes:
            print(f"  ○ {label}: already up to date, no changes written")
        else:
            print(f"  ~ {label}: {changes} substitution(s) would be made (dry run)")

    print(f"\n  Total: {total_changes} substitution(s)\n")

    if not apply:
        print("  → Re-run with --apply to write changes.\n")
    else:
        print("  → Done. Restart your dev server to see images.\n")


if __name__ == "__main__":
    main()
