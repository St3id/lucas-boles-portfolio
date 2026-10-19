/* Base en mémoire, mêmes méthodes que d1Repo (worker.js).
   Sert uniquement aux tests en local (mode développeur du démineur sur localhost) :
   le vrai code du serveur tourne dans le navigateur, sans Cloudflare. */
export function memRepo() {
  const games = new Map(), players = new Map(), bests = new Map(), hits = new Map();
  const id = (key, level, noflag) => key + "|" + level + "|" + (noflag ? 1 : 0);
  const rows = (level, noflag) => [...bests.values()].filter((b) => b.level === level && b.noflag === (noflag ? 1 : 0));
  return {
    async hit(key, bucket, minute) {
      const k = key + "|" + bucket + "|" + minute;
      hits.set(k, (hits.get(k) || 0) + 1);
      return hits.get(k);
    },
    async insertGame(gid, level, seed, now) { games.set(gid, { id: gid, level, seed, created_at: now, used: 0 }); },
    async getGame(gid) { return games.get(gid) || null; },
    async useGame(gid) {
      const g = games.get(gid);
      if (!g || g.used) return false;
      g.used = 1;
      return true;
    },
    async getPlayer(key) { return players.get(key) || null; },
    async insertPlayer(key, display, tokenHash) { players.set(key, { key, display, token_hash: tokenHash }); },
    async getBest(key, level, noflag) { return bests.get(id(key, level, noflag)) || null; },
    async saveBest(key, level, noflag, timeMs, gameId, now) {
      const cur = bests.get(id(key, level, noflag));
      if (!cur || timeMs < cur.time_ms) bests.set(id(key, level, noflag), { player_key: key, level, noflag: noflag ? 1 : 0, time_ms: timeMs, game_id: gameId, updated_at: now });
    },
    async rank(level, noflag, timeMs) { return rows(level, noflag).filter((b) => b.time_ms < timeMs).length + 1; },
    async board(level, noflag, limit) {
      return rows(level, noflag)
        .sort((a, b) => a.time_ms - b.time_ms || a.updated_at - b.updated_at)
        .slice(0, limit)
        .map((b) => ({ pseudo: players.get(b.player_key).display, timeMs: b.time_ms }));
    },
    // pour les tests : nombre de lignes stockées
    async count() { return bests.size; },
    async cleanup() {}
  };
}
