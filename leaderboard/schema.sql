-- Base D1 du classement du démineur. À exécuter une fois dans la console D1.

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

-- un temps validé
CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL UNIQUE,
  player_key TEXT NOT NULL,
  level TEXT NOT NULL,
  time_ms INTEGER NOT NULL,
  noflag INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS scores_board ON scores (level, noflag, time_ms);

-- compteur de requêtes par minute (empreinte de l'IP, effacée après une heure)
CREATE TABLE IF NOT EXISTS hits (
  key TEXT NOT NULL,
  bucket TEXT NOT NULL,
  minute INTEGER NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (key, bucket, minute)
);
