"""Réserve d'énigmes 10 × 4 pour le démineur : le chemin est fait de 0 (cases sans mine autour),
reliés côte à côte depuis la case sous le cran du milieu (ligne 1, colonne 6) jusqu'au bord droit.

Chaque grille est résoluble sans deviner, demande de croiser des chiffres, et le chemin serpente.
Sortie : une ligne JSON par grille (4 chaînes : M mine, o creusée au départ, . fermée et sûre).
Les grilles retenues sont recopiées dans PZ_POOL (assets/js/minesweeper.js).

Usage : python tools/puzzle_pool.py <graine> <essais> <nombre voulu>
"""
import json
import random
import sys
from collections import deque

W, H = 10, 4
ENTRY = (0, 5)
CELLS = [(r, c) for r in range(H) for c in range(W)]


def nbrs(r, c):
    for dr in (-1, 0, 1):
        for dc in (-1, 0, 1):
            if (dr or dc) and 0 <= r + dr < H and 0 <= c + dc < W:
                yield r + dr, c + dc


def side(r, c):
    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        if 0 <= r + dr < H and 0 <= c + dc < W:
            yield r + dr, c + dc


def number(mines, cell):
    return sum(n in mines for n in nbrs(*cell))


def zero_path(mines):
    """Composante de 0 reliés côte à côte depuis l'entrée, et plus court trajet jusqu'au bord droit."""
    if ENTRY in mines or number(mines, ENTRY):
        return None
    comp, prev = {ENTRY}, {ENTRY: None}
    q = deque([ENTRY])
    while q:
        x = q.popleft()
        for y in side(*x):
            if y not in comp and y not in mines and number(mines, y) == 0:
                comp.add(y); prev[y] = x; q.append(y)
    exits = [x for x in comp if x[1] == W - 1]
    if not exits:
        return None
    # plus court trajet (BFS : le premier atteint est le plus court)
    best = None
    for e in exits:
        p, x = [], e
        while x:
            p.append(x); x = prev[x]
        p.reverse()
        if best is None or len(p) < len(best):
            best = p
    return comp, best


def turns(path):
    t, d = 0, None
    for a, b in zip(path, path[1:]):
        nd = (b[0] - a[0], b[1] - a[1])
        if d and nd != d:
            t += 1
        d = nd
    return t


def deduce(mines, revealed):
    hidden = [x for x in CELLS if x not in revealed]
    cons = []
    for cell in revealed:
        hn = [n for n in nbrs(*cell) if n not in revealed]
        if hn:
            cons.append((number(mines, cell), hn))
    front = sorted({v for _, hn in cons for v in hn})
    idx = {v: i for i, v in enumerate(front)}
    cons_i = [(n, [idx[v] for v in hn]) for n, hn in cons]
    by_var = [[] for _ in front]
    for k, (_, vs) in enumerate(cons_i):
        for v in vs:
            by_var[v].append(k)
    assign = [None] * len(front)
    can_mine = [False] * len(front)
    can_safe = [False] * len(front)

    def ok(k):
        n, vs = cons_i[k]
        m = sum(1 for v in vs if assign[v] is True)
        u = sum(1 for v in vs if assign[v] is None)
        return m <= n <= m + u

    def bt(i):
        if i == len(front):
            for j, a in enumerate(assign):
                if a: can_mine[j] = True
                else: can_safe[j] = True
            return
        for val in (False, True):
            assign[i] = val
            if all(ok(k) for k in by_var[i]):
                bt(i + 1)
            assign[i] = None

    bt(0)
    safe = {front[j] for j in range(len(front)) if can_safe[j] and not can_mine[j]}
    known_m, known_s = set(), set()
    changed = True
    while changed:
        changed = False
        for n, hn in cons:
            unk = [v for v in hn if v not in known_m and v not in known_s]
            m = sum(v in known_m for v in hn)
            if not unk:
                continue
            if m == n:
                known_s.update(unk); changed = True
            elif m + len(unk) == n:
                known_m.update(unk); changed = True
    return safe, known_s & safe


def play(mines, revealed, comp):
    revealed = set(revealed)
    rounds = hard = 0
    first_path = None
    while not comp <= revealed:
        safe, simple = deduce(mines, revealed)
        if not safe:
            return None
        step = simple if simple else safe
        if not simple:
            hard += 1
        revealed |= step
        rounds += 1
        if first_path is None and step & comp:
            first_path = rounds
    return rounds, hard, first_path


def main(seed, tries, want):
    rnd = random.Random(seed)
    found, seen = [], set()
    for _ in range(tries):
        mines = set(rnd.sample(CELLS, rnd.randint(8, 13)))
        zp = zero_path(mines)
        if not zp:
            continue
        comp, path = zp
        # un serpent : au moins 3 virages, une bande étroite (pas une grande clairière)
        if turns(path) < 3 or len(comp) > len(path) + 5 or len(path) < 8:
            continue
        safe_other = [x for x in CELLS if x not in mines and x not in comp and number(mines, x) > 0]
        if len(safe_other) < 5:
            continue
        revealed = set(rnd.sample(safe_other, rnd.randint(4, min(8, len(safe_other)))))
        res = play(mines, revealed, comp)
        if not res:
            continue
        rounds, hard, first_path = res
        # il faut réfléchir avant de trouver le chemin, et croiser des chiffres au moins deux fois
        if hard < 2 or first_path < 2:
            continue
        rows = tuple("".join("M" if (r, c) in mines else "o" if (r, c) in revealed else "." for c in range(W)) for r in range(H))
        if rows in seen:
            continue
        seen.add(rows)
        found.append({"rows": list(rows), "rounds": rounds, "hard": hard, "path": len(path), "turns": turns(path), "mines": len(mines)})
        if len(found) >= want:
            break
    return found


if __name__ == "__main__":
    for f in main(int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3])):
        print(json.dumps(f))
