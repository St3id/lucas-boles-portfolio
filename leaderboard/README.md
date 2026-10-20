# Classement du démineur

Petit serveur (Cloudflare Worker) et sa base (Cloudflare D1), gratuits pour ce volume.
Tout se fait dans le navigateur, sur le tableau de bord Cloudflare : aucun outil à installer.

| Fichier | Rôle |
|---|---|
| `worker.js` | le serveur, à coller tel quel dans Cloudflare |
| `schema.sql` | les tables, commentées (la référence) |
| `schema-console.sql` | les mêmes tables sans commentaires, à coller dans la console D1 |
| `mem-repo.js` | base en mémoire pour les tests en local |
| `test-serveur.html`, `test-interface.html` | tests à ouvrir en local |

Le bloc `CORE` de `worker.js` est recopié depuis `assets/js/ms-core.js` par `python tools/build.py`.
Après une modification du cœur du jeu, relancer `build.py` puis recoller `worker.js` dans Cloudflare (étape 6).

## Mise en ligne (une seule fois)

1. **Créer le compte** sur https://dash.cloudflare.com/sign-up (e-mail et mot de passe, puis valider l'e-mail).
   Le plan gratuit suffit. Ne jamais communiquer ce mot de passe à qui que ce soit.
2. **Créer le Worker** : menu *Compute (Workers)* > *Workers & Pages* > *Create* > *Create Worker*.
   Nom : `demineur-classement`, puis *Deploy*. À la première fois, Cloudflare demande de choisir un
   sous-domaine `workers.dev` (par exemple `lucasboles`). L'adresse du serveur devient
   `https://demineur-classement.lucasboles.workers.dev`.
3. **Créer la base** : menu *Storage & Databases* > *D1 SQL Database* > *Create*. Nom : `demineur`.
   Ouvrir la base, onglet *Console*, coller tout le contenu de `schema-console.sql`, puis *Execute*.
   (Pas `schema.sql` : la console met tout sur une ligne, et le premier commentaire `--` avalerait
   toutes les requêtes.)
4. **Relier la base au Worker** : ouvrir le Worker > *Settings* > *Bindings* > *Add* > *D1 database*.
   Variable name : `DB` (en majuscules), base : `demineur`, puis *Deploy*.
5. **Réglages du Worker** : *Settings* > *Variables and Secrets* > *Add* :
   - `ALLOWED_ORIGINS`, type *Text*, valeur `https://st3id.github.io`
   - `SALT`, type *Secret*, valeur : une longue suite de caractères au hasard (au moins 32), gardée nulle part ailleurs
6. **Coller le code** : en haut à droite du Worker, *Edit code*. Tout effacer, coller le contenu de
   `worker.js`, puis *Deploy*.
7. **Nettoyage quotidien** : *Settings* > *Trigger Events* > *Add* > *Cron Triggers*, expression `0 3 * * *`.
8. **Vérifier** : ouvrir `https://demineur-classement.<sous-domaine>.workers.dev/scores?level=easy`
   dans le navigateur. La réponse attendue est `{"scores":[]}`.
9. **Brancher le jeu** : mettre cette adresse (sans `/` final) dans `LEADERBOARD_API`, en haut de
   `assets/js/minesweeper.js`, lancer `python tools/build.py` et publier.

## E-mail quand le top 3 change (modération)

Quand un temps fait changer le top 3 d'un niveau (une arrivée, ou un changement d'ordre), le serveur
envoie un e-mail : nouveau top 3, ancien top 3, qui sort, la partie (temps, ancien record, clics,
drapeaux, date d'inscription du pseudo) et les commandes SQL pour retirer ou bannir le pseudo.
Un joueur qui améliore son temps sans changer l'ordre ne déclenche rien.

L'envoi passe par Resend (gratuit jusqu'à 100 e-mails par jour). Sans nom de domaine, Resend
n'envoie qu'à l'adresse du compte : créer le compte avec l'adresse qui doit recevoir les e-mails.

1. Créer un compte sur https://resend.com avec `boleslcc@gmail.com`, puis *API Keys* > *Create API Key*,
   permission *Sending access*. Copier la clé (elle commence par `re_`, elle ne s'affiche qu'une fois).
2. Dans le Worker : *Settings* > *Variables and Secrets* > *Add* :
   - `RESEND_API_KEY`, type *Secret*, valeur : la clé
   - `NOTIFY_EMAIL`, type *Text*, valeur : `boleslcc@gmail.com`
3. Dans la console D1, créer la table des mots bannis :
   `CREATE TABLE IF NOT EXISTS bans (word TEXT PRIMARY KEY);`
4. Recoller `worker.js` dans le Worker (*Edit code*), puis *Deploy*.

