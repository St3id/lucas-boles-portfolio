"""Dessins du démineur, générés case par case :

    python tools/make_podium_art.py [--preview dossier]

1. le laurier du podium (une couronne en cases de démineur, nouée par une mine,
   avec le drapeau du jeu au centre). Il est écrit en SVG dans un <template> de
   minesweeper.html, entre les repères « laurier:début » et « laurier:fin » ;
   le JavaScript le recopie sur chaque marche et l'anime branche par branche.
2. assets/og-demineur.jpg : l'image d'aperçu quand on partage le lien du démineur.

Les couleurs ne sont pas dans le SVG : minesweeper.css les donne selon la place
(or, argent, bronze, ou gris pour une place libre).
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGE = ROOT / "minesweeper.html"
OG = ROOT / "assets/og-demineur.jpg"
FONT = ROOT / "assets/fonts/archivo-var-latin.woff2"

# --- Le laurier ---------------------------------------------------------------
# Une branche (la gauche), dessinée à la main : une tige en arc et des feuilles
# de quatre cases en diagonale, alternées à l'extérieur et à l'intérieur.
# La branche droite est son miroir.
HALF, GAP = 11, 3
W = HALF * 2 + GAP            # 25 cases de large
MID = W // 2
STEM = {2: 7, 3: 6, 4: 6, 5: 5, 6: 5, 7: 4, 8: 4, 9: 4, 10: 4, 11: 4, 12: 4,
        13: 5, 14: 5, 15: 6, 16: 7, 17: 8, 18: 9}          # ligne : colonne


def outer_leaf(r):
    c = STEM[r]
    return [(c - 3, r - 1), (c - 2, r - 1), (c - 2, r), (c - 1, r)]


def inner_leaf(r):
    c = STEM[r]
    return [(c + 1, r), (c + 2, r), (c + 2, r - 1), (c + 3, r - 1)]


# du bas vers le haut : c'est l'ordre dans lequel la couronne pousse
LEAVES = [("o", 17), ("i", 15), ("o", 14), ("i", 12), ("o", 11),
          ("i", 9), ("o", 8), ("i", 6), ("o", 5)]


def sprite(text, x0, y0):
    out = {}
    for y, row in enumerate(text.strip("\n").splitlines()):
        for x, ch in enumerate(row):
            if ch != ".":
                out[(x0 + x, y0 + y)] = ch
    return out


# le drapeau du démineur : toile à gauche du mât, socle à deux marches
FLAG = sprite("""
..FFP
FFFFP
..FFP
....P
....P
...BBB
..BBBBB
""", MID - 3, 5)

# la mine qui noue les deux tiges, avec son reflet
MINE = sprite("""
..M..
.MMM.
MWMMM
.MMM.
..M..
""", MID - 2, 16)

# le point d'interrogation du démineur, pour une place libre
QUESTION = sprite("""
.QQQ.
Q...Q
....Q
..QQ.
..Q..
.....
..Q..
""", MID - 2, 5)


def branch_segments():
    """Segments de la branche gauche, du bas vers le haut : chaque feuille avec
    le morceau de tige qui la porte. Renvoie [(index, {case: 'o'|'i'|'s'})]."""
    rows = [r for _, r in LEAVES]
    segs = []
    for k, (kind, r) in enumerate(LEAVES):
        cells = {c: kind for c in (outer_leaf(r) if kind == "o" else inner_leaf(r))}
        lower = rows[k - 1] if k else 99
        for sr, sc in STEM.items():
            if r <= sr < lower or (k == 0 and sr >= r):
                cells[(sc, sr)] = "s"
        segs.append(cells)
    # la pointe : la tige du haut et la dernière feuille
    tip = {(7, 1): "o", (8, 0): "o", (8, 1): "o"}
    for sr, sc in STEM.items():
        if sr < rows[-1]:
            tip[(sc, sr)] = "s"
    segs.append(tip)
    return segs


def mirror(cells):
    return {(W - 1 - x, y): k for (x, y), k in cells.items()}


# --- SVG ----------------------------------------------------------------------
U, SQ = 10, 8                 # une case = 10 unités, carré de 8 : 2 unités de joint


def path(cells):
    return "".join(f"M{x * U + 1} {y * U + 1}h{SQ}v{SQ}h-{SQ}z" for x, y in sorted(cells, key=lambda c: (c[1], c[0])))


def svg():
    segs = branch_segments()
    parts = []
    for side, transform in (("l", lambda c: c), ("r", mirror)):
        for k, seg in enumerate(segs):
            seg = transform(seg)
            inner = "".join(
                f'<path class="lr-{kind}" d="{path([c for c, v in seg.items() if v == kind])}"/>'
                for kind in "soi" if any(v == kind for v in seg.values()))
            parts.append(f'<g class="lr-seg lr-{side}" data-k="{k}">{inner}</g>')
    mine = (f'<g class="lr-mine"><path d="{path([c for c, v in MINE.items() if v == "M"])}"/>'
            f'<path class="lr-glint" d="{path([c for c, v in MINE.items() if v == "W"])}"/></g>')
    flag = (f'<g class="lr-flag"><path class="lr-cloth" d="{path([c for c, v in FLAG.items() if v == "F"])}"/>'
            f'<path class="lr-pole" d="{path([c for c, v in FLAG.items() if v in "PB"])}"/></g>')
    question = f'<path class="lr-q" d="{path(QUESTION)}"/>'
    h = 1 + max(y for y in STEM)
    return (f'<svg class="ms-laurel" viewBox="0 0 {W * U} {(h + 2) * U}" aria-hidden="true" focusable="false">'
            + "".join(parts) + mine + flag + question + "</svg>")


def inject(markup):
    html = PAGE.read_text(encoding="utf-8")
    start, end = "<!-- laurier:début -->", "<!-- laurier:fin -->"
    a, b = html.index(start) + len(start), html.index(end)
    indent = html[:html.index(start)].rsplit("\n", 1)[1]
    new = html[:a] + f'\n{indent}<template id="ms-laurel-tpl">{markup}</template>\n{indent}' + html[b:]
    if new != html:
        PAGE.write_text(new, encoding="utf-8")
        print("minesweeper.html : laurier mis à jour")


# --- Rendu bitmap (aperçu et image de partage) ---------------------------------
GOLD = {"o": (230, 184, 32), "i": (196, 150, 18), "s": (125, 94, 16)}
INK, RED, PAPER = (17, 24, 20), (210, 52, 44), (242, 242, 238)


def all_cells(theme=GOLD, empty=False):
    cells = {}
    for seg in branch_segments():
        for c, kind in list(seg.items()) + list(mirror(seg).items()):
            cells[c] = theme[kind]
    if empty:
        cells.update({c: (150, 156, 148) for c in QUESTION})
        return cells
    cells.update({c: (INK if v == "M" else PAPER) for c, v in MINE.items()})
    cells.update({c: (RED if v == "F" else INK) for c, v in FLAG.items()})
    return cells


def draw_cells(draw, cells, x0, y0, size, square):
    pad = (size - square) / 2
    for (x, y), col in cells.items():
        draw.rectangle([x0 + x * size + pad, y0 + y * size + pad,
                        x0 + x * size + pad + square - 1, y0 + y * size + pad + square - 1], fill=col)


def og_image():
    from PIL import Image, ImageDraw, ImageFont
    img = Image.new("RGB", (1200, 630), INK)
    d = ImageDraw.Draw(img)
    # panneau clair à droite, le laurier en grand
    d.rectangle([760, 0, 1200, 630], fill=(228, 230, 223))
    size = 16
    ex = 760 + (440 - W * size) // 2
    ey = (630 - 21 * size) // 2 - 10
    draw_cells(d, all_cells(), ex, ey, size, 13)

    def font(px, weight, width):
        f = ImageFont.truetype(str(FONT), px)
        f.set_variation_by_axes([weight, width])
        return f

    d.text((64, 160), "Démineur", font=font(104, 850, 125), fill=PAPER)
    d.text((66, 345), "Jouable dans le navigateur,", font=font(38, 500, 100), fill=PAPER)
    d.text((66, 392), "avec un classement en ligne.", font=font(38, 500, 100), fill=PAPER)
    d.text((66, 470), "Lucas Boles", font=font(32, 700, 110), fill=(127, 209, 174))
    img.save(OG, quality=88, optimize=True, progressive=True)
    print(f"{OG.relative_to(ROOT)} : {OG.stat().st_size // 1024} Ko")


def preview(folder):
    from PIL import Image, ImageDraw
    themes = [GOLD, {"o": (184, 190, 182), "i": (150, 157, 149), "s": (96, 103, 98)},
              {"o": (205, 140, 90), "i": (172, 110, 66), "s": (112, 70, 40)},
              {"o": (213, 216, 207), "i": (213, 216, 207), "s": (200, 204, 194)}]
    size = 12
    img = Image.new("RGB", (4 * (W + 2) * size, 23 * size), PAPER)
    d = ImageDraw.Draw(img)
    for n, th in enumerate(themes):
        draw_cells(d, all_cells(th, empty=n == 3), n * (W + 2) * size + size, size, size, size - 2)
    out = Path(folder) / "laurier-apercu.png"
    img.save(out)
    print(out)


if __name__ == "__main__":
    inject(svg())
    og_image()
    if "--preview" in sys.argv:
        preview(sys.argv[sys.argv.index("--preview") + 1])
