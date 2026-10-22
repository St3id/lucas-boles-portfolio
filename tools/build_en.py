"""Génère en/index.html à partir de index.html (table de traductions ci-dessous).

Usage : python tools/build_en.py .
Après une modification du texte français, ajouter ou corriger la ligne correspondante dans R :
le script signale chaque phrase française qu'il ne retrouve plus (MISSING).
"""
import re
import sys

root = sys.argv[1]
s = open(root + '/index.html', encoding='utf-8').read()

# chemins relatifs depuis /en/
s = re.sub(r'(href|src)="(assets/|favicon|site\.webmanifest|minesweeper|mentions-legales|confidentialite)', r'\1="../\2', s)
s = re.sub(r'srcset="([^"]*)"', lambda m: 'srcset="' + re.sub(r'(^|, )assets/', r'\1../assets/', m.group(1)) + '"', s)

R = [
 ('<html lang="fr">', '<html lang="en">'),
 ('<title>Lucas Boles - Systèmes embarqués et automatisme</title>', '<title>Lucas Boles - Embedded systems and automation</title>'),
 ('content="Systèmes embarqués et automatisme. Alternant automaticien chez Waga Energy et étudiant en BUT GEII à Grenoble, je cherche une alternance ingénieur de 3 ans à partir de septembre 2027."',
  'content="Embedded systems and automation. Automation apprentice at Waga Energy and electrical engineering student in Grenoble, France, looking for a 3-year engineering degree apprenticeship from September 2027."'),
 ('<link rel="canonical" href="https://st3id.github.io/lucas-boles-portfolio/">', '<link rel="canonical" href="https://st3id.github.io/lucas-boles-portfolio/en/">'),
 ('<meta property="og:locale" content="fr_FR">\n  <meta property="og:locale:alternate" content="en_GB">', '<meta property="og:locale" content="en_GB">\n  <meta property="og:locale:alternate" content="fr_FR">'),
 ('content="Lucas Boles - Systèmes embarqués et automatisme"', 'content="Lucas Boles - Embedded systems and automation"'),
 ('content="Systèmes embarqués et automatisme. Alternant chez Waga Energy, en BUT GEII à Grenoble. Alternance ingénieur à partir de septembre 2027."',
  'content="Embedded systems and automation. Apprentice at Waga Energy, studying in Grenoble. Engineering apprenticeship from September 2027."'),
 ('<meta property="og:url" content="https://st3id.github.io/lucas-boles-portfolio/">', '<meta property="og:url" content="https://st3id.github.io/lucas-boles-portfolio/en/">'),
 ('content="Lucas Boles, systèmes embarqués et automatisme"', 'content="Lucas Boles, embedded systems and automation"'),
 ('"url": "https://st3id.github.io/lucas-boles-portfolio/",', '"url": "https://st3id.github.io/lucas-boles-portfolio/en/",'),
 ('"jobTitle": "Alternant automaticien"', '"jobTitle": "Automation apprentice"'),
 ('"knowsAbout": ["Systèmes embarqués", "Automatisme", "Supervision SCADA"', '"knowsAbout": ["Embedded systems", "Industrial automation", "SCADA"'),
 ('href="#contenu">Aller au contenu', 'href="#contenu">Skip to content'),
 ('<a class="wordmark" href="./">', '<a class="wordmark" href="./">'),
 ('aria-label="Navigation principale"', 'aria-label="Main navigation"'),
 ('<li><a href="#projets">Projets</a></li>', '<li><a href="#projets">Projects</a></li>'),
 ('<li><a href="#parcours">Parcours</a></li>', '<li><a href="#parcours">Background</a></li>'),
 ('<li><a href="#competences">Compétences</a></li>', '<li><a href="#competences">Skills</a></li>'),
 ('<li class="nav-contact"><a href="#contact">Me contacter</a></li>', '<li class="nav-contact"><a href="#contact">Get in touch</a></li>'),
 ('<a class="lang-link" href="en/" hreflang="en" lang="en" aria-label="English version">EN</a>', '<a class="lang-link" href="../" hreflang="fr" lang="fr" aria-label="Version française">FR</a>'),
 ('<a class="button" href="#contact">Me contacter</a>', '<a class="button" href="#contact">Get in touch</a>'),
 ('<p class="hero-role">Systèmes embarqués et automatisme</p>\n          <p class="lead">Alternant automaticien chez Waga Energy (automates Siemens, supervision Ignition) et étudiant en 3e année de BUT\xa0GEII. Je cherche une alternance ingénieur de 3\xa0ans pour <strong>septembre\xa02027</strong>.</p>',
  '<p class="hero-role">Embedded systems and automation</p>\n          <p class="lead">Automation apprentice at Waga Energy (Siemens PLCs, Ignition SCADA) and third-year student in electrical engineering and industrial computing. Looking for a 3-year engineering degree apprenticeship starting <strong>September 2027</strong>.</p>'),
 ('Me contacter <span class="arrow"', 'Get in touch <span class="arrow"'),
 ('download>Télécharger le CV (PDF)</a>', 'download>Download my CV (PDF, French)</a>'),
 ('<li>Crolles (38), mobile sur Grenoble, Valence, Lyon et Chambéry</li>', '<li>Based in Crolles, near Grenoble. Open to Grenoble, Valence, Lyon and Chambéry</li>'),
 ('<li>Permis B</li>', '<li>Driving licence</li>'),
 ('<li>Anglais C1</li>', '<li>English C1</li>'),
 ('alt="Portrait de Lucas Boles, bras croisés, en chemise bleu marine"', 'alt="Portrait of Lucas Boles, arms crossed, wearing a navy shirt"'),
 ('<figcaption>Une unité WAGABOX sur un site de stockage de déchets. Photo : Waga Energy</figcaption>',
  '<figcaption>A WAGABOX unit on a landfill site. Photo: Waga Energy</figcaption>'),
 ('alt="Unité WAGABOX de Waga Energy sur un site de stockage de déchets"', 'alt="Waga Energy WAGABOX unit on a landfill site"'),
 ('<p class="lead">Je travaille depuis avril 2026 au pôle EIA (Électricité, Instrumentation, Automatisme) de Waga Energy, d\'abord en stage, maintenant en alternance jusqu\'en juillet 2027.</p>',
  "<p class=\"lead\">I have been with Waga Energy's EIA team (Electrical, Instrumentation, Automation) since April 2026, first as an intern, now as an apprentice until July 2027.</p>"),
 ("<p>Waga Energy transforme le gaz de décharge en biométhane, injecté dans le réseau de gaz naturel. Fondée à Grenoble en 2015, l'entreprise épure ce gaz sur place avec ses unités WAGABOX, qui combinent filtration par membranes et distillation cryogénique. Ses unités tournent en Europe et en Amérique du Nord.</p>",
  '<p>Waga Energy turns landfill gas into biomethane that is fed into the natural gas grid. Founded in Grenoble in 2015, the company upgrades the gas on site with its WAGABOX units, which combine membrane filtration and cryogenic distillation. Its units run in Europe and North America.</p>'),
 ('<h3>Alternant automaticien</h3>', '<h3>Automation apprentice</h3>'),
 ('<p class="meta">Septembre 2026 - juillet 2027</p>', '<p class="meta">September 2026 - July 2027</p>'),
 ('<p>Déploiement de la supervision Ignition sur les PC installés sur chaque site, avec pour cible une supervision globale de toutes les unités depuis un seul endroit. Les données circulent par un broker MQTT et les services tournent dans des conteneurs Docker.</p>',
  '<p>Rolling out Ignition SCADA on the PCs installed at each site, with the goal of supervising every unit from a single place. Data flows through an MQTT broker and the services run in Docker containers.</p>'),
 ("<p>En parallèle, construction d'un démonstrateur pour l'équipe d'exploitation, à partir de l'historian Canary Labs, la base qui conserve l'historique des mesures de chaque site.</p>",
  '<p>Alongside that, building a demonstrator for the operations team on top of the Canary Labs historian, the database that keeps the measurement history of each site.</p>'),
 ('aria-label="Outils"', 'aria-label="Tools"'),
 ('<h3>Stage en automatisme</h3>', '<h3>Automation internship</h3>'),
 ('<p class="meta">Avril - juin 2026</p>', '<p class="meta">April - June 2026</p>'),
 ("<p>Intégration d'un système AMS Emerson, qui surveille les vibrations des machines, dans un automate Siemens S7-1500 via Modbus TCP. Le matériel est certifié ATEX, pour les zones à atmosphère explosive.</p>",
  '<p>Integrated an Emerson AMS, which monitors machine vibration, into a Siemens S7-1500 PLC over Modbus TCP. The equipment is ATEX certified, for explosive atmospheres.</p>'),
 ('<p>Programme en SCL sous TIA Portal, écrans de supervision sous PcVue, historisation des mesures en base SQL. Participation aux FAT (tests de réception en usine) et rédaction de la documentation technique en français et en anglais.</p>',
  '<p>SCL code in TIA Portal, PcVue supervision screens, measurements logged to an SQL database. Took part in the FATs (factory acceptance tests) and wrote the technical documentation in French and English.</p>'),
 ('Projets</h2>', 'Projects</h2>'),
 ('<h3 id="p-radar">Radar 3D en Ada/SPARK</h3>', '<h3 id="p-radar">3D radar in Ada/SPARK</h3>'),
 ('<p class="meta">Projet personnel, en cours</p>', '<p class="meta">Personal project, ongoing</p>'),
 ("<p class=\"radar-lead\">Objectif : un capteur posé dans une pièce, qui en fait une carte 3D et suit les personnes qui s'y déplacent.</p>",
  '<p class="radar-lead">The goal: a sensor placed in a room that builds a 3D map of it and tracks the people moving through it.</p>'),
 ("<p>Chaque cible suivie garde un numéro, une position et une vitesse, y compris quand deux trajectoires se croisent.</p>",
  '<p>Each tracked target keeps a number, a position and a speed, including when two paths cross.</p>'),
 ("<p>Le code est en Ada, un langage utilisé dans l'aéronautique, le spatial et le ferroviaire. La partie détection est vérifiée formellement avec SPARK.</p>",
  '<p>The code is written in Ada, a language used in aerospace, space and rail. The detection part is formally verified with SPARK.</p>'),
 ('<li>Fonctionne de bout en bout sur capteur simulé : détection, suivi, carte 3D dans le navigateur</li>',
  '<li>Works end to end on a simulated sensor: detection, tracking, 3D map in the browser</li>'),
 ('<li>Tâches temps réel (Ravenscar), tests automatiques et compilation pour microcontrôleur à chaque modification</li>',
  '<li>Real-time tasks (Ravenscar), automated tests and a microcontroller build on every change</li>'),
 ('<li>Étape suivante : le matériel (capteurs radar, carte STM32, tourelle motorisée)</li>',
  '<li>Next step: the hardware (radar sensors, STM32 board, motorised turret)</li>'),
 ('>Explorer la carte 3D</a>', '>Explore the 3D map</a>'),
 ('>Code sur GitHub</a>', '>Code on GitHub</a>'),
 ('alt="Pièce dessinée en nuage de points vert, avec trois personnes suivies et leurs flèches de vitesse"', 'alt="Room drawn as a green point cloud, with three tracked people and their speed arrows"'),
 ("<figcaption>L'objectif : la pièce en 3D et les personnes suivies par-dessus</figcaption>", '<figcaption>The goal: the room in 3D with tracked people on top</figcaption>'),
 ("alt=\"Nuage de points 3D formant les murs et le sol d'une pièce, capteur au centre\"", 'alt="3D point cloud forming the walls and floor of a room, sensor in the centre"'),
 ('<figcaption>Carte produite par mon programme, à partir du capteur simulé</figcaption>',
  '<figcaption>Map produced by my program, from the simulated sensor</figcaption>'),
 ('<h3 id="p-rail">Trafic ferroviaire miniature</h3>', '<h3 id="p-rail">Model railway traffic control</h3>'),
 ('<p class="meta">IUT 1, Université Grenoble Alpes - de 2025 à 2026, en binôme</p>',
  '<p class="meta">IUT 1, Grenoble Alpes University - 2025 to 2026, with a classmate</p>'),
 ('<p>Cartes électroniques conçues sous KiCad, commande par ESP32 et pilotage depuis une application en Wi-Fi.</p>',
  '<p>Circuit boards designed in KiCad, ESP32 control and a Wi-Fi app to drive the layout.</p>'),
 ("<p>Mes parties : la <strong>conception de l’électronique</strong> sous KiCad et la fonction <strong>choix d'une gare</strong>. Le programme calcule le plus court chemin avec l'algorithme de Dijkstra, puis commande les aiguillages pour que le train y arrive seul.</p>",
  "<p>My contributions were the <strong>electronic design</strong> in KiCad and the <strong>pick a station</strong> feature. The program computes the shortest route with Dijkstra's algorithm, then sets the switches so the train gets there on its own.</p>"),
 ("<title id=\"rail-svg-title\">Schéma d'un petit réseau ferré avec cinq gares reliées par des voies</title>", '<title id="rail-svg-title">Diagram of a small rail network with five stations linked by tracks</title>'),
 ('<p id="rail-label">Choisir une gare de destination&nbsp;:</p>', '<p id="rail-label">Pick a destination station:</p>'),
 ('Réseau fictif et simplifié, pour montrer le principe. Les nombres sont les longueurs des voies.', 'A simplified, made-up network to show the idea. Numbers are track lengths.'),
 ('alt="Schéma électrique KiCad des trois cartes : commande ESP32, puissance et capteurs"', 'alt="KiCad schematic of the three boards: ESP32 control, power and sensors"'),
 ('<figcaption>Schéma électrique sous KiCad (ouvrir en grand)</figcaption>', '<figcaption>Schematic in KiCad (open full size)</figcaption>'),
 ('alt="Routage des trois cartes électroniques sous KiCad"', 'alt="PCB layout of the three boards in KiCad"'),
 ('<figcaption>Les trois cartes : commande ESP32, puissance, capteurs, prévues pour être empilées en étages</figcaption>', '<figcaption>The three boards: ESP32 control, power, sensors, designed to be stacked</figcaption>'),
 ("alt=\"Banc d'essai du système de transport sur rail à deux chariots\"", 'alt="Test bench of the two-carriage rail transport system"'),
 ("<figcaption>Le banc d'essai de l'IUT</figcaption>", '<figcaption>The test bench at the university</figcaption>'),
 ('<h3 id="p-tsr">Transport automatisé sur rail</h3>', '<h3 id="p-tsr">Automated rail transport system</h3>'),
 ('<p class="meta">IUT 1, Université Grenoble Alpes - septembre à novembre 2025</p>',
  '<p class="meta">IUT 1, Grenoble Alpes University - September to November 2025</p>'),
 ('<p>Deux chariots transfèrent des paniers codés entre des cuves de traitement chimique.</p>', '<p>Two carriages move coded baskets between chemical treatment tanks.</p>'),
 ("<p>Analyse fonctionnelle, grafcets, gestion des alarmes et des variateurs, puis programmation d'un automate Schneider M340 sous Control Expert (Ladder) et d'une IHM sous Vijeo Designer. Validation sur banc d'essai.</p>",
  "<p>Functional analysis, GRAFCET charts, alarm and drive handling, then programming a Schneider M340 PLC in Control Expert (Ladder) and an HMI in Vijeo Designer. Validated on a test bench.</p>"),
 ("Lire l'analyse fonctionnelle (PDF, 3,9 Mo)", 'Read the functional analysis (PDF in French, 3.9 MB)'),
 ('<p class="meta">Rédigée en grande partie par moi, au format imposé par notre enseignant, salarié d\'AI - Automatique &amp; Industrie : l\'en-tête et le pied de page sont ceux de cette entreprise.</p>',
  '<p class="meta">Mostly written by me, in the format required by our teacher, who works at AI - Automatique &amp; Industrie: the header and footer are that company\'s.</p>'),
 ('<h3 id="p-robot">Robot suiveur de ligne</h3>', '<h3 id="p-robot">Line-following robot</h3>'),
 ('<p class="meta">IUT 1, Université Grenoble Alpes - janvier à mai 2025, en binôme</p>', '<p class="meta">IUT 1, Grenoble Alpes University - January to May 2025, with a classmate</p>'),
 ('<p>Du cahier des charges au dossier technique : conception du PCB sous KiCad, brasure, tests, CAO du châssis et programmation du microcontrôleur.</p>',
  '<p>From specification to technical file: PCB design in KiCad, soldering, testing, chassis CAD and microcontroller programming.</p>'),
 ("<p>Mes parties : le <strong>programme du microcontrôleur</strong>, presque en entier, et le <strong>châssis</strong>, dessiné en CAO et fabriqué au fablab de l'UGA, au-delà de ce que demandait le projet. La carte et la brasure, à deux.</p>",
  '<p>My contributions were the <strong>microcontroller program</strong>, almost all of it, and the <strong>chassis</strong>, drawn in CAD and built at the UGA fablab, beyond what the project required. The board and the soldering were shared.</p>'),
 ('<li>CAO</li><li>C</li><li>Brasure</li>', '<li>CAD</li><li>C</li><li>Soldering</li>'),
 ('alt="Le robot suiveur de ligne monté, avec sa carte électronique"', 'alt="The assembled line-following robot with its circuit board"'),
 ('alt="Schéma électrique du robot dessiné à la main"', 'alt="Hand-drawn circuit diagram of the robot"'),
 ('alt="Démonstration du robot sur sa piste"', 'alt="Robot demonstration on its track"'),
 ('Parcours</h2>', 'Background</h2>'),
 ('<h3>Expériences</h3>', '<h3>Experience</h3>'),
 ('<span class="what">Alternant automaticien<span', '<span class="what">Automation apprentice<span'),
 ('<span class="when">Avr. - juin 2026</span><span class="what">Stage en automatisme',
  '<span class="when">Apr. - June 2026</span><span class="what">Automation internship'),
 ('<span class="what">Employé polyvalent', '<span class="what">Front-of-house staff'),
 ('<span class="detail">Accueil, service, mise en place</span>', '<span class="detail">Front desk, table service, setup</span>'),
 ('<span class="what">Opérateur de production', '<span class="what">Production operator'),
 ('<span class="detail">Machine, emballage, contrôle qualité, palettisation</span>', '<span class="detail">Machine operation, packing, quality control, palletising</span>'),
 ('<span class="what">Employé aux services techniques<span class="where">Mairie de La Terrasse</span>', '<span class="what">Maintenance staff<span class="where">La Terrasse town hall</span>'),
 ("<span class=\"when\">2022</span><span class=\"what\">Stage en laboratoire", '<span class="when">2022</span><span class="what">Laboratory internship'),
 ('<span class="detail">Découverte du nucléaire, de la santé, de la biologie et de la cybersécurité</span>', '<span class="detail">Introduction to nuclear, health, biology and cybersecurity research</span>'),
 ("<span class=\"when\">2021</span><span class=\"what\">Stage en laboratoire", '<span class="when">2021</span><span class="what">Laboratory internship'),
 ("<span class=\"detail\">Culture de bactéries et de levures, extraction d'ADN, initiation à la cristallographie</span>", '<span class="detail">Growing bacteria and yeast, DNA extraction, introduction to crystallography</span>'),
 ('<h3>Formation</h3>', '<h3>Education</h3>'),
 ('<span class="when">Sept. 2027</span><span class="what">Cycle ingénieur en alternance, 3 ans<span class="where">Recherche en cours</span></span><span class="detail">Écoles visées : Grenoble INP - Esisar (Valence), Polytech Grenoble - E2i, Grenoble INP - Phelma, Grenoble INP - Ensimag</span>',
  '<span class="when">Sept. 2027</span><span class="what">Engineering degree apprenticeship, 3 years<span class="where">Currently looking</span></span><span class="detail">Target schools: Grenoble INP - Esisar (Valence), Polytech Grenoble - E2i, Grenoble INP - Phelma, Grenoble INP - Ensimag</span>'),
 ('<span class="what">BUT Génie Électrique et Informatique Industrielle<span class="where">IUT 1, Université Grenoble Alpes</span></span><span class="detail">Parcours Automatisme et Informatique Industrielle, 3e année en alternance</span>',
  '<span class="what">Bachelor of Technology (BUT), Electrical Engineering and Industrial Computing<span class="where">IUT 1, Grenoble Alpes University</span></span><span class="detail">Automation and Industrial Computing track, final year as an apprentice</span>'),
 ('<span class="what">Bac général, mention Assez bien<span class="where">Lycée Marie Reynoard, Villard-Bonnot</span></span><span class="detail">Spécialités maths, physique, SVT</span>',
  '<span class="what">French baccalaureate, mention assez bien (average 12 to 14 out of 20)<span class="where">Lycée Marie Reynoard, Villard-Bonnot</span></span><span class="detail">Maths, physics and life sciences</span>'),
 ('alt="Bâtiment du CEA Grenoble"', 'alt="CEA Grenoble building"'),
 ('alt="Lucas Boles en blouse dans un laboratoire du CNRS"', 'alt="Lucas Boles in a lab coat in a CNRS laboratory"'),
 ('<figcaption>Laboratoire du CNRS, 2021</figcaption>', '<figcaption>CNRS laboratory, 2021</figcaption>'),
 ('alt="Ligne de conditionnement chez SDMR"', 'alt="Packing line at SDMR"'),
 ('<figcaption>Ligne de production SDMR, 2024</figcaption>', '<figcaption>SDMR production line, 2024</figcaption>'),
 ('Compétences</h2>', 'Skills</h2>'),
 ('<dt>Automates</dt>', '<dt>PLCs</dt>'),
 ('<dt>Réseaux industriels</dt>', '<dt>Industrial networks</dt>'),
 ('<dt>Électronique</dt>', '<dt>Electronics</dt>'),
 ('<dt>Langages</dt>', '<dt>Languages</dt>'),
 ('<dt>Outils</dt>', '<dt>Tools</dt>'),
 ('<dt>Anglais</dt><dd>Niveau C1 - Bright Language (2025), TOEIC 885/990 (2026)</dd>', '<dt>English</dt><dd>C1 level - Bright Language (2025), TOEIC 885/990 (2026)</dd>'),
 ('<dt>Espagnol</dt><dd>Niveau B1</dd>', '<dt>Spanish</dt><dd>B1 level</dd>'),
 ('En dehors du travail</h2>', 'Outside work</h2>'),
 ('alt="Sommet avec une croix face à une chaîne de montagnes enneigées"', 'alt="Summit cross facing a range of snowy mountains"'),
 ('<p class="lead">Escalade en bloc et en falaise (7B), plongée, volley et parkour.</p>', '<p class="lead">Bouldering and sport climbing (7B), diving, volleyball and parkour.</p>'),
 ("<p>Certifié PADI Open Water pour la plongée. Le reste du temps, je développe de petits jeux en Python et en C, j'apprends de nouveaux logiciels en autodidacte et je voyage (Espagne, Angleterre, Tunisie).</p>",
  '<p>PADI Open Water certified diver. The rest of the time goes into small games in Python and C, teaching myself new software, and travel (Spain, England, Tunisia).</p>'),
 ('>Jouer au démineur codé pour ce site</a>', '>Play the Minesweeper made for this site</a>'),
 ('alt="Lucas Boles en escalade sur un mur de bloc"', 'alt="Lucas Boles climbing a bouldering wall"'),
 ('<figcaption>Escalade, niveau 7B</figcaption>', '<figcaption>Climbing, grade 7B</figcaption>'),
 ("alt=\"Plongeurs à la surface de l'eau\"", 'alt="Divers at the water surface"'),
 ('<figcaption>Plongée</figcaption>', '<figcaption>Diving</figcaption>'),
 ('alt="Match de volley en gymnase"', 'alt="Indoor volleyball game"'),
 ('<figcaption>Volley</figcaption>', '<figcaption>Volleyball</figcaption>'),
 ('Me contacter</h2>', 'Get in touch</h2>'),
 ('<p class="lead">Je cherche une alternance de 3\xa0ans en cycle ingénieur à partir de septembre\xa02027, en systèmes embarqués ou en automatisme. L\'aéronautique, le spatial et la défense m\'attirent particulièrement.</p>',
  '<p class="lead">I am looking for a 3-year engineering degree apprenticeship from September 2027, in embedded systems or automation. Aerospace, space and defence interest me most.</p>'),
 ('?subject=Alternance%20ing%C3%A9nieur%202027', '?subject=Engineering%20apprenticeship%202027'),
 ('Écrire un e-mail <span', 'Send an email <span'),
 ('<li><span>Téléphone</span><a href="tel:+33670150329">06 70 15 03 29</a></li>', '<li><span>Phone</span><a href="tel:+33670150329">+33 6 70 15 03 29</a></li>'),
 ('download>Télécharger (PDF)</a>', 'download>Download (PDF, French)</a>'),
 ('<li><span>Adresse étudiante</span>', '<li><span>University email</span>'),
 ('>Mentions légales</a>', '>Legal notice (French)</a>'),
 ('>Confidentialité</a>', '>Privacy (French)</a>'),
 ('>Démineur</a>', '>Minesweeper</a>'),
]
# le démineur s'ouvre en anglais depuis la version anglaise
s = s.replace('href="../minesweeper.html"', 'href="../minesweeper.html?lang=en"')

missing = []
for a, b in R:
    if a not in s:
        missing.append(a)
    s = s.replace(a, b)
if missing:
    # on n'écrit rien : une page anglaise à moitié traduite ne doit pas partir en ligne
    for a in missing:
        print('MISSING (phrase française introuvable dans index.html) :', a[:100])
    sys.exit(1)

# mots français restés tels quels dans le texte visible (hors noms propres connus)
ALLOWED = ('Lycée', 'Université', 'Villard', 'Domène', 'Chambéry', 'française', 'Esisar', 'Perchoir')
visible = re.sub(r'<script.*?</script>|<!--.*?-->|<[^>]+>', ' ', s, flags=re.S)
suspects = sorted({w for w in re.findall(r"\w*[àâçéèêëîïôûùœ]\w*", visible) if not any(x in w for x in ALLOWED)})
if suspects:
    print('ATTENTION, mots français possibles dans en/index.html :', ', '.join(suspects))

open(root + '/en/index.html', 'w', encoding='utf-8').write(s)
print('en/index.html généré')
