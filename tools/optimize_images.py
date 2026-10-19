"""Génère les images du site (WebP multi-tailles, image de partage, favicons).

Usage :
    python tools/optimize_images.py <dossier des originaux>

Les originaux ne sont pas versionnés dans le site (trop lourds). Pour ajouter une
image : la déposer dans le dossier des originaux, l'ajouter à SOURCES ci-dessous,
relancer le script, puis utiliser assets/img/<slug>-<largeur>.webp dans le HTML.
Nécessite Pillow (pip install pillow).
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "img"
WIDTHS = (480, 960, 1600)
QUALITY = 78

# dessins à traits fins (schémas, routages) : moins de compression pour rester nets
QUALITY_OVERRIDE = {"rail-schema": 92, "rail-pcb": 90}

# recadrages (largeur/hauteur, centre horizontal) appliqués avant l'export
CROPS = {"portrait": (4 / 5, 0.48)}

# fichier original -> nom court utilisé sur le site
SOURCES = {
    "portrait-waga-2026.jpg": "portrait",
    "Waga_Energy_Homepage-pic_1920x957.jpg": "waga-wagabox",
    "Système Automatisé de Transport sur Rail.png": "transport-rail",
    "Projet Robot Suiveur de ligne.jpg": "robot",
    "Projet robot suiveur de ligne schéma.jpg": "robot-schema",
    "Robot suiveur de ligne photo de case.png": "robot-piste",
    "radar-veille-maquette.png": "radar-veille",
    "radar-carte-simulation.png": "radar-carte",
    "rail-schema-electrique.png": "rail-schema",
    "rail-cartes-pcb.png": "rail-pcb",
    "CEA.png": "cea",
    "Photo CNRS.jpg": "cnrs",
    "SDMR.jpg": "sdmr",
    "Background_mountain_3.jpg": "montagne-croix",
    "Escalade.jpg": "escalade",
    "Photo plongé.jpg": "plongee",
    "Photo volley.jpg": "volley",
}

INK = (17, 24, 20)
GROUND = (242, 242, 238)
ACCENT = (127, 209, 174)


def export(src: Path, slug: str) -> dict:
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    if slug in CROPS:
        ratio, cx = CROPS[slug]
        w = min(im.width, round(im.height * ratio))
        im = ImageOps.fit(im, (w, round(w / ratio)), Image.LANCZOS, centering=(cx, 0.5))
    sizes = []
    for w in WIDTHS:
        # au-delà de l'original, on exporte une dernière fois à sa taille réelle
        w = min(w, im.width)
        if sizes and w <= sizes[-1]:
            break
        h = round(im.height * w / im.width)
        im.resize((w, h), Image.LANCZOS).save(OUT / f"{slug}-{w}.webp", "WEBP", quality=QUALITY_OVERRIDE.get(slug, QUALITY), method=6)
        sizes.append(w)
    return {"w": im.width, "h": im.height, "sizes": sizes}


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(ROOT / "tools" / "fonts" / name), size)


def og_image(src_dir: Path) -> None:
    """Image de partage 1200x630 : portrait à droite, nom à gauche."""
    card = Image.new("RGB", (1200, 630), INK)
    photo = ImageOps.exif_transpose(Image.open(src_dir / "portrait-waga-2026.jpg")).convert("RGB")
    photo = ImageOps.fit(photo, (440, 630), Image.LANCZOS, centering=(0.48, 0.3))
    card.paste(photo, (760, 0))
    d = ImageDraw.Draw(card)
    d.text((64, 150), "Lucas", font=font("ArchivoExpanded-ExtraBold.ttf", 96), fill=GROUND)
    d.text((64, 255), "Boles", font=font("ArchivoExpanded-ExtraBold.ttf", 96), fill=GROUND)
    body = font("Archivo-Regular.ttf", 34)
    d.text((64, 400), "Automatisme et supervision", font=body, fill=GROUND)
    d.text((64, 446), "Alternance ingénieur dès septembre 2027", font=body, fill=ACCENT)
    card.save(ROOT / "assets" / "og-image.jpg", "JPEG", quality=85, optimize=True)


def favicons() -> None:
    """Monogramme LB pour les navigateurs qui n'utilisent pas favicon.svg."""
    for size, name in ((180, "apple-touch-icon.png"), (512, "icon-512.png"), (192, "icon-192.png")):
        im = Image.new("RGB", (size, size), INK)
        d = ImageDraw.Draw(im)
        f = font("ArchivoExpanded-ExtraBold.ttf", int(size * 0.42))
        box = d.textbbox((0, 0), "LB", font=f)
        x = (size - (box[2] - box[0])) / 2 - box[0]
        y = (size - (box[3] - box[1])) / 2 - box[1]
        d.text((x, y), "LB", font=f, fill=GROUND)
        im.save(ROOT / "assets" / name, "PNG", optimize=True)
    ico = Image.open(ROOT / "assets" / "icon-192.png")
    ico.save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src_dir = Path(sys.argv[1])
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {slug: export(src_dir / name, slug) for name, slug in SOURCES.items()}
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    og_image(src_dir)
    favicons()
    print(json.dumps(manifest, indent=1))


if __name__ == "__main__":
    main()
