"""Détection des disques (internes, amovibles, réseau) sur Windows, macOS et Linux.

Remarque importante : Windows classe la plupart des disques durs / SSD externes
USB comme « fixes » (DRIVE_FIXED) et seulement les clés USB / cartes SD comme
« amovibles » (DRIVE_REMOVABLE). Les deux sont listés : rien n'est masqué.
"""
from __future__ import annotations

import os
import shutil
import string
import sys
from dataclasses import dataclass

KIND_FIXED = "Interne"
KIND_REMOVABLE = "Amovible"
KIND_EXTERNAL = "Externe"
KIND_NETWORK = "Réseau"
KIND_OPTICAL = "CD/DVD"
KIND_RAM = "RAM"
KIND_FOLDER = "Dossier"
KIND_UNKNOWN = "Inconnu"


@dataclass(frozen=True)
class Drive:
    path: str            # racine à parcourir (ex. "C:\\", "/media/usb")
    label: str           # nom du volume
    kind: str            # une des constantes KIND_*
    fs: str = ""         # système de fichiers (NTFS, exFAT, ext4…)
    total: int = 0       # octets
    free: int = 0        # octets

    @property
    def display(self) -> str:
        name = f"{self.path}  {self.label}".strip() if self.label else self.path
        return name


def _usage(path: str) -> tuple[int, int]:
    try:
        u = shutil.disk_usage(path)
        return u.total, u.free
    except OSError:
        return 0, 0


# --------------------------------------------------------------------------- #
# Windows
# --------------------------------------------------------------------------- #
def _windows_drives() -> list[Drive]:
    import ctypes
    from ctypes import wintypes

    k32 = ctypes.WinDLL("kernel32", use_last_error=True)
    k32.GetLogicalDrives.restype = wintypes.DWORD
    k32.GetDriveTypeW.argtypes = [wintypes.LPCWSTR]
    k32.GetDriveTypeW.restype = wintypes.UINT
    k32.GetVolumeInformationW.argtypes = [
        wintypes.LPCWSTR, wintypes.LPWSTR, wintypes.DWORD,
        ctypes.POINTER(wintypes.DWORD), ctypes.POINTER(wintypes.DWORD),
        ctypes.POINTER(wintypes.DWORD), wintypes.LPWSTR, wintypes.DWORD,
    ]
    k32.GetVolumeInformationW.restype = wintypes.BOOL
    # Évite la boîte de dialogue « Aucun disque » sur un lecteur de carte vide.
    SEM_FAILCRITICALERRORS = 0x0001
    old_mode = k32.SetErrorMode(SEM_FAILCRITICALERRORS)

    kinds = {2: KIND_REMOVABLE, 3: KIND_FIXED, 4: KIND_NETWORK, 5: KIND_OPTICAL, 6: KIND_RAM}
    drives: list[Drive] = []
    try:
        mask = k32.GetLogicalDrives()
        for i, letter in enumerate(string.ascii_uppercase):
            if not mask & (1 << i):
                continue
            root = f"{letter}:\\"
            kind = kinds.get(k32.GetDriveTypeW(root), KIND_UNKNOWN)
            label_buf = ctypes.create_unicode_buffer(261)
            fs_buf = ctypes.create_unicode_buffer(261)
            ok = k32.GetVolumeInformationW(root, label_buf, 261, None, None, None, fs_buf, 261)
            if not ok:
                # Lecteur sans média (lecteur de carte vide, DVD vide) : ignoré.
                continue
            total, free = _usage(root)
            drives.append(Drive(root, label_buf.value, kind, fs_buf.value, total, free))
    finally:
        k32.SetErrorMode(old_mode)
    return drives


# --------------------------------------------------------------------------- #
# macOS
# --------------------------------------------------------------------------- #
def _mac_drives() -> list[Drive]:
    drives = [Drive("/", "Disque système", KIND_FIXED, "", *_usage("/"))]
    vol_root = "/Volumes"
    try:
        names = sorted(os.listdir(vol_root))
    except OSError:
        names = []
    for name in names:
        p = os.path.join(vol_root, name)
        # « Macintosh HD » est un lien vers « / » : on l'ignore pour ne pas doubler.
        if os.path.islink(p) or not os.path.isdir(p):
            continue
        try:
            if os.path.samefile(p, "/"):
                continue
        except OSError:
            continue
        drives.append(Drive(p, name, KIND_EXTERNAL, "", *_usage(p)))
    return drives


