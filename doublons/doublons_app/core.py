"""Moteur de recherche de doublons par nom + extension, multi-disques.

Principe :
  1. Parcours (os.scandir, itératif) de chaque racine sélectionnée.
  2. Regroupement par clé = nom de fichier complet (nom + extension),
     normalisé Unicode (NFC) et, par défaut, insensible à la casse
     (comme NTFS / FAT / exFAT).
  3. Optionnel : vérification du contenu (empreinte BLAKE2b) pour distinguer
     les vrais doublons des fichiers qui portent seulement le même nom.
"""
from __future__ import annotations

import hashlib
import os
import stat as stat_mod
import sys
import threading
import time
import unicodedata
from dataclasses import dataclass, field
from typing import Callable, Iterable

IS_WINDOWS = sys.platform == "win32"
IS_MAC = sys.platform == "darwin"

FILE_ATTRIBUTE_HIDDEN = 0x2
FILE_ATTRIBUTE_SYSTEM = 0x4
FILE_ATTRIBUTE_REPARSE_POINT = 0x400

# Dossiers ignorés par défaut (comparaison insensible à la casse, sur le nom).
DEFAULT_EXCLUDED_DIRS = [
    "$Recycle.Bin", "System Volume Information", "$WinREAgent", "$SysReset",
    "Windows", "Program Files", "Program Files (x86)", "ProgramData",
    "AppData", "Recovery", "Config.Msi",
    "node_modules", ".git", "__pycache__", ".Trash", ".Trashes",
    ".Spotlight-V100", ".fseventsd", "lost+found",
]
# Chemins absolus jamais parcourus (pseudo-systèmes de fichiers Unix).
_POSIX_SKIP_PATHS = {"/proc", "/sys", "/dev", "/run", "/snap", "/private/var/vm",
                     "/System/Volumes"}
if IS_MAC:
    # Les volumes externes sont proposés comme disques séparés ; et sous APFS les
    # « firmlinks » (/Users…) changent de st_dev, donc pas de contrôle par périphérique.
    _POSIX_SKIP_PATHS |= {"/Volumes"}


@dataclass
class ScanOptions:
    case_sensitive: bool = False
    min_size: int = 1                     # octets ; 1 = ignore les fichiers vides
    extensions: set[str] = field(default_factory=set)   # {".pdf", ".jpg"} ; vide = toutes
    skip_hidden: bool = True
    excluded_dirs: list[str] = field(default_factory=lambda: list(DEFAULT_EXCLUDED_DIRS))
    one_filesystem: bool = True           # ne pas déborder sur un autre disque monté


@dataclass
class FileEntry:
    path: str
    size: int
    mtime: float
    root: str                             # racine (disque) d'origine


@dataclass
class DuplicateGroup:
    name: str                             # nom affiché (casse de la 1re occurrence)
    files: list[FileEntry]
    verdict: str = ""                     # rempli par verify_group()

    @property
    def count(self) -> int:
        return len(self.files)

    @property
    def roots(self) -> set[str]:
        return {f.root for f in self.files}

    @property
    def same_size(self) -> bool:
        return len({f.size for f in self.files}) == 1

    @property
    def wasted(self) -> int:
        """Espace récupérable si toutes les copies sauf la plus grosse étaient supprimées
        (n'a de sens que si le contenu est identique)."""
        sizes = sorted(f.size for f in self.files)
        return sum(sizes[:-1])

    @property
    def total_size(self) -> int:
        return sum(f.size for f in self.files)


@dataclass
class ScanStats:
    files: int = 0
    dirs: int = 0
    errors: int = 0
    current: str = ""
    elapsed: float = 0.0


def make_key(name: str, case_sensitive: bool) -> str:
    key = unicodedata.normalize("NFC", name)
    return key if case_sensitive else key.casefold()


def parse_extensions(text: str) -> set[str]:
    out = set()
    for part in text.replace(";", ",").replace(" ", ",").split(","):
        part = part.strip().lower()
        if part:
            out.add(part if part.startswith(".") else "." + part)
    return out


def _dev(path: str):
    try:
        return os.stat(path).st_dev
    except OSError:
        return None


def normalize_roots(roots: Iterable[str]) -> list[str]:
    """Supprime les doublons et les racines contenues dans une autre racine du même
    disque (ex. C:\\ et C:\\Users -> C:\\) pour ne pas compter deux fois les mêmes
    fichiers. Un disque monté sous une autre racine (/media/usb sous /) est conservé :
    le parcours ne déborde jamais d'un disque à l'autre."""
    cleaned = []
    for r in roots:
        a = os.path.abspath(r)
        cleaned.append(a)
    cleaned = sorted(set(cleaned), key=lambda p: (len(p), p))
    kept: list[str] = []
    for r in cleaned:
        rn = os.path.normcase(r)
        nested = False
        for k in kept:
            kn = os.path.normcase(k)
            base = kn if kn.endswith(os.sep) else kn + os.sep
            if rn == kn or (rn.startswith(base) and (IS_WINDOWS or _dev(r) == _dev(k))):
                nested = True
                break
        if not nested:
            kept.append(r)
    return kept


