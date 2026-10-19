# Portfolio Lucas Boles

Site statique publié par GitHub Pages : https://st3id.github.io/lucas-boles-portfolio/

Pas de framework ni d'étape de build : on modifie les fichiers HTML, on pousse sur `main`, c'est en ligne.

## Structure

```
index.html               page d'accueil (français, source du contenu)
en/index.html            version anglaise, générée par tools/build_en.py
mentions-legales.html    mentions légales
confidentialite.html     politique de confidentialité (RGPD)
404.html                 page d'erreur (chemins absolus, servie pour toute adresse inconnue)
minesweeper.html         démineur
assets/css/main.css      styles (tokens de couleur et de typo en tête de fichier)
assets/js/main.js        menu mobile, animations, radar, démo ferroviaire, mesure d'audience
assets/vendor/           GSAP 3.13 + ScrollTrigger, hébergés ici (aucun CDN)
assets/fonts/            police Archivo (variable), hébergée ici (pas de Google Fonts)
assets/img/              images WebP générées par tools/optimize_images.py
assets/docs/             CV et analyse fonctionnelle (PDF)
sitemap.xml, robots.txt, site.webmanifest, favicon.*
_config.yml              exclut CLAUDE.md, README.md et tools/ du site publié
```

## Tâches courantes

**Mettre à jour le CV** : exporter le PDF depuis Canva et remplacer `assets/docs/cv-lucas-boles.pdf` (garder ce nom).

**Modifier un texte** : éditer `index.html`, reporter la traduction dans la table `R` de `tools/build_en.py`, puis :

```
python tools/build_en.py .
```

Le script affiche `MISSING` pour chaque phrase française qu'il ne retrouve plus.

**Ajouter une image** : déposer l'original dans `../lucas-boles-portfolio-originaux/`, l'ajouter à `SOURCES` dans `tools/optimize_images.py`, puis :

```
python tools/optimize_images.py ../lucas-boles-portfolio-originaux
```

Le script produit `assets/img/<nom>-480.webp`, `-960.webp`, `-1600.webp`, l'image de partage `assets/og-image.jpg` et les icônes. Toujours renseigner `width`, `height` et `alt` dans le HTML.

**Activer les statistiques** : créer un compte gratuit sur https://www.goatcounter.com, puis mettre le code choisi dans `GOATCOUNTER_CODE` en haut de `assets/js/main.js`. Sans cookie, donc sans bannière.

**Mettre à jour le sitemap** : changer les dates `lastmod` de `sitemap.xml` après une modification importante.

## Tester en local

```
python -m http.server 8000
```

puis ouvrir http://localhost:8000.
