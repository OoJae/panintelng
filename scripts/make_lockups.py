"""
Panintel wordmark and lockups, outlined from Archivo Variable.

The identity resolves into one object: the wordmark PANINTEL carries the amber
core inside the counter of its own P. The standalone geometric mark is a
distillation of that same letter for small sizes — the two are never adjacent,
so the P never stutters.

True vector outlines (not <text>), so the assets survive print, vehicle livery,
signage and PPE without the font installed.
"""
import json, pathlib
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.misc.transform import Transform

SRC = "node_modules/@fontsource-variable/archivo/files/archivo-latin-standard-normal.woff2"

# Archivo's width axis. 100 is normal; the site's headings use 108. The logo
# stays at 100 so the letterforms match the supplied artwork.
WORDMARK_WIDTH = 100
AMBER, BONE = "#FFC000", "#F1EFEA"
_cache = {}

def inst(wght, wdth):
    k = (wght, wdth)
    if k not in _cache:
        _cache[k] = instantiateVariableFont(TTFont(SRC), {"wght": wght, "wdth": wdth}, inplace=False)
    return _cache[k]

def counter_centre(font, char):
    """Centre + size of a glyph's inner contour, in font units."""
    gs = font.getGlyphSet()
    rec = RecordingPen()
    gs[font.getBestCmap()[ord(char)]].draw(rec)
    contours, cur = [], []
    for op, args in rec.value:
        if op == "moveTo" and cur:
            contours.append(cur); cur = []
        cur.append((op, args))
    if cur:
        contours.append(cur)
    boxes = []
    for c in contours:
        bp = BoundsPen(gs)
        for op, args in c:
            getattr(bp, op)(*args)
        if bp.bounds:
            boxes.append(bp.bounds)
    inner = min(boxes, key=lambda b: (b[2] - b[0]) * (b[3] - b[1]))  # smallest = the counter
    x0, y0, x1, y1 = inner
    return (x0 + x1) / 2, (y0 + y1) / 2, min(x1 - x0, y1 - y0)

def outline(text, wght, wdth, tracking_em, cap_target):
    """(path_d, advance) scaled so cap height == cap_target."""
    font = inst(wght, wdth)
    upm, cap = font["head"].unitsPerEm, font["OS/2"].sCapHeight
    gs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font["hmtx"]
    scale, track = cap_target / cap, tracking_em * upm

    parts, x = [], 0.0
    for ch in text:
        gname = cmap[ord(ch)]
        t = Transform(scale, 0, 0, -scale, x * scale, cap_target)
        pen = SVGPathPen(gs)
        gs[gname].draw(TransformPen(pen, t))
        if (d := pen.getCommands()):
            parts.append(d)
        x += hmtx[gname][0] + track
    return " ".join(parts), (x - track) * scale

def svg(w, h, body, label):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.1f} {h:.1f}" '
            f'fill="none" role="img" aria-label="{label}">\n  <title>{label}</title>\n{body}\n</svg>\n')

out = pathlib.Path("public/brand"); out.mkdir(parents=True, exist_ok=True)
CAP = 100

# --- Primary logo: the wordmark, plain ----------------------------------
# Width 100, not 125. The artwork this is matched to derives from the company
# profile's Arial Bold, whose PANINTEL is 6.98x its cap height; Archivo at 125
# was 9.28x — a third wider, which is what read as "stretched". At 100 it is
# 7.27x, the closest natural match.
d, adv = outline("PANINTEL", 700, WORDMARK_WIDTH, -0.02, CAP)
(out / "logo-horizontal.svg").write_text(svg(adv, CAP, f'  <path d="{d}" fill="currentColor"/>', "Panintel"))

# --- Stacked logo: the full registered name ------------------------------
# The descriptor is set bold and letter-spaced to the SAME advance as the
# wordmark above it, so the two edges align exactly — as they do on the
# company profile's cover. Solving for tracking rather than eyeballing it
# means the lockup stays aligned if either string ever changes.
DESC = "PROJECTS NIGERIA LIMITED"
# Sized so the descriptor spans the wordmark at NATURAL letter-spacing rather
# than being stretched to fit — 0.347 is the ratio that lands flush.
DCAP = CAP * 0.347

def descriptor_tracking(target_w, lo=-0.02, hi=0.60):
    """Letter-spacing (em) that makes DESC exactly `target_w` wide."""
    for _ in range(60):
        mid = (lo + hi) / 2
        _, w = outline(DESC, 700, WORDMARK_WIDTH, mid, DCAP)
        if w < target_w:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2

track = descriptor_tracking(adv)
dd, dadv = outline(DESC, 700, WORDMARK_WIDTH, track, DCAP)
gap_v = CAP * 0.20
sw, sh = max(adv, dadv), CAP + gap_v + DCAP
body = "\n".join([
    f'  <path d="{d}" transform="translate({(sw - adv) / 2:.2f} 0)" fill="var(--logo-ink, currentColor)"/>',
    f'  <path d="{dd}" transform="translate({(sw - dadv) / 2:.2f} {CAP + gap_v:.2f})" '
    f'fill="var(--logo-accent, {AMBER})"/>',
])
(out / "logo-stacked.svg").write_text(svg(sw, sh, body, "Panintel Projects Nigeria Limited"))

print(json.dumps({
    "wordmark_advance": round(adv, 1),
    "descriptor_advance": round(dadv, 1),
    "descriptor_tracking_em": round(track, 4),
    "stacked": [round(sw, 1), round(sh, 1)],
}))
