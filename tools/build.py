"""Une seule commande après chaque modification du site :

    python tools/build.py

1. recopie le cœur du démineur (ms-core.js) dans le serveur du classement ;
   génère en/index.html depuis index.html (s'arrête si une traduction manque) ;
2. met à jour les empreintes ?v= des CSS et JS (contre le cache des navigateurs) ;
3. date dans sitemap.xml les seules pages qui ont changé (empreinte gardée dans
   tools/sitemap-hashes.json), pour que la date reste un signal fiable.
"""
import datetime
import hashlib
import json
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


# le cœur du démineur doit être identique dans le jeu et sur le serveur du classement
core = (ROOT / "assets/js/ms-core.js").read_text(encoding="utf-8")
block = core[core.index("// --- CORE START"):core.index("// --- CORE END")]
worker_path = ROOT / "leaderboard/worker.js"
worker = worker_path.read_text(encoding="utf-8")
synced = worker[:worker.index("// --- CORE START")] + block + worker[worker.index("// --- CORE END"):]
if synced != worker:
    worker_path.write_text(synced, encoding="utf-8")
    print("leaderboard/worker.js : cœur du démineur mis à jour (à recoller dans Cloudflare)")

run("build_en.py", ".")
run("version_assets.py")
today = datetime.date.today().isoformat()
BASE = "https://st3id.github.io/lucas-boles-portfolio/"
PAGES = {"": "index.html", "en/": "en/index.html", "minesweeper.html": "minesweeper.html",
         "mentions-legales.html": "mentions-legales.html", "confidentialite.html": "confidentialite.html"}
hash_file = TOOLS / "sitemap-hashes.json"
hashes = json.loads(hash_file.read_text(encoding="utf-8")) if hash_file.exists() else {}
sitemap = ROOT / "sitemap.xml"
xml = sitemap.read_text(encoding="utf-8")
changed = []
for path, file in PAGES.items():
    digest = hashlib.sha1((ROOT / file).read_bytes()).hexdigest()
    if hashes.get(path) == digest:
        continue
    hashes[path] = digest
    changed.append(path or "/")
    loc = re.escape(f"<loc>{BASE}{path}</loc>")
    xml, n = re.subn(loc + r"(\s*)<lastmod>[^<]*</lastmod>", lambda m: m.group(0)[:m.group(0).index("<lastmod>")] + f"<lastmod>{today}</lastmod>", xml)
    if not n:
        sys.exit(f"Arrêt : {BASE}{path} manque dans sitemap.xml.")
sitemap.write_text(xml, encoding="utf-8")
hash_file.write_text(json.dumps(hashes, indent=1) + "\n", encoding="utf-8")
print(f"sitemap.xml : {', '.join(changed) if changed else 'aucune page modifiée'}" + (f" datée(s) du {today}" if changed else ""))
