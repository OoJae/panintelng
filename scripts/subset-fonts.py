"""
Builds self-hosted webfont subsets — the single biggest performance win here.

The site was shipping the full latin range of three VARIABLE faces: 140.4 kB on
first paint, more than half the page weight. Two reductions, neither of which
changes a single rendered pixel:

  1. INSTANCE the axes down to what the CSS asks for. Archivo ships a width axis
     spanning 62-125, but the site only ever sets 106-108% — so the width is
     baked in at 108 and the axis dropped. That alone takes Archivo from 88 kB
     to 16.5 kB, because a two-axis font stores deltas for every combination.
  2. SUBSET to the characters that can actually appear.

Display and mono only ever render copy we wrote, so they carry the site's own
glyph set. The body face also renders whatever a visitor types into the enquiry
form, so it keeps Latin-1 and Latin Extended-A — a few kB that means "José" or
"Côte d'Ivoire" never falls back to a system font.

Run: npm run brand:fonts
"""
import os
import pathlib
import subprocess
import sys
import tempfile

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

SRC = pathlib.Path("node_modules/@fontsource-variable")
OUT = pathlib.Path("public/fonts")

# Punctuation the site actually uses: en/em dashes, curly quotes, ellipsis,
# the → in buttons, × · © ® ™.
SITE_GLYPHS = (
    "U+0020-007E,U+00A0,U+2010-2015,U+2018-201A,U+201C-201E,"
    "U+2026,U+2192,U+00D7,U+00B7,U+00A9,U+00AE,U+2122"
)
# Body face additionally covers accented European characters for form input.
BODY_GLYPHS = SITE_GLYPHS + ",U+00A1-00FF,U+0100-017F"

FACES = [
    # name, source, axis limits (pin or narrow), unicode set
    # Archivo: CSS sets weight 600-700 and width 106-108% only.
    ("archivo", "archivo/files/archivo-latin-standard-normal.woff2",
     {"wdth": 108, "wght": (500, 800)}, SITE_GLYPHS),
    # Instrument Sans: body copy at 400, labels at 500-600.
    ("instrument-sans", "instrument-sans/files/instrument-sans-latin-wght-normal.woff2",
     {"wght": (400, 600)}, BODY_GLYPHS),
    # Martian Mono: eyebrows, tags and specification figures at 500.
    ("martian-mono", "martian-mono/files/martian-mono-latin-wght-normal.woff2",
     {"wght": (500, 600)}, SITE_GLYPHS),
]


def build(name: str, rel: str, limits: dict, unicodes: str) -> tuple[int, int, int]:
    src = SRC / rel
    if not src.exists():
        raise SystemExit(f"missing source font: {src}")

    font = TTFont(src)
    font.flavor = None  # woff2 -> raw tables so the instancer can work
    instancer.instantiateVariableFont(font, limits, inplace=True, updateFontNames=False)

    tmp = tempfile.mktemp(suffix=".ttf")
    font.save(tmp)

    dest = OUT / f"{name}.woff2"
    subprocess.run(
        [sys.executable, "-m", "fontTools.subset", tmp,
         f"--unicodes={unicodes}",
         "--flavor=woff2",
         # kern matters for the wide display setting; tnum keeps figures aligned
         # in the specification tables.
         "--layout-features=kern,liga,calt,tnum",
         "--no-hinting", "--desubroutinize",
         f"--output-file={dest}"],
        check=True, capture_output=True,
    )
    os.unlink(tmp)
    return src.stat().st_size, dest.stat().st_size, len(TTFont(dest).getGlyphOrder())


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    before = after = 0
    for name, rel, limits, unicodes in FACES:
        o, n, glyphs = build(name, rel, limits, unicodes)
        before += o
        after += n
        print(f"  {name:16} {o/1024:6.1f} kB -> {n/1024:5.1f} kB   {glyphs:4d} glyphs")
    print(f"  {'TOTAL':16} {before/1024:6.1f} kB -> {after/1024:5.1f} kB   "
          f"({(before - after)/1024:.1f} kB off first paint)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
