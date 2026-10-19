"""Ajoute une empreinte du contenu aux liens vers main.css et main.js (?v=...).

Usage : python tools/version_assets.py

Sans cela, un navigateur peut garder l'ancienne feuille de style en cache et
l'appliquer à une nouvelle page : la mise en page se casse. À relancer après
chaque modification de assets/css/main.css ou assets/js/main.js.
"""
import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ["assets/css/main.css", "assets/js/main.js"]
PAGES = ["index.html", "en/index.html", "mentions-legales.html", "confidentialite.html", "404.html"]


def main() -> None:
    versions = {a: hashlib.sha1((ROOT / a).read_bytes()).hexdigest()[:8] for a in ASSETS}
    for page in PAGES:
        path = ROOT / page
        html = path.read_text(encoding="utf-8")
        for asset, version in versions.items():
            # le lien peut être relatif (../assets), absolu (/lucas-boles-portfolio/assets) ou déjà versionné
            html = re.sub(r'((?:\.\./|/lucas-boles-portfolio/)?' + re.escape(asset) + r')(\?v=[0-9a-f]+)?"',
                          r'\1?v=' + version + '"', html)
        path.write_text(html, encoding="utf-8")
    print(versions)


if __name__ == "__main__":
    main()