def _long(path: str) -> str:
    """Préfixe \\\\?\\ sous Windows pour dépasser la limite de 260 caractères."""
    if IS_WINDOWS and not path.startswith("\\\\?\\"):
        if path.startswith("\\\\"):
            return "\\\\?\\UNC\\" + path[2:]
        return "\\\\?\\" + path
    return path


def _short(path: str) -> str:
    if IS_WINDOWS:
        if path.startswith("\\\\?\\UNC\\"):
            return "\\\\" + path[8:]
        if path.startswith("\\\\?\\"):
            return path[4:]
    return path


class Scanner:
    """Parcourt les racines et regroupe les fichiers par nom + extension.

    Conçu pour tourner dans un thread : `cancel()` interrompt proprement,
    `progress` est appelé régulièrement avec un ScanStats.
    """

    def __init__(self, options: ScanOptions | None = None,
                 progress: Callable[[ScanStats], None] | None = None):
        self.opt = options or ScanOptions()
        self.progress = progress
        self._cancel = threading.Event()
        self.stats = ScanStats()
        # clé -> tuple (une seule occurrence, cas majoritaire) ou liste de tuples.
        # tuple = (index_dossier, nom, taille, mtime, index_racine) : économise la mémoire.
        self._index: dict[str, object] = {}
        self._dirs: list[str] = []
        self._roots: list[str] = []
        self.errors: list[tuple[str, str]] = []

    def cancel(self) -> None:
        self._cancel.set()

    @property
    def cancelled(self) -> bool:
        return self._cancel.is_set()

    # ------------------------------------------------------------------ #
    def scan(self, roots: Iterable[str]) -> list[DuplicateGroup]:
        t0 = time.monotonic()
        last = 0.0
        excluded = {d.casefold() for d in self.opt.excluded_dirs}
        exts = self.opt.extensions
        min_size = self.opt.min_size
        skip_hidden = self.opt.skip_hidden
        case_sensitive = self.opt.case_sensitive
        index = self._index

        for root in normalize_roots(roots):
            if self.cancelled:
                break
            root_idx = len(self._roots)
            self._roots.append(root)
            try:
                root_dev = os.stat(root).st_dev
            except OSError as e:
                self._err(root, e)
                continue
            stack = [_long(root)]
            while stack:
                if self.cancelled:
                    break
                d = stack.pop()
                short_d = _short(d)
                dir_idx = -1
                self.stats.dirs += 1
                try:
                    it = os.scandir(d)
                except OSError as e:
                    self._err(short_d, e)
                    continue
                with it:
                    for entry in it:
                        name = entry.name
                        try:
                            if entry.is_symlink():
                                continue
                            is_dir = entry.is_dir(follow_symlinks=False)
                            if is_dir:
                                if name.casefold() in excluded:
                                    continue
                                if skip_hidden and self._hidden(entry):
                                    continue
                                if IS_WINDOWS:
                                    st = entry.stat(follow_symlinks=False)
                                    # Jonctions / points de montage NTFS : évite boucles et doubles comptes.
                                    if getattr(st, "st_file_attributes", 0) & FILE_ATTRIBUTE_REPARSE_POINT:
                                        continue
                                else:
                                    p = entry.path
                                    if p in _POSIX_SKIP_PATHS:
                                        continue
                                    if self.opt.one_filesystem and not IS_MAC:
                                        if os.stat(p, follow_symlinks=False).st_dev != root_dev:
                                            continue
                                stack.append(entry.path)
                                continue
                            if not entry.is_file(follow_symlinks=False):
                                continue
                            if skip_hidden and self._hidden(entry):
                                continue
                            if exts:
                                ext = os.path.splitext(name)[1].lower()
                                if ext not in exts:
                                    continue
                            st = entry.stat(follow_symlinks=False)
                            if st.st_size < min_size:
                                continue
                        except OSError as e:
                            self._err(os.path.join(short_d, name), e)
                            continue

                        if dir_idx < 0:
                            dir_idx = len(self._dirs)
                            self._dirs.append(short_d)
                        rec = (dir_idx, name, st.st_size, st.st_mtime, root_idx)
                        key = make_key(name, case_sensitive)
                        cur = index.get(key)
                        if cur is None:
                            index[key] = rec
                        elif isinstance(cur, tuple):
                            index[key] = [cur, rec]
                        else:
                            cur.append(rec)
                        self.stats.files += 1

                now = time.monotonic()
                if self.progress and now - last > 0.15:
                    last = now
                    self.stats.current = short_d
                    self.stats.elapsed = now - t0
                    self.progress(self.stats)

        self.stats.elapsed = time.monotonic() - t0
        self.stats.current = ""
        if self.progress:
            self.progress(self.stats)
        return self._groups()

    # ------------------------------------------------------------------ #
    @staticmethod
    def _hidden(entry: os.DirEntry) -> bool:
        if entry.name.startswith("."):
            return True
        if IS_WINDOWS:
            attrs = getattr(entry.stat(follow_symlinks=False), "st_file_attributes", 0)
            return bool(attrs & (FILE_ATTRIBUTE_HIDDEN | FILE_ATTRIBUTE_SYSTEM))
        return False

    def _err(self, path: str, exc: OSError) -> None:
        self.stats.errors += 1
        if len(self.errors) < 1000:
            self.errors.append((path, exc.strerror or str(exc)))

    def _groups(self) -> list[DuplicateGroup]:
        groups = []
        for recs in self._index.values():
            if isinstance(recs, tuple):
                continue
            files = [FileEntry(os.path.join(self._dirs[di], n), s, m, self._roots[ri])
                     for di, n, s, m, ri in recs]
            groups.append(DuplicateGroup(recs[0][1], files))
        groups.sort(key=lambda g: (-g.count, -g.total_size, g.name.casefold()))
        return groups


