-- Base D1 du classement du démineur, version commentée.
-- Dans la console D1, coller schema-console.sql (sans commentaires) : la console met
-- tout sur une ligne et le premier « -- » transformerait le reste en commentaire.

-- une partie commencée : la graine choisie par le serveur
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL,
  seed INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);

-- un pseudo et l'empreinte du jeton de son propriétaire
CREATE TABLE IF NOT EXISTS players (
  key TEXT PRIMARY KEY,
  display TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- le record de chaque pseudo, par niveau et par catégorie (noflag = 1 : Sans drapeau).
-- Une seule ligne, remplacée seulement par un temps meilleur.
CREATE TABLE IF NOT EXISTS bests (
  player_key TEXT NOT NULL,
  level TEXT NOT NULL,
  noflag INTEGER NOT NULL,
  time_ms INTEGER NOT NULL,
  game_id TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (player_key, level, noflag)
);
CREATE INDEX IF NOT EXISTS bests_board ON bests (level, noflag, time_ms);

-- ancienne table (un temps par partie), remplacée par bests
DROP TABLE IF EXISTS scores;

-- compteur de requêtes par minute (empreinte de l'IP, effacée après une heure)
CREATE TABLE IF NOT EXISTS hits (
  key TEXT NOT NULL,
  bucket TEXT NOT NULL,
  minute INTEGER NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (key, bucket, minute)
);
