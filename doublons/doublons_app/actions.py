"""Actions sur les fichiers : ouvrir, montrer dans l'explorateur, corbeille, suppression.

Attention : la corbeille n'existe pas partout. Sous Windows, les clés USB, cartes SD et
lecteurs réseau n'ont pas de Corbeille : un fichier « mis à la corbeille » y est en
réalité supprimé définitivement. L'interface prévient l'utilisateur avant.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
import time
from datetime import datetime
from urllib.parse import quote

from .core import _long


class ActionError(OSError):
    pass


# --------------------------------------------------------------------------- #
# Ouvrir
# --------------------------------------------------------------------------- #
def open_file(path: str) -> None:
    """Ouvre le fichier avec l'application par défaut du système."""
    if not os.path.exists(path):
        raise ActionError(f"Fichier introuvable : {path}")
    if sys.platform == "win32":
        os.startfile(path)  # type: ignore[attr-defined]
    elif sys.platform == "darwin":
        subprocess.Popen(["open", path])
    else:
        subprocess.Popen(["xdg-open", path])


def show_in_folder(path: str) -> None:
    """Ouvre l'explorateur avec le fichier sélectionné."""
    if sys.platform == "win32":
        subprocess.Popen(["explorer", "/select,", os.path.normpath(path)])
    elif sys.platform == "darwin":
        subprocess.Popen(["open", "-R", path])
    else:
        subprocess.Popen(["xdg-open", os.path.dirname(path)])


# --------------------------------------------------------------------------- #
# Supprimer
# --------------------------------------------------------------------------- #
def delete_permanently(path: str) -> None:
    try:
        os.remove(_long(path))
    except FileNotFoundError:
        pass                                   # déjà supprimé : objectif atteint
    except PermissionError:
        # Fichier en lecture seule (fréquent sur des copies venant de CD) : on retire l'attribut.
        import stat
        os.chmod(_long(path), stat.S_IWRITE | stat.S_IREAD)
        os.remove(_long(path))


def move_to_trash(path: str) -> None:
    if not os.path.lexists(path):
        return
    if sys.platform == "win32":
        _trash_windows(path)
    elif sys.platform == "darwin":
        _trash_mac(path)
    else:
        _trash_linux(path)


def _trash_windows(path: str) -> None:
    import ctypes
    from ctypes import wintypes

    class SHFILEOPSTRUCTW(ctypes.Structure):
        _fields_ = [("hwnd", wintypes.HWND), ("wFunc", wintypes.UINT),
                    ("pFrom", wintypes.LPCWSTR), ("pTo", wintypes.LPCWSTR),
                    ("fFlags", ctypes.c_ushort), ("fAnyOperationsAborted", wintypes.BOOL),
                    ("hNameMappings", ctypes.c_void_p), ("lpszProgressTitle", wintypes.LPCWSTR)]

    FO_DELETE = 3
    FOF_SILENT, FOF_NOCONFIRMATION, FOF_ALLOWUNDO, FOF_NOERRORUI = 0x4, 0x10, 0x40, 0x400
    op = SHFILEOPSTRUCTW()
    op.wFunc = FO_DELETE
    op.pFrom = os.path.abspath(path) + "\0"     # liste terminée par un double \0
    op.fFlags = FOF_ALLOWUNDO | FOF_NOCONFIRMATION | FOF_SILENT | FOF_NOERRORUI
    rc = ctypes.windll.shell32.SHFileOperationW(ctypes.byref(op))
    if rc != 0 or op.fAnyOperationsAborted:
        raise ActionError(f"Mise à la corbeille impossible (code {rc}) : {path}")


def _trash_mac(path: str) -> None:
    esc = os.path.abspath(path).replace("\\", "\\\\").replace('"', '\\"')
    r = subprocess.run(["osascript", "-e", f'tell application "Finder" to delete POSIX file "{esc}"'],
                       capture_output=True, text=True)
    if r.returncode != 0:
        raise ActionError(r.stderr.strip() or f"Mise à la corbeille impossible : {path}")


def _trash_linux(path: str) -> None:
    gio = shutil.which("gio")
    if gio:
        r = subprocess.run([gio, "trash", path], capture_output=True, text=True)
        if r.returncode == 0:
            return
    trash_home(path)


def trash_home(path: str, trash_dir: str | None = None) -> str:
    """Corbeille freedesktop.org (~/.local/share/Trash) ; retourne le chemin dans la corbeille."""
    base = trash_dir or os.path.join(os.environ.get("XDG_DATA_HOME") or
                                     os.path.expanduser("~/.local/share"), "Trash")
    files_dir, info_dir = os.path.join(base, "files"), os.path.join(base, "info")
    os.makedirs(files_dir, exist_ok=True)
    os.makedirs(info_dir, exist_ok=True)
    name = os.path.basename(path)
    stem, ext = os.path.splitext(name)
    candidate, n = name, 1
    while os.path.lexists(os.path.join(files_dir, candidate)) or \
            os.path.lexists(os.path.join(info_dir, candidate + ".trashinfo")):
        n += 1
        candidate = f"{stem}.{n}{ext}"
    with open(os.path.join(info_dir, candidate + ".trashinfo"), "w", encoding="utf-8") as fh:
        fh.write("[Trash Info]\nPath=%s\nDeletionDate=%s\n" % (
            quote(os.path.abspath(path)), time.strftime("%Y-%m-%dT%H:%M:%S")))
    dest = os.path.join(files_dir, candidate)
    shutil.move(path, dest)
    return dest


# --------------------------------------------------------------------------- #
# Journal
# --------------------------------------------------------------------------- #
def log_path() -> str:
    return os.path.join(os.path.expanduser("~"), "Doublons_suppressions.csv")


def log_deletions(rows: list[tuple[str, int, str, str]], path: str | None = None) -> str:
    """Ajoute (chemin, taille, mode, résultat) au journal CSV des suppressions."""
    import csv
    p = path or log_path()
    new = not os.path.exists(p)
    with open(p, "a", newline="", encoding="utf-8-sig" if new else "utf-8") as fh:
        w = csv.writer(fh, delimiter=";")
        if new:
            w.writerow(["Date", "Chemin", "Taille (octets)", "Mode", "Résultat"])
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        for r in rows:
            w.writerow([now, *r])
    return p