# --------------------------------------------------------------------------- #
# Filtres post-scan
# --------------------------------------------------------------------------- #
def filter_groups(groups: list[DuplicateGroup], *, cross_drive_only: bool = False,
                  same_size_only: bool = False, text: str = "") -> list[DuplicateGroup]:
    t = text.casefold().strip()
    out = []
    for g in groups:
        if cross_drive_only and len(g.roots) < 2:
            continue
        if same_size_only and not g.same_size:
            continue
        if t and t not in g.name.casefold():
            continue
        out.append(g)
    return out


# --------------------------------------------------------------------------- #
# Vérification du contenu
# --------------------------------------------------------------------------- #
VERDICT_IDENTICAL = "Contenu identique"
VERDICT_DIFFERENT = "Contenu différent"
VERDICT_PARTIAL = "Partiellement identique"
VERDICT_ERROR = "Illisible"

_CHUNK = 1 << 20
_EDGE = 64 * 1024


def _quick_hash(path: str, size: int) -> bytes:
    h = hashlib.blake2b(digest_size=16)
    with open(_long(path), "rb") as fh:
        h.update(fh.read(_EDGE))
        if size > 2 * _EDGE:
            fh.seek(size - _EDGE)
            h.update(fh.read(_EDGE))
    return h.digest()


def _full_hash(path: str, cancel: threading.Event | None) -> bytes:
    h = hashlib.blake2b(digest_size=32)
    with open(_long(path), "rb") as fh:
        while True:
            if cancel is not None and cancel.is_set():
                raise InterruptedError
            b = fh.read(_CHUNK)
            if not b:
                break
            h.update(b)
    return h.digest()


def verify_group(group: DuplicateGroup, cancel: threading.Event | None = None) -> str:
    """Compare le contenu des fichiers du groupe.

    Étapes : taille -> empreinte rapide (début + fin) -> empreinte complète,
    uniquement sur les fichiers encore candidats (économise les E/S sur USB).
    Le résultat est aussi stocké dans group.verdict.
    """
    by_size: dict[int, list[FileEntry]] = {}
    for f in group.files:
        by_size.setdefault(f.size, []).append(f)

    clusters: list[list[FileEntry]] = []
    unreadable = 0
    for size, files in by_size.items():
        if len(files) < 2:
            clusters.append(files)
            continue
        quick: dict[bytes, list[FileEntry]] = {}
        for f in files:
            try:
                quick.setdefault(_quick_hash(f.path, size), []).append(f)
            except OSError:
                unreadable += 1
        for qfiles in quick.values():
            if len(qfiles) < 2 or size <= 2 * _EDGE:
                clusters.append(qfiles)        # petit fichier : empreinte rapide = complète
                continue
            full: dict[bytes, list[FileEntry]] = {}
            for f in qfiles:
                try:
                    full.setdefault(_full_hash(f.path, cancel), []).append(f)
                except OSError:
                    unreadable += 1
            clusters.extend(full.values())

    readable = len(group.files) - unreadable
    biggest = max((len(c) for c in clusters), default=0)
    if readable < 2:
        verdict = VERDICT_ERROR
    elif biggest == len(group.files):
        verdict = VERDICT_IDENTICAL
    elif biggest >= 2:
        verdict = f"{VERDICT_PARTIAL} ({biggest}/{len(group.files)})"
    else:
        verdict = VERDICT_DIFFERENT
    if unreadable and verdict != VERDICT_ERROR:
        verdict += f" — {unreadable} illisible(s)"
    group.verdict = verdict
    return verdict


# --------------------------------------------------------------------------- #
# Export
# --------------------------------------------------------------------------- #
def export_csv(groups: list[DuplicateGroup], path: str) -> None:
    """CSV UTF-8 avec BOM et séparateur « ; » : s'ouvre directement dans Excel (FR)."""
    import csv
    from datetime import datetime
    with open(path, "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.writer(fh, delimiter=";")
        w.writerow(["Groupe", "Nom", "Copies", "Disques", "Verdict", "Disque",
                    "Chemin", "Taille (octets)", "Modifié le"])
        for i, g in enumerate(groups, 1):
            for f in g.files:
                w.writerow([i, g.name, g.count, len(g.roots), g.verdict, f.root, f.path,
                            f.size, datetime.fromtimestamp(f.mtime).strftime("%Y-%m-%d %H:%M")])
