/* Base en mémoire, mêmes méthodes que d1Repo (worker.js).
   Sert uniquement aux tests en local (mode développeur du démineur sur localhost) :
   le vrai code du serveur tourne dans le navigateur, sans Cloudflare. */
export function memRepo() {
  const games = new Map(), players = new Map(), scores = [], hits = new Map();
  const best = (level, noflag) => {
    const byPlayer = new Map();
    for (const s of scores) {
      if (s.level !== level || (noflag && !s.noflag)) continue;
      if (!byPlayer.has(s.player_key) || s.time_ms < byPlayer.get(s.player_key)) byPlayer.set(s.player_key, s.time_ms);
    }
    return byPlayer;
  };
  return {
    async hit(key, bucket, minute) {
      const k = key + "|" + bucket + "|" + minute;
      hits.set(k, (hits.get(k) || 0) + 1);
      return hits.get(k);
    },
    async insertGame(id, level, seed, now) { games.set(id, { id, level, seed, created_at: now, used: 0 }); },
    async getGame(id) { return games.get(id) || null; },
    async useGame(id) {
      const g = games.get(id);
      if (!g || g.used) return false;
      g.used = 1;
      return true;
    },
    async getPlayer(key) { return players.get(key) || null; },
    async insertPlayer(key, display, tokenHash) { players.set(key, { key, display, token_hash: tokenHash }); },
    async insertScore(gameId, playerKey, level, timeMs, noflag) {
      scores.push({ game_id: gameId, player_key: playerKey, level, time_ms: timeMs, noflag: noflag ? 1 : 0 });
    },
    async rank(level, noflag, timeMs) {
      let better = 0;
      for (const t of best(level, noflag).values()) if (t < timeMs) better++;
      return better + 1;
    },
    async board(level, noflag, limit) {
      return [...best(level, noflag).entries()]
        .map(([key, t]) => ({ pseudo: players.get(key).display, timeMs: t }))
        .sort((a, b) => a.timeMs - b.timeMs)
        .slice(0, limit);
    },
    async cleanup() {}
  };
}