# --------------------------------------------------------------------------- #
# Linux
# --------------------------------------------------------------------------- #
_LINUX_REAL_FS = {
    "ext2", "ext3", "ext4", "btrfs", "xfs", "jfs", "reiserfs", "f2fs", "zfs",
    "vfat", "msdos", "exfat", "ntfs", "ntfs3", "fuseblk", "hfs", "hfsplus",
    "apfs", "iso9660", "udf", "nfs", "nfs4", "cifs", "smb3", "fuse.sshfs",
}
_LINUX_NETWORK_FS = {"nfs", "nfs4", "cifs", "smb3", "fuse.sshfs"}
_LINUX_SKIP_PREFIXES = ("/proc", "/sys", "/dev", "/snap", "/boot", "/var/lib/docker")


def _unescape_mount(s: str) -> str:
    # /proc/mounts encode les espaces etc. en octal (\040).
    out, i = [], 0
    while i < len(s):
        if s[i] == "\\" and i + 3 < len(s) and s[i + 1:i + 4].isdigit():
            out.append(chr(int(s[i + 1:i + 4], 8)))
            i += 4
        else:
            out.append(s[i])
            i += 1
    return "".join(out)


def _linux_is_removable(device: str) -> bool:
    name = os.path.basename(os.path.realpath(device))
    # Partition (sdb1) -> disque parent (sdb)
    candidates = [name]
    sys_cls = f"/sys/class/block/{name}"
    try:
        parent = os.path.basename(os.path.dirname(os.path.realpath(sys_cls)))
        candidates.append(parent)
    except OSError:
        pass
    for c in candidates:
        try:
            with open(f"/sys/block/{c}/removable") as fh:
                if fh.read().strip() == "1":
                    return True
        except OSError:
            continue
    return False


def parse_linux_mounts(text: str) -> list[tuple[str, str, str]]:
    """Retourne [(device, mountpoint, fstype)] pour les vrais systèmes de fichiers."""
    seen_dev: set[str] = set()
    result = []
    for line in text.splitlines():
        parts = line.split()
        if len(parts) < 3:
            continue
        dev, mnt, fs = parts[0], _unescape_mount(parts[1]), parts[2]
        if fs not in _LINUX_REAL_FS:
            continue
        if mnt != "/" and mnt.startswith(_LINUX_SKIP_PREFIXES):
            continue
        if mnt.startswith("/run") and not mnt.startswith("/run/media"):
            continue
        key = dev if dev.startswith("/dev/") else f"{dev}@{mnt}"
        if key in seen_dev:          # bind mounts / montages multiples
            continue
        seen_dev.add(key)
        result.append((dev, mnt, fs))
    return result


def _linux_drives() -> list[Drive]:
    try:
        with open("/proc/self/mounts", encoding="utf-8", errors="replace") as fh:
            text = fh.read()
    except OSError:
        return [Drive("/", "Système", KIND_FIXED, "", *_usage("/"))]
    drives = []
    for dev, mnt, fs in parse_linux_mounts(text):
        if fs in _LINUX_NETWORK_FS:
            kind = KIND_NETWORK
        elif fs in ("iso9660", "udf"):
            kind = KIND_OPTICAL
        elif dev.startswith("/dev/") and _linux_is_removable(dev):
            kind = KIND_REMOVABLE
        elif mnt.startswith(("/media", "/run/media", "/mnt")):
            kind = KIND_EXTERNAL
        else:
            kind = KIND_FIXED
        label = "Système" if mnt == "/" else os.path.basename(mnt)
        drives.append(Drive(mnt, label, kind, fs, *_usage(mnt)))
    return drives


def list_drives() -> list[Drive]:
    """Liste tous les volumes montés, y compris les disques amovibles."""
    if sys.platform == "win32":
        return _windows_drives()
    if sys.platform == "darwin":
        return _mac_drives()
    return _linux_drives()


def human_size(n: float) -> str:
    for unit in ("o", "Ko", "Mo", "Go", "To"):
        if abs(n) < 1024 or unit == "To":
            return f"{n:.0f} {unit}" if unit == "o" else f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} To"
