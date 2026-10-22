"""Réserve d'énigmes pour le démineur (10 colonnes × 5 lignes).

L'énigme est un petit démineur : creuser toutes les cases sûres, sans deviner. Dans la grille se
cache un chemin : un serpent de cases à chiffres qui part d'une case de la ligne du haut, passe
partout, et finit sur le bord droit. Les mines sont dans les creux entre ses virages et le
guident : aucun raccourci par d'autres cases sûres, le serpent est le plus court trajet. Une fois
l'énigme résolue, les cases du serpent perdent leur chiffre et le chemin se dessine.

La grille commence fermée, le joueur creuse où il veut ; son premier coup ouvre la case et ses
voisines sûres. Pour chaque grille, on note les bons départs, les cases d'où l'on finit alors sans
deviner (le jeu choisit la grille au premier clic).

Usage : python tools/puzzle_pool.py <graine> <essais> <nombre>
(plusieurs graines en parallèle pour aller plus vite)
Sortie : une ligne JSON par grille : rows (5 chaînes : M mine ; P chemin ; . sûre, hors du
chemin) et starts (les bons départs, numéros de case ligne × 10 + colonne).
"""
import json
import random
import sys
from collections import deque

W, H = 10, 5
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


def turns(path):
    t, d = 0, None
    for a, b in zip(path, path[1:]):
        nd = (b[0] - a[0], b[1] - a[1])
        if d and nd != d:
            t += 1
        d = nd
    return t


def snakes():
    """Tous les serpents fins d'une case du haut jusqu'au bord droit (chaque nouvelle case ne
    touche, côte à côte, que la précédente : le tracé se lit sans ambiguïté), assez longs et
    tordus, et qui passent partout : chaque case de la grille est à côté du chemin."""
    out = []

    def dfs(path, pset):
        r, c = path[-1]
        if c == W - 1:
            if len(path) >= 20 and turns(path) >= 5 and all(
                    x in pset or any(n in pset for n in nbrs(*x)) for x in CELLS):
                out.append(list(path))
            return
        for y in side(r, c):
            if y in pset or any(z in pset and z != path[-1] for z in side(*y)):
                continue
            path.append(y); pset.add(y)
            dfs(path, pset)
            path.pop(); pset.discard(y)

    for c0 in range(W - 1):
        dfs([(0, c0)], {(0, c0)})
    return out


def deduce(mines, revealed, known):
    """Ce que le joueur peut déduire des chiffres visibles, connaissant déjà les mines known.
    Renvoie (cases sûres, nouvelles mines, simple) : simple quand un chiffre seul suffit (toutes
    ses mines sont trouvées, ou toutes ses cases fermées sont des mines), sinon il faut croiser
    plusieurs chiffres (recherche complète, groupe de cases par groupe de cases)."""
    cons = []
    for cell in revealed:
        hn = [n for n in nbrs(*cell) if n not in revealed and n not in known]
        if hn:
            cons.append((number(mines, cell) - sum(n in known for n in nbrs(*cell)), hn))
    sure_m, sure_s = set(), set()
    changed = True
    while changed:
        changed = False
        for n, hn in cons:
            unk = [v for v in hn if v not in sure_m and v not in sure_s]
            m = sum(v in sure_m for v in hn)
            if not unk:
                continue
            if m == n:
                sure_s.update(unk); changed = True
            elif m + len(unk) == n:
                sure_m.update(unk); changed = True
    if sure_s:
        return sure_s, sure_m, True
    # groupes de cases reliées par des chiffres
    by_cell = {}
    for k, (_, hn) in enumerate(cons):
        for v in hn:
            by_cell.setdefault(v, []).append(k)
    safe, found_m, done = set(), set(sure_m), set()
    for start in by_cell:
        if start in done:
            continue
        group, ks, todo = [], set(), [start]
        done.add(start)
        while todo:
            v = todo.pop(0)
            group.append(v)
            for k in by_cell[v]:
                ks.add(k)
                for w in cons[k][1]:
                    if w not in done:
                        done.add(w); todo.append(w)
        idx = {v: i for i, v in enumerate(group)}
        gcons = [(cons[k][0], [idx[v] for v in cons[k][1]]) for k in ks]
        by_var = [[] for _ in group]
        for k, (_, vs) in enumerate(gcons):
            for v in vs:
                by_var[v].append(k)
        assign = [None] * len(group)
        can_mine = [False] * len(group)
        can_safe = [False] * len(group)

        def ok(k):
            n, vs = gcons[k]
            m = sum(1 for v in vs if assign[v] is True)
            u = sum(1 for v in vs if assign[v] is None)
            return m <= n <= m + u

        def bt(i):
            if i == len(group):
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
        for j, v in enumerate(group):
            if can_safe[j] and not can_mine[j]:
                safe.add(v)
            elif can_mine[j] and not can_safe[j]:
                found_m.add(v)
    return safe, found_m, False


