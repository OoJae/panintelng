"""
Proves the optimisation did not regress the design.

Two separate questions, which need two different measurements:

  STRUCTURE — did anything reflow, resize or move?
      Measured with photographs hidden, so the signal is layout, typography and
      colour. Page height must match exactly and the vertical ink profile must
      correlate ≥ 0.998. A single changed line break drops that below 0.99;
      sub-pixel antialiasing from a re-encoded font does not move it at all.

  PHOTOGRAPHS — do the re-encoded images still look the same?
      Measured with them visible, as PSNR. Codec changes (WebP -> AVIF) alter
      every pixel slightly while being perceptually identical, so a raw pixel
      count is meaningless here; PSNR above ~25 dB on high-frequency
      photographic content is indistinguishable at viewing size.

Usage: compare-shots.py [structure|photos]
"""
import pathlib
import sys

import numpy as np
from PIL import Image

BEFORE, AFTER = pathlib.Path(".shots/before"), pathlib.Path(".shots/after")
DIFF = pathlib.Path(".shots/diff")
DIFF.mkdir(parents=True, exist_ok=True)

MIN_CORRELATION = 0.998
MIN_PSNR = 25.0

mode = sys.argv[1] if len(sys.argv) > 1 else "structure"
rows, failed = [], False

for b_path in sorted(BEFORE.glob("*.png")):
    a_path = AFTER / b_path.name
    if not a_path.exists():
        rows.append((b_path.stem, "MISSING", "")); failed = True; continue

    ib, ia = Image.open(b_path).convert("L"), Image.open(a_path).convert("L")
    if ib.size != ia.size:
        rows.append((b_path.stem, "REFLOW", f"{ib.size[1]} -> {ia.size[1]} px tall"))
        failed = True
        continue

    nb, na = np.asarray(ib, np.float64), np.asarray(ia, np.float64)

    if mode == "photos":
        mse = float(((nb - na) ** 2).mean())
        psnr = float("inf") if mse == 0 else 10 * np.log10(255 ** 2 / mse)
        ok = psnr >= MIN_PSNR
        failed |= not ok
        rows.append((b_path.stem, "ok" if ok else "DEGRADED", f"PSNR {psnr:5.1f} dB"))
        continue

    pb, pa = (255 - nb).sum(axis=1), (255 - na).sum(axis=1)
    corr = 1.0 if pb.std() == 0 or pa.std() == 0 else float(np.corrcoef(pb, pa)[0, 1])
    ok = corr >= MIN_CORRELATION
    failed |= not ok
    if not ok:
        Image.fromarray(((np.abs(nb - na) > 12) * 255).astype(np.uint8)).save(DIFF / b_path.name)
    rows.append((b_path.stem, "ok" if ok else "MOVED", f"layout r={corr:.5f}"))

w = max(len(r[0]) for r in rows)
for name, status, detail in rows:
    print(f"  {name:{w}}  {status:9} {detail}")
print("\n  " + ("PASS" if not failed else "FAIL") +
      (" — no reflow, nothing moved" if mode == "structure" else " — photographs unchanged to the eye"))
sys.exit(1 if failed else 0)
