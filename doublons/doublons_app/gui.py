"""Interface graphique (Tkinter, incluse avec Python : aucune installation requise)."""
from __future__ import annotations

import os
import queue
import subprocess
import sys
import threading
import tkinter as tk
from datetime import datetime
from tkinter import filedialog, messagebox, ttk

from . import __version__
from .core import (DEFAULT_EXCLUDED_DIRS, DuplicateGroup, Scanner, ScanOptions,
                   ScanStats, export_csv, filter_groups, parse_extensions, verify_group)
from .drives import KIND_FOLDER, Drive, human_size, list_drives

CHECK_ON, CHECK_OFF = "☑", "☐"
MAX_ROWS = 20000          # au-delà, Tk ralentit : on affiche les plus gros groupes


def open_location(path: str) -> None:
    """Ouvre l'explorateur sur le fichier (sélectionné quand c'est possible)."""
    try:
        if sys.platform == "win32":
            subprocess.Popen(["explorer", "/select,", os.path.normpath(path)])
        elif sys.platform == "darwin":
            subprocess.Popen(["open", "-R", path])
        else:
            subprocess.Popen(["xdg-open", os.path.dirname(path)])
    except OSError as e:
        messagebox.showerror("Ouverture impossible", str(e))


class App(ttk.Frame):
    def __init__(self, master: tk.Tk):
        super().__init__(master, padding=8)
        self.master = master
        self.q: queue.Queue = queue.Queue()
        self.scanner: Scanner | None = None
        self.verify_cancel = threading.Event()
        self.busy = False
        self.groups: list[DuplicateGroup] = []
        self.shown: list[DuplicateGroup] = []
        self.drives: list[Drive] = []
        self.checked: set[str] = set()
        self.extra_folders: list[Drive] = []
        self._drive_sig = None

        master.title(f"Doublons — recherche multi-disques  v{__version__}")
        master.geometry("1150x760")
        master.minsize(900, 600)
        self._build()
        self.pack(fill="both", expand=True)
        self.refresh_drives(initial=True)
        self.after(100, self._poll_queue)
        self.after(3000, self._watch_drives)

    # ================================================================== UI
    def _build(self) -> None:
        top = ttk.Frame(self)
        top.pack(fill="x")

        # --- Disques -------------------------------------------------------
        dbox = ttk.LabelFrame(top, text="1. Disques à analyser (cliquez pour cocher)", padding=6)
        dbox.pack(side="left", fill="both", expand=True)
        cols = ("check", "type", "fs", "size", "free")
        self.dtree = ttk.Treeview(dbox, columns=cols, height=6, selectmode="browse")
        self.dtree.heading("#0", text="Disque")
        self.dtree.heading("check", text="✓")
        self.dtree.heading("type", text="Type")
        self.dtree.heading("fs", text="Format")
        self.dtree.heading("size", text="Taille")
        self.dtree.heading("free", text="Libre")
        self.dtree.column("#0", width=260)
        self.dtree.column("check", width=30, anchor="center", stretch=False)
        self.dtree.column("type", width=80, stretch=False)
        self.dtree.column("fs", width=70, stretch=False)
        self.dtree.column("size", width=80, anchor="e", stretch=False)
        self.dtree.column("free", width=80, anchor="e", stretch=False)
        self.dtree.pack(side="left", fill="both", expand=True)
        self.dtree.bind("<Button-1>", self._toggle_drive)
        self.dtree.bind("<space>", self._toggle_drive)
        dbtn = ttk.Frame(dbox)
        dbtn.pack(side="left", fill="y", padx=(6, 0))
        ttk.Button(dbtn, text="Actualiser", command=self.refresh_drives).pack(fill="x")
        ttk.Button(dbtn, text="Tout cocher", command=lambda: self._check_all(True)).pack(fill="x", pady=2)
        ttk.Button(dbtn, text="Tout décocher", command=lambda: self._check_all(False)).pack(fill="x")
        ttk.Button(dbtn, text="+ Dossier…", command=self.add_folder).pack(fill="x", pady=(10, 0))
        self.auto_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(dbtn, text="Détecter les\nclés USB", variable=self.auto_var).pack(fill="x", pady=(10, 0))

        # --- Options -------------------------------------------------------
        obox = ttk.LabelFrame(top, text="2. Options", padding=6)
        obox.pack(side="left", fill="y", padx=(8, 0))
        self.case_var = tk.BooleanVar(value=False)
        self.hidden_var = tk.BooleanVar(value=True)
        self.cross_var = tk.BooleanVar(value=False)
        self.samesize_var = tk.BooleanVar(value=False)
        self.ext_var = tk.StringVar()
        self.min_var = tk.StringVar(value="0")
        ttk.Checkbutton(obox, text="Respecter la casse (Photo.JPG ≠ photo.jpg)",
                        variable=self.case_var).grid(row=0, column=0, columnspan=2, sticky="w")
        ttk.Checkbutton(obox, text="Ignorer fichiers/dossiers cachés et système",
                        variable=self.hidden_var).grid(row=1, column=0, columnspan=2, sticky="w")
        ttk.Label(obox, text="Extensions (vide = toutes) :").grid(row=2, column=0, sticky="w", pady=(6, 0))
        ttk.Entry(obox, textvariable=self.ext_var, width=22).grid(row=2, column=1, sticky="we", pady=(6, 0))
        ttk.Label(obox, text="ex. pdf, jpg, docx, mp4", foreground="gray").grid(row=3, column=1, sticky="w")
        ttk.Label(obox, text="Taille minimale (Ko) :").grid(row=4, column=0, sticky="w")
        ttk.Entry(obox, textvariable=self.min_var, width=8).grid(row=4, column=1, sticky="w")
        ttk.Label(obox, text="0 = tout sauf les fichiers vides", foreground="gray").grid(row=5, column=1, sticky="w")
        ttk.Button(obox, text="Dossiers exclus…", command=self.edit_exclusions).grid(
            row=6, column=0, columnspan=2, sticky="w", pady=(6, 0))
        self.excluded = list(DEFAULT_EXCLUDED_DIRS)

        # --- Barre d'action ------------------------------------------------
        bar = ttk.Frame(self)
        bar.pack(fill="x", pady=8)
        self.btn_scan = ttk.Button(bar, text="▶  Rechercher les doublons", command=self.start_scan)
        self.btn_scan.pack(side="left")
        self.btn_stop = ttk.Button(bar, text="■ Arrêter", command=self.stop, state="disabled")
        self.btn_stop.pack(side="left", padx=4)
        self.pbar = ttk.Progressbar(bar, mode="indeterminate", length=160)
        self.pbar.pack(side="left", padx=8)
        self.status = tk.StringVar(value="Sélectionnez un ou plusieurs disques puis lancez la recherche.")
        ttk.Label(bar, textvariable=self.status).pack(side="left", fill="x", expand=True)

        # --- Résultats -----------------------------------------------------
        rbox = ttk.LabelFrame(self, text="3. Résultats", padding=6)
        rbox.pack(fill="both", expand=True)
        flt = ttk.Frame(rbox)
        flt.pack(fill="x", pady=(0, 4))
        ttk.Label(flt, text="Filtrer :").pack(side="left")
        self.filter_var = tk.StringVar()
        e = ttk.Entry(flt, textvariable=self.filter_var, width=24)
        e.pack(side="left", padx=4)
        self.filter_var.trace_add("write", lambda *_: self.apply_filter())
        ttk.Checkbutton(flt, text="Seulement sur des disques différents", variable=self.cross_var,
                        command=self.apply_filter).pack(side="left", padx=8)
        ttk.Checkbutton(flt, text="Même taille uniquement", variable=self.samesize_var,
                        command=self.apply_filter).pack(side="left")
        ttk.Button(flt, text="Exporter CSV…", command=self.export).pack(side="right")
        self.btn_verify = ttk.Button(flt, text="Vérifier le contenu", command=self.verify)
        self.btn_verify.pack(side="right", padx=4)
        ttk.Button(flt, text="Déplier/replier", command=self.toggle_expand).pack(side="right")

        cols = ("copies", "drives", "size", "date", "verdict")
        tf = ttk.Frame(rbox)
        tf.pack(fill="both", expand=True)
        self.rtree = ttk.Treeview(tf, columns=cols, selectmode="extended")
        self.rtree.heading("#0", text="Nom du fichier / emplacement",
                           command=lambda: self.sort_by("name"))
        self.rtree.heading("copies", text="Copies", command=lambda: self.sort_by("copies"))
        self.rtree.heading("drives", text="Disques", command=lambda: self.sort_by("drives"))
        self.rtree.heading("size", text="Taille", command=lambda: self.sort_by("size"))
        self.rtree.heading("date", text="Modifié le")
        self.rtree.heading("verdict", text="Verdict", command=lambda: self.sort_by("verdict"))
        self.rtree.column("#0", width=520)
        self.rtree.column("copies", width=60, anchor="center", stretch=False)
        self.rtree.column("drives", width=110, stretch=False)
        self.rtree.column("size", width=90, anchor="e", stretch=False)
        self.rtree.column("date", width=120, stretch=False)
        self.rtree.column("verdict", width=210, stretch=False)
        ys = ttk.Scrollbar(tf, orient="vertical", command=self.rtree.yview)
        xs = ttk.Scrollbar(tf, orient="horizontal", command=self.rtree.xview)
        self.rtree.configure(yscrollcommand=ys.set, xscrollcommand=xs.set)
        self.rtree.grid(row=0, column=0, sticky="nsew")
        ys.grid(row=0, column=1, sticky="ns")
        xs.grid(row=1, column=0, sticky="ew")
        tf.rowconfigure(0, weight=1)
        tf.columnconfigure(0, weight=1)
        self.rtree.tag_configure("group", font=("TkDefaultFont", 9, "bold"))
        self.rtree.tag_configure("diff", foreground="#b35c00")
        self.rtree.tag_configure("same", foreground="#1a7f37")
        self.rtree.bind("<Double-1>", self._on_double)
        self.rtree.bind("<Button-3>", self._context_menu)
        self.rtree.bind("<Button-2>", self._context_menu)
        self.menu = tk.Menu(self, tearoff=0)
        self.menu.add_command(label="Ouvrir l'emplacement", command=self._open_selected)
        self.menu.add_command(label="Copier le chemin", command=self._copy_selected)
        self.menu.add_command(label="Vérifier le contenu de ce groupe", command=self.verify)

        self.summary = tk.StringVar()
        ttk.Label(rbox, textvariable=self.summary, foreground="gray").pack(fill="x", pady=(4, 0))
        self._expanded = False
        self._sort = ("copies", True)

    # ============================================================== Disques
    def refresh_drives(self, initial: bool = False) -> None:
        try:
            found = list_drives()
        except Exception as e:  # noqa: BLE001 — on ne veut jamais planter ici
            found = []
            self.status.set(f"Détection des disques impossible : {e}")
        old_paths = {d.path for d in self.drives}
        self.drives = found + self.extra_folders
        if initial:
            # Par défaut : tous les disques locaux et amovibles (pas le réseau ni CD).
            self.checked = {d.path for d in found if d.kind not in ("Réseau", "CD/DVD", "RAM")}
        else:
            for d in found:              # nouveau disque branché -> coché d'office
                if d.path not in old_paths and d.kind not in ("Réseau", "CD/DVD"):
                    self.checked.add(d.path)
            self.checked &= {d.path for d in self.drives}
        self._drive_sig = tuple(d.path for d in found)
        self._render_drives()

    def _render_drives(self) -> None:
        self.dtree.delete(*self.dtree.get_children())
        for d in self.drives:
            self.dtree.insert("", "end", iid=d.path, text=d.display, values=(
                CHECK_ON if d.path in self.checked else CHECK_OFF, d.kind, d.fs,
                human_size(d.total) if d.total else "", human_size(d.free) if d.total else ""))

    def _watch_drives(self) -> None:
        """Détecte le branchement / retrait d'une clé USB ou d'un disque externe."""
        if self.auto_var.get() and not self.busy:
            try:
                sig = tuple(d.path for d in list_drives())
            except Exception:  # noqa: BLE001
                sig = self._drive_sig
            if sig != self._drive_sig:
                before = set(self._drive_sig or ())
                self.refresh_drives()
                added = set(sig) - before
                if added:
                    self.status.set("Nouveau disque détecté : " + ", ".join(sorted(added)))
        self.after(3000, self._watch_drives)

    def _toggle_drive(self, event) -> str | None:
        if self.busy:
            return "break"
        iid = self.dtree.identify_row(event.y) if event.type == tk.EventType.ButtonPress else self.dtree.focus()
        if not iid:
            return None
        if iid in self.checked:
            self.checked.discard(iid)
        else:
            self.checked.add(iid)
        self._render_drives()
        self.dtree.focus(iid)
        return "break"

    def _check_all(self, on: bool) -> None:
        self.checked = {d.path for d in self.drives} if on else set()
        self._render_drives()

    def add_folder(self) -> None:
        p = filedialog.askdirectory(title="Ajouter un dossier à analyser")
        if not p:
            return
        p = os.path.abspath(p)
        if p not in {d.path for d in self.drives}:
            self.extra_folders.append(Drive(p, "", KIND_FOLDER))
        self.checked.add(p)
        self.refresh_drives()

    def edit_exclusions(self) -> None:
        win = tk.Toplevel(self)
        win.title("Dossiers exclus")
        win.transient(self.master)
        ttk.Label(win, text="Un nom de dossier par ligne (ignoré partout, insensible à la casse) :",
                  padding=6).pack(fill="x")
        txt = tk.Text(win, width=50, height=18)
        txt.pack(fill="both", expand=True, padx=6)
        txt.insert("1.0", "\n".join(self.excluded))

        def save():
            self.excluded = [l.strip() for l in txt.get("1.0", "end").splitlines() if l.strip()]
            win.destroy()
        b = ttk.Frame(win, padding=6)
        b.pack(fill="x")
        ttk.Button(b, text="Rétablir par défaut", command=lambda: (txt.delete("1.0", "end"),
                   txt.insert("1.0", "\n".join(DEFAULT_EXCLUDED_DIRS)))).pack(side="left")
        ttk.Button(b, text="Enregistrer", command=save).pack(side="right")

    # ================================================================= Scan
    def _scan_options(self) -> ScanOptions | None:
        try:
            min_kb = float(self.min_var.get().replace(",", ".") or 0)
        except ValueError:
            messagebox.showwarning("Option invalide", "La taille minimale doit être un nombre (Ko).")
            return None
        return ScanOptions(
            case_sensitive=self.case_var.get(),
            min_size=max(1, int(min_kb * 1024)),
            extensions=parse_extensions(self.ext_var.get()),
            skip_hidden=self.hidden_var.get(),
            excluded_dirs=self.excluded,
        )

    def start_scan(self) -> None:
        roots = [d.path for d in self.drives if d.path in self.checked]
        if not roots:
            messagebox.showinfo("Aucun disque", "Cochez au moins un disque ou un dossier.")
            return
        opt = self._scan_options()
        if opt is None:
            return
        self._set_busy(True)
        self.rtree.delete(*self.rtree.get_children())
        self.groups, self.shown = [], []
        self.summary.set("")
        self.scanner = Scanner(opt, progress=lambda s: self.q.put(("progress", s)))
        sc = self.scanner

        def work():
            try:
                groups = sc.scan(roots)
                self.q.put(("done", groups))
            except Exception as e:  # noqa: BLE001
                self.q.put(("error", e))
        threading.Thread(target=work, daemon=True).start()

    def stop(self) -> None:
        if self.scanner:
            self.scanner.cancel()
        self.verify_cancel.set()
        self.status.set("Arrêt en cours…")

    def _set_busy(self, busy: bool) -> None:
        self.busy = busy
        self.btn_scan.configure(state="disabled" if busy else "normal")
        self.btn_verify.configure(state="disabled" if busy else "normal")
        self.btn_stop.configure(state="normal" if busy else "disabled")
        if busy:
            self.pbar.start(12)
        else:
            self.pbar.stop()
            self.pbar["value"] = 0

    def _poll_queue(self) -> None:
        try:
            while True:
                kind, payload = self.q.get_nowait()
                if kind == "progress":
                    s: ScanStats = payload
                    cur = s.current if len(s.current) < 70 else "…" + s.current[-68:]
                    self.status.set(f"{s.files:,} fichiers · {s.dirs:,} dossiers · {s.elapsed:.0f} s  {cur}"
                                    .replace(",", " "))
                elif kind == "done":
                    self._set_busy(False)
                    self.groups = payload
                    s = self.scanner.stats
                    msg = (f"Terminé en {s.elapsed:.1f} s : {s.files:,} fichiers analysés, "
                           f"{len(self.groups):,} noms en double.").replace(",", " ")
                    if self.scanner.cancelled:
                        msg = "Interrompu — résultats partiels. " + msg
                    if s.errors:
                        msg += f"  ({s.errors} éléments inaccessibles ignorés)"
                    self.status.set(msg)
                    self.apply_filter()
                elif kind == "verified":
                    done, total = payload
                    self.status.set(f"Vérification du contenu : {done}/{total} groupes…")
                    if done == total or done % 20 == 0:
                        self.apply_filter(keep_open=True)
                elif kind == "verify_end":
                    self._set_busy(False)
                    self.apply_filter(keep_open=True)
                    self.status.set(payload)
                elif kind == "error":
                    self._set_busy(False)
                    messagebox.showerror("Erreur", str(payload))
        except queue.Empty:
            pass
        self.after(100, self._poll_queue)

    # ============================================================ Résultats
    def apply_filter(self, keep_open: bool = False) -> None:
        if self.busy and not keep_open:
            return
        opened = {i for i in self.rtree.get_children() if self.rtree.item(i, "open")} if keep_open else set()
        self.shown = filter_groups(self.groups, cross_drive_only=self.cross_var.get(),
                                   same_size_only=self.samesize_var.get(), text=self.filter_var.get())
        self._sort_shown()
        self.rtree.delete(*self.rtree.get_children())
        rows = 0
        for gi, g in enumerate(self.shown):
            if rows > MAX_ROWS:
                break
            roots = sorted(g.roots)
            drives = ", ".join(r.rstrip("\\/") or "/" for r in roots)
            if not g.same_size:
                size_txt = "tailles ≠"
            else:
                size_txt = human_size(g.files[0].size)
            verdict = g.verdict or ("même taille" if g.same_size else "tailles différentes")
            tag = "same" if g.verdict.startswith("Contenu identique") else (
                "diff" if (g.verdict.startswith("Contenu diff") or not g.same_size) else "")
            gid = f"g{gi}"
            self.rtree.insert("", "end", iid=gid, text=g.name, open=gid in opened,
                              values=(g.count, f"{len(roots)} : {drives}", size_txt, "", verdict),
                              tags=("group", tag))
            for fi, f in enumerate(g.files):
                self.rtree.insert(gid, "end", iid=f"{gid}f{fi}", text=f.path, values=(
                    "", f.root.rstrip("\\/") or "/", human_size(f.size),
                    datetime.fromtimestamp(f.mtime).strftime("%Y-%m-%d %H:%M"), ""))
            rows += 1 + g.count
        total_files = sum(g.count for g in self.shown)
        cross = sum(1 for g in self.shown if len(g.roots) > 1)
        same = [g for g in self.shown if g.verdict.startswith("Contenu identique")]
        txt = (f"{len(self.shown):,} groupes affichés · {total_files:,} fichiers · "
               f"{cross:,} groupes présents sur plusieurs disques").replace(",", " ")
        if same:
            txt += f" · {human_size(sum(g.wasted for g in same))} récupérables (contenu vérifié identique)"
        if rows > MAX_ROWS:
            txt += f" · affichage limité aux {MAX_ROWS} premières lignes (affinez le filtre ou exportez en CSV)"
        self.summary.set(txt)

    def sort_by(self, key: str) -> None:
        cur, desc = self._sort
        self._sort = (key, not desc if cur == key else key != "name")
        self.apply_filter()

    def _sort_shown(self) -> None:
        key, desc = self._sort
        keyf = {
            "name": lambda g: g.name.casefold(),
            "copies": lambda g: (g.count, g.total_size),
            "drives": lambda g: (len(g.roots), g.count),
            "size": lambda g: g.total_size,
            "verdict": lambda g: g.verdict,
        }[key]
        self.shown.sort(key=keyf, reverse=desc)

    def toggle_expand(self) -> None:
        self._expanded = not self._expanded
        for i in self.rtree.get_children():
            self.rtree.item(i, open=self._expanded)

    def _path_of(self, iid: str) -> str | None:
        if "f" not in iid:
            return None
        gi, fi = iid[1:].split("f")
        return self.shown[int(gi)].files[int(fi)].path

    def _on_double(self, event) -> None:
        iid = self.rtree.identify_row(event.y)
        p = self._path_of(iid) if iid else None
        if p:
            open_location(p)

    def _context_menu(self, event) -> None:
        iid = self.rtree.identify_row(event.y)
        if iid:
            if iid not in self.rtree.selection():
                self.rtree.selection_set(iid)
            self.menu.tk_popup(event.x_root, event.y_root)

    def _open_selected(self) -> None:
        for iid in self.rtree.selection():
            p = self._path_of(iid)
            if p:
                open_location(p)
                return

    def _copy_selected(self) -> None:
        paths = [p for p in (self._path_of(i) for i in self.rtree.selection()) if p]
        if paths:
            self.clipboard_clear()
            self.clipboard_append("\n".join(paths))

    def _selected_groups(self) -> list[DuplicateGroup]:
        idx = set()
        for iid in self.rtree.selection():
            idx.add(int(iid[1:].split("f")[0]))
        return [self.shown[i] for i in sorted(idx)]

    def verify(self) -> None:
        if self.busy:
            return
        targets = self._selected_groups()
        if not targets:
            targets = list(self.shown)
            if not targets:
                messagebox.showinfo("Rien à vérifier", "Aucun groupe affiché.")
                return
            volume = 0
            for g in targets:
                sizes = [f.size for f in g.files]
                volume += sum(s for s in sizes if sizes.count(s) > 1)
            if not messagebox.askyesno(
                    "Vérifier le contenu",
                    f"Aucun groupe sélectionné : vérifier les {len(targets)} groupes affichés ?\n\nVolume à lire au maximum : {human_size(volume)}.\n"
                    "Seuls les fichiers de même taille sont lus, et d'abord partiellement."):
                return
        self.verify_cancel.clear()
        self._set_busy(True)
        cancel = self.verify_cancel

        def work():
            n = len(targets)
            for i, g in enumerate(targets, 1):
                if cancel.is_set():
                    break
                try:
                    verify_group(g, cancel)
                except InterruptedError:
                    break
                self.q.put(("verified", (i, n)))
            ident = sum(1 for g in targets if g.verdict.startswith("Contenu identique"))
            msg = f"Vérification terminée : {ident}/{len(targets)} groupes au contenu strictement identique."
            if cancel.is_set():
                msg = "Vérification interrompue. " + msg
            self.q.put(("verify_end", msg))
        threading.Thread(target=work, daemon=True).start()

    def export(self) -> None:
        if not self.shown:
            messagebox.showinfo("Export", "Aucun résultat à exporter.")
            return
        p = filedialog.asksaveasfilename(
            title="Exporter les doublons", defaultextension=".csv",
            initialfile=f"doublons_{datetime.now():%Y%m%d_%H%M}.csv",
            filetypes=[("CSV (Excel)", "*.csv")])
        if p:
            try:
                export_csv(self.shown, p)
                self.status.set(f"Exporté : {p}")
            except OSError as e:
                messagebox.showerror("Export impossible", str(e))


def main() -> None:
    if sys.platform == "win32":
        try:  # affichage net sur écrans haute résolution
            import ctypes
            ctypes.windll.shcore.SetProcessDpiAwareness(1)
        except Exception:  # noqa: BLE001
            pass
    root = tk.Tk()
    try:
        ttk.Style(root).theme_use("vista" if sys.platform == "win32" else "clam")
    except tk.TclError:
        pass
    App(root)
    root.mainloop()