Sans `RESEND_API_KEY` ou `NOTIFY_EMAIL`, le classement marche normalement et aucun e-mail ne part.
Une panne de Resend ne bloque jamais un envoi de temps. Les erreurs d'envoi apparaissent dans les
journaux du Worker (*Observability* ou *Logs*).

## Bannir un mot

Dans la console D1 : `INSERT OR IGNORE INTO bans (word) VALUES ('mot');`

Le mot est refusé dans tout nouveau pseudo, en clair (« kodama » bloque « Kodama38 ») comme avec des
variantes (`K0d4ma`, lettres doublées, accents), et le pseudo existant qui le contient ne peut plus
envoyer de temps. Pour l'enlever : `DELETE FROM bans WHERE word = 'mot';`. Pas besoin de republier le code.

## Ce que vérifie le serveur

- **La partie** : il choisit la graine de la grille, puis rejoue la liste des clics reçue. Une partie
  perdue, inachevée, déjà envoyée ou de plus de 2 heures est refusée.
- **Le temps** : temps de la dernière action, au minimum 1 s (Facile), 6 s (Moyen), 25 s (Difficile),
  jamais plus court que ce que l'horloge du serveur a vu passer, et au moins 40 ms entre deux clics.
- **Le pseudo** : 3 à 16 caractères (lettres, chiffres, `_ . -`), liste de mots refusés en français et
  en anglais (avec les variantes `c0nnard`, `connnard`, accents), noms réservés. Un pseudo appartient au
  premier qui l'utilise : son navigateur garde un jeton qui le prouve. « Lucas » et « lucàs » sont le
  même pseudo.
- **Les abus** : 30 parties, 10 envois et 60 lectures par minute et par visiteur, compté sur une
  empreinte de l'adresse IP effacée après une heure.
- **Un seul record par pseudo** : une ligne par pseudo, niveau et catégorie, remplacée uniquement
  par un temps meilleur. Un temps moins bon ne stocke rien. La base reste donc minuscule.
- **Le mode Sans drapeau** : un niveau à part (`noflag`, 16 × 16, 40 mines), débloqué dans la fenêtre
  Nouvelle partie. Le serveur refuse toute partie de ce mode où un drapeau a été posé.
- **La catégorie Sans drapeau** des autres niveaux (une partie gagnée sans aucun drapeau) est toujours
  calculée par le serveur, mais le jeu ne l'affiche plus : le mode Sans drapeau la remplace.
- **Les parties avec le code secret** ne sont jamais envoyées par le jeu.

Limite connue : un robot qui lirait la grille dans le navigateur pourrait jouer vite et « proprement ».
C'est inévitable pour un jeu qui tourne entièrement dans le navigateur ; les contrôles ci-dessus
écartent les faux envois et les temps impossibles.

## Sécurité

- **Injection SQL** : impossible, toutes les requêtes sont fixes et les valeurs reçues passent par
  des paramètres liés (`.bind`), jamais collées dans le texte SQL.
- **Injection HTML (XSS)** : les pseudos sont limités à l'alphabet latin, aux chiffres et à `_ . -`,
  et affichés par `textContent` dans le jeu, jamais interprétés.
- **Usurpation de pseudo** : jeton aléatoire de 192 bits par pseudo, le serveur n'en garde que
  l'empreinte SHA-256. Les lettres d'autres alphabets qui imitent un pseudo (« Lucаs » avec un а
  cyrillique) et les caractères invisibles sont refusés.
- **Requêtes trafiquées** : niveau vérifié sans passer par les propriétés héritées
  (`constructor`, `__proto__`), corps JSON limité à 200 Ko et refusé avant lecture s'il annonce plus,
  actions vérifiées une par une (type, case, temps entier et croissant, 5000 au plus).
- **Réponses** : `nosniff`, CSP `default-src 'none'`, aucun détail d'erreur interne renvoyé.
- **Adresse IP** : jamais enregistrée. Seule une empreinte salée sert à compter les requêtes par
  minute, effacée après une heure.

Les tests de `test-serveur.html` rejouent ces attaques à chaque modification.

## Retirer un pseudo (demande d'un joueur, ou pseudo signalé par l'e-mail)

Dans la console D1 de la base `demineur`, en remplaçant `pseudo` par le pseudo en minuscules sans accents :

```sql
DELETE FROM bests WHERE player_key = 'pseudo';
DELETE FROM players WHERE key = 'pseudo';
```

## Tester en local

À la racine du dépôt : `python -m http.server 8000`, puis ouvrir

- http://localhost:8000/leaderboard/test-serveur.html (le serveur seul, base en mémoire)
- http://localhost:8000/leaderboard/test-interface.html (le jeu avec le serveur simulé)

Pour jouer soi-même avec le serveur simulé : sur http://localhost:8000/minesweeper.html, dans la
console du navigateur, `localStorage.setItem("ms-api-dev", '"mock"')` puis recharger la page.
Ce mode n'existe que sur `localhost`.
