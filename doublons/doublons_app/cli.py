"""Mode ligne de commande : python -m doublons_app [options] [racines…]"""
from __future__ import annotations

import argparse
import sys

from .core import (Scanner, ScanOptions, export_csv, filter_groups, parse_extensions,
                   verify_group)
from .drives import human_size, list_drives


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        prog="doublons",
        description="Trouve les fichiers portant le même nom + extension sur plusieurs disques.")
    ap.add_argument("roots", nargs="*", help="disques/dossiers (défaut : tous les disques locaux et amovibles)")
    ap.add_argument("--cli", action="store_true", help=argparse.SUPPRESS)
    ap.add_argument("--list-drives", action="store_true", help="liste les disques détectés et quitte")
    ap.add_argument("--ext", default="", help="extensions à inclure, ex. 'pdf,jpg'")
    ap.add_argument("--min-kb", type=float, default=0, help="taille minimale en Ko")
    ap.add_argument("--case-sensitive", action="store_true", help="respecter la casse des noms")
    ap.add_argument("--include-hidden", action="store_true", help="inclure fichiers cachés/système")
    ap.add_argument("--cross-drive", action="store_true", help="seulement les noms présents sur ≥2 disques")
    ap.add_argument("--verify", action="store_true", help="comparer le contenu (empreinte BLAKE2b)")
    ap.add_argument("--csv", help="exporter le résultat dans ce fichier CSV")
    ap.add_argument("--top", type=int, default=50, help="nombre de groupes affichés (défaut 50)")
    a = ap.parse_args(argv)

    drives = list_drives()
    if a.list_drives:
        for d in drives:
            print(f"{d.path:<30} {d.kind:<9} {d.fs:<7} {human_size(d.total):>10}  {d.label}")
        return 0

    roots = a.roots or [d.path for d in drives if d.kind not in ("Réseau", "CD/DVD", "RAM")]
    opt = ScanOptions(case_sensitive=a.case_sensitive, min_size=max(1, int(a.min_kb * 1024)),
                      extensions=parse_extensions(a.ext), skip_hidden=not a.include_hidden)

    def progress(s):
        print(f"\r{s.files:>10} fichiers  {s.dirs:>8} dossiers  {s.elapsed:6.0f} s", end="",
              file=sys.stderr, flush=True)

    print("Analyse de : " + ", ".join(roots), file=sys.stderr)
    sc = Scanner(opt, progress)
    try:
        groups = sc.scan(roots)
    except KeyboardInterrupt:
        sc.cancel()
        groups = sc._groups()
    print(file=sys.stderr)
    groups = filter_groups(groups, cross_drive_only=a.cross_drive)

    if a.verify:
        for i, g in enumerate(groups, 1):
            verify_group(g)   # sans lecture disque si toutes les tailles diffèrent
            print(f"\rVérification {i}/{len(groups)}", end="", file=sys.stderr, flush=True)
        print(file=sys.stderr)

    for g in groups[: a.top]:
        print(f"\n{g.name}  — {g.count} copies sur {len(g.roots)} disque(s)  {g.verdict}")
        for f in g.files:
            print(f"    {human_size(f.size):>10}  {f.path}")
    print(f"\n{len(groups)} noms en double ; {sc.stats.files} fichiers analysés en "
          f"{sc.stats.elapsed:.1f} s ; {sc.stats.errors} éléments inaccessibles.")
    if a.csv:
        export_csv(groups, a.csv)
        print(f"CSV : {a.csv}")
    return 0