def no_shortcut(path, mines):
    """Vrai si, par des cases sûres (côte à côte), aucun trajet ne relie deux cases du serpent
    plus vite que lui, ni aussi vite par d'autres cases : le chemin violet est le seul plus court,
    sans raccourci ni détour de même longueur."""
    safe = {x for x in CELLS if x not in mines}
    for i, a in enumerate(path):
        dist, ways = {a: 0}, {a: 1}
        q = deque([a])
        while q:
            x = q.popleft()
            for y in side(*x):
                if y in safe:
                    if y not in dist:
                        dist[y], ways[y] = dist[x] + 1, ways[x]
                        q.append(y)
                    elif dist[y] == dist[x] + 1:
                        ways[y] += ways[x]
        if any(dist.get(path[j], j - i) < j - i or ways.get(path[j], 1) > 1 for j in range(i + 1, len(path))):
            return False
    return True


def cascade(mines, revealed):
    """Comme au démineur : une case creusée sans mine autour ouvre ses voisines, de proche en proche."""
    revealed = set(revealed)
    todo = [x for x in revealed if number(mines, x) == 0]
    while todo:
        for n in nbrs(*todo.pop()):
            if n not in revealed and n not in mines:
                revealed.add(n)
                if number(mines, n) == 0:
                    todo.append(n)
    return revealed


def play(mines, revealed):
    """Joue l'énigme comme un joueur qui ne devine jamais : (tours, tours où il faut croiser
    des chiffres), ou None s'il faut deviner."""
    safe_all = {x for x in CELLS if x not in mines}
    revealed, known = cascade(mines, revealed), set()
    rounds = hard = 0
    while not safe_all <= revealed:
        safe, new_m, simple = deduce(mines, revealed, known)
        known |= new_m
        if not safe:
            return None
        if not simple:
            hard += 1
        revealed = cascade(mines, revealed | safe)
        rounds += 1
    return rounds, hard


def main(seed, tries, want):
    rnd = random.Random(seed)
    found, seen = [], set()
    all_snakes = snakes()
    for _ in range(tries):
        path = rnd.choice(all_snakes)
        pset = set(path)
        # des mines partout autour du serpent, puis on en retire au hasard tant que ça ne crée
        # aucun raccourci : les mines guident le chemin. Presque toutes les cases du chemin ont
        # un chiffre (2 vides au plus)
        others = [x for x in CELLS if x not in pset]
        rnd.shuffle(others)
        mines, q = set(others), rnd.uniform(0.5, 1)
        for x in others:
            if rnd.random() < q and no_shortcut(path, mines - {x}):
                mines.discard(x)
        if sum(number(mines, x) == 0 for x in path) > 2:
            continue
        # la grille commence fermée ; le premier coup ouvre la case et ses voisines sûres. Les
        # bons départs : les cases d'où l'on finit alors sans deviner, en croisant des chiffres
        # au moins deux fois
        starts = []
        for x in CELLS:
            if x not in mines:
                res = play(mines, {x} | {n for n in nbrs(*x) if n not in mines})
                if res and res[1] >= 2:
                    starts.append(x[0] * W + x[1])
        if not starts:
            continue
        rows = tuple("".join("M" if x in mines else "P" if x in pset else "." for x in ((r, c) for c in range(W)))
                     for r in range(H))
        if rows in seen:
            continue
        seen.add(rows)
        found.append({"rows": list(rows), "starts": starts, "path": len(path), "turns": turns(path),
                      "mines": len(mines), "entry": path[0][1], "exit": path[-1][0]})
        print(json.dumps(found[-1]), flush=True)
        if len(found) >= want:
            break
    return found


if __name__ == "__main__":
    main(*map(int, sys.argv[1:4]))
