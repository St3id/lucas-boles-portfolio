"""Une seule commande après chaque modification du site :

    python tools/build.py

1. génère en/index.html depuis index.html (s'arrête si une traduction manque) ;
2. met à jour les empreintes ?v= des CSS et JS (contre le cache des navigateurs) ;
3. met la date du jour dans sitemap.xml.
"""
import datetime
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"


def run(script, *args):
    result = subprocess.run([sys.executable, str(TOOLS / script), *args], cwd=ROOT)
    if result.returncode:
        sys.exit(f"Arrêt : {script} a échoué, rien n'a été mis à jour après lui.")


run("build_en.py", ".")
run("version_assets.py")
today = datetime.date.today().isoformat()
sitemap = ROOT / "sitemap.xml"
sitemap.write_text(re.sub(r"<lastmod>[^<]*</lastmod>", f"<lastmod>{today}</lastmod>", sitemap.read_text(encoding="utf-8")), encoding="utf-8")
print(f"sitemap.xml daté du {today}")
