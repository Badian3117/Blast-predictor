"""Interface graphique (Tkinter, incluse avec Python : aucune installation requise)."""
from __future__ import annotations

import os
import queue
import sys
import threading
import tkinter as tk
from datetime import datetime
from tkinter import filedialog, messagebox, ttk

from . import __version__
from .actions import (delete_permanently, log_deletions, move_to_trash, open_file,
                      show_in_folder)
from .core import (DEFAULT_EXCLUDED_DIRS, KEEP_NEWEST, KEEP_OLDEST, KEEP_SHORTEST,
                   VERDICT_IDENTICAL, DuplicateGroup, FileEntry, Scanner, ScanOptions,
                   ScanStats, export_csv, filter_groups, parse_extensions, remove_paths,
                   select_copies, verify_group)
from .drives import (KIND_FOLDER, KIND_NETWORK, KIND_REMOVABLE, Drive, human_size,
                     list_drives)

try:  # Pillow est optionnel : sans lui, l'aperçu image se limite à PNG/GIF.
    from PIL import Image, ImageTk
except Exception:  # noqa: BLE001
    Image = ImageTk = None

CHECK_ON, CHECK_OFF = "☑", "☐"
MAX_ROWS = 20000          # au-delà, Tk ralentit : on affiche les plus gros groupes


TEXT_EXT = {".txt", ".csv", ".log", ".md", ".ini", ".cfg", ".conf", ".json", ".xml",
            ".html", ".htm", ".css", ".js", ".py", ".bat", ".ps1", ".sh", ".yml", ".yaml",
            ".sql", ".srt", ".tex", ".c", ".h", ".cpp", ".java", ".cs", ".vb", ".reg"}
PIL_EXT = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tif", ".tiff", ".webp", ".ico"}
TK_EXT = {".png", ".gif", ".ppm", ".pgm"}
PREVIEW_MAX = 280


def _safe(action, path: str, title: str) -> None:
    try:
        action(path)
    except OSError as e:
        messagebox.showerror(title, str(e))


def open_location(path: str) -> None:
    _safe(show_in_folder, path, "Ouverture de l'emplacement impossible")


def open_with_default_app(path: str) -> None:
    _safe(open_file, path, "Ouverture impossible")


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
        master.geometry("1280x800")
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

        act = ttk.Frame(rbox)
        act.pack(fill="x", pady=(0, 4))
        ttk.Button(act, text="▶ Ouvrir", command=self._open_selected_file).pack(side="left")
        ttk.Button(act, text="📂 Emplacement", command=self._open_selected).pack(side="left", padx=4)
        ttk.Separator(act, orient="vertical").pack(side="left", fill="y", padx=6)
        auto = ttk.Menubutton(act, text="Sélection auto ▾")
        auto.pack(side="left")
        self.auto_menu = tk.Menu(auto, tearoff=0)
        auto["menu"] = self.auto_menu
        self.verified_only_var = tk.BooleanVar(value=True)
        self.auto_menu.configure(postcommand=self._build_auto_menu)
        ttk.Button(act, text="Désélectionner", command=self._clear_selection).pack(side="left", padx=4)
        ttk.Separator(act, orient="vertical").pack(side="left", fill="y", padx=6)
        self.btn_delete = ttk.Button(act, text="🗑 Supprimer la sélection…", command=self.delete_selected)
        self.btn_delete.pack(side="left")
        self.del_mode = tk.StringVar(value="trash")
        ttk.Radiobutton(act, text="Corbeille", value="trash", variable=self.del_mode).pack(side="left", padx=(8, 0))
        ttk.Radiobutton(act, text="Définitive", value="perm", variable=self.del_mode).pack(side="left", padx=4)
        self.sel_info = tk.StringVar(value="")
        ttk.Label(act, textvariable=self.sel_info, foreground="#1f5fa8").pack(side="right")

        cols = ("copies", "drives", "size", "date", "verdict")
        pane = ttk.PanedWindow(rbox, orient="horizontal")
        pane.pack(fill="both", expand=True)
        tf = ttk.Frame(pane)
        pane.add(tf, weight=3)
        self._build_preview(pane)
        # Largeur initiale du panneau d'aperçu une fois la fenêtre affichée.
        self.after(300, lambda: pane.sashpos(0, max(400, pane.winfo_width() - PREVIEW_MAX - 40)))
        self.rtree = ttk.Treeview(tf, columns=cols, selectmode="extended")
        self.rtree.heading("#0", text="Nom du fichier / emplacement",
                           command=lambda: self.sort_by("name"))
        self.rtree.heading("copies", text="Copies", command=lambda: self.sort_by("copies"))
        self.rtree.heading("drives", text="Disques", command=lambda: self.sort_by("drives"))
        self.rtree.heading("size", text="Taille", command=lambda: self.sort_by("size"))
        self.rtree.heading("date", text="Modifié le")
        self.rtree.heading("verdict", text="Verdict", command=lambda: self.sort_by("verdict"))
        self.rtree.column("#0", width=420)
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
        self.rtree.bind("<Return>", lambda e: self._open_selected_file())
        self.rtree.bind("<Delete>", lambda e: self.delete_selected())
        self.rtree.bind("<<TreeviewSelect>>", self._on_select)
        self.rtree.bind("<Button-3>", self._context_menu)
        self.rtree.bind("<Button-2>", self._context_menu)
        self.menu = tk.Menu(self, tearoff=0)
        self.menu.add_command(label="Ouvrir le fichier", command=self._open_selected_file)
        self.menu.add_command(label="Ouvrir l'emplacement", command=self._open_selected)
        self.menu.add_command(label="Copier le chemin", command=self._copy_selected)
        self.menu.add_separator()
        self.menu.add_command(label="Sélectionner les autres copies du groupe",
                              command=self._select_others_in_group)
        self.menu.add_command(label="Vérifier le contenu de ce groupe", command=self.verify)
        self.menu.add_separator()
        self.menu.add_command(label="Supprimer la sélection…", command=self.delete_selected)

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
        self.btn_delete.configure(state="disabled" if busy else "normal")
        self.btn_stop.configure(state="normal" if busy else "disabled")
        if busy:
            self.pbar.configure(mode="indeterminate")
            self.pbar.start(12)
        else:
            self.pbar.stop()
            self.pbar.configure(mode="determinate", value=0)

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
                elif kind == "deleted":
                    self._after_delete(*payload)
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
            open_with_default_app(p)

    def _context_menu(self, event) -> None:
        iid = self.rtree.identify_row(event.y)
        if iid:
            if iid not in self.rtree.selection():
                self.rtree.selection_set(iid)
            self.menu.tk_popup(event.x_root, event.y_root)

    def _open_selected(self) -> None:
        for iid in list(self.rtree.selection()) or [self.rtree.focus()]:
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

    def _entry_of(self, iid: str) -> tuple[DuplicateGroup, FileEntry] | None:
        if "f" not in iid:
            return None
        gi, fi = iid[1:].split("f")
        g = self.shown[int(gi)]
        return g, g.files[int(fi)]

    def _selected_entries(self) -> list[tuple[DuplicateGroup, FileEntry]]:
        return [e for e in (self._entry_of(i) for i in self.rtree.selection()) if e]

    def _open_selected_file(self) -> None:
        sel = self._selected_entries()
        if not sel:
            messagebox.showinfo("Ouvrir", "Sélectionnez un fichier (une ligne sous un nom de groupe).")
            return
        if len(sel) > 5 and not messagebox.askyesno("Ouvrir", f"Ouvrir {len(sel)} fichiers ?"):
            return
        for _, f in sel:
            open_with_default_app(f.path)

    # ------------------------------------------------------------ Aperçu
    def _build_preview(self, pane: ttk.PanedWindow) -> None:
        pv = ttk.LabelFrame(pane, text="Aperçu", padding=6)
        pane.add(pv, weight=1)
        self.pv_title = tk.StringVar(value="Sélectionnez un fichier")
        self.pv_meta = tk.StringVar(value="")
        ttk.Label(pv, textvariable=self.pv_title, font=("TkDefaultFont", 10, "bold"),
                  wraplength=PREVIEW_MAX + 20).pack(fill="x")
        ttk.Label(pv, textvariable=self.pv_meta, foreground="gray", justify="left",
                  wraplength=PREVIEW_MAX + 20).pack(fill="x", pady=(2, 6))
        self.pv_image = ttk.Label(pv, anchor="center")
        self.pv_image.pack(fill="x")
        self.pv_text = tk.Text(pv, width=40, height=14, wrap="none", font=("TkFixedFont", 9),
                               relief="flat", background="#f6f6f6")
        self.pv_text.configure(state="disabled")
        b = ttk.Frame(pv)
        b.pack(side="bottom", fill="x", pady=(6, 0))
        ttk.Button(b, text="▶ Ouvrir", command=self._open_selected_file).pack(side="left")
        ttk.Button(b, text="📂 Emplacement", command=self._open_selected).pack(side="left", padx=4)
        self._pv_photo = None

    def _on_select(self, _event=None) -> None:
        sel = self._selected_entries()
        if sel:
            total = sum(f.size for _, f in sel)
            self.sel_info.set(f"{len(sel)} fichier(s) sélectionné(s) · {human_size(total)}")
        else:
            self.sel_info.set("")
        focus = self.rtree.focus()
        entry = self._entry_of(focus) if focus else None
        if entry is None and sel:
            entry = sel[0]
        self._show_preview(entry)

    def _show_preview(self, entry) -> None:
        self._pv_photo = None
        self.pv_image.configure(image="", text="")
        self.pv_text.pack_forget()
        if entry is None:
            self.pv_title.set("Sélectionnez un fichier")
            self.pv_meta.set("Double-clic ou Entrée : ouvrir · Suppr : supprimer\n"
                             "Ctrl/Maj + clic : sélection multiple")
            return
        g, f = entry
        self.pv_title.set(os.path.basename(f.path))
        self.pv_meta.set(f"{os.path.dirname(f.path)}\n{human_size(f.size)} · modifié le "
                         f"{datetime.fromtimestamp(f.mtime):%d/%m/%Y %H:%M}\n"
                         f"{g.count} copies · {g.verdict or 'contenu non vérifié'}")
        ext = os.path.splitext(f.path)[1].lower()
        if not os.path.exists(f.path):
            self.pv_image.configure(text="Fichier introuvable (déplacé ou disque retiré ?)")
            return
        try:
            if ext in PIL_EXT and Image is not None and f.size < 80 * 1024 * 1024:
                with Image.open(f.path) as im:
                    im.thumbnail((PREVIEW_MAX, PREVIEW_MAX))
                    self._pv_photo = ImageTk.PhotoImage(im.copy())
                self.pv_image.configure(image=self._pv_photo)
                return
            if ext in TK_EXT and f.size < 30 * 1024 * 1024:
                img = tk.PhotoImage(file=f.path)
                k = max(1, -(-max(img.width(), img.height()) // PREVIEW_MAX))
                self._pv_photo = img.subsample(k, k) if k > 1 else img
                self.pv_image.configure(image=self._pv_photo)
                return
            with open(f.path, "rb") as fh:
                head = fh.read(8192)
            if ext in TEXT_EXT or (head and b"\0" not in head):
                enc = "utf-16" if head.startswith((b"\xff\xfe", b"\xfe\xff")) else "utf-8"
                try:
                    txt = head.decode(enc)
                except UnicodeDecodeError:      # texte Windows ancien (ANSI) ou coupé en plein caractère
                    txt = head.decode("cp1252" if enc == "utf-8" else enc, errors="replace")
                self.pv_text.configure(state="normal")
                self.pv_text.delete("1.0", "end")
                self.pv_text.insert("1.0", txt + ("\n…" if f.size > len(head) else ""))
                self.pv_text.configure(state="disabled")
                self.pv_text.pack(fill="both", expand=True)
                return
            self.pv_image.configure(text="Pas d'aperçu pour ce type de fichier.\n"
                                         "Cliquez « Ouvrir » pour le lire avec\nl'application habituelle.")
        except Exception as e:  # noqa: BLE001 — un aperçu raté ne doit rien bloquer
            self.pv_image.configure(text=f"Aperçu impossible : {e}")

    # ------------------------------------------------------- Sélection
    def _clear_selection(self) -> None:
        self.rtree.selection_set([])

    def _select_iids(self, iids: list[str]) -> None:
        for iid in iids:
            self.rtree.item(iid.split("f")[0], open=True)
        self.rtree.selection_set(iids)
        if iids:
            self.rtree.see(iids[0])

    def _select_others_in_group(self) -> None:
        iid = self.rtree.focus()
        if "f" not in iid:
            return
        gid = iid.split("f")[0]
        self._select_iids([c for c in self.rtree.get_children(gid) if c != iid])

    def _build_auto_menu(self) -> None:
        m = self.auto_menu
        m.delete(0, "end")
        m.add_command(label="Garder la copie la plus récente de chaque groupe",
                      command=lambda: self.auto_select(KEEP_NEWEST))
        m.add_command(label="Garder la copie la plus ancienne",
                      command=lambda: self.auto_select(KEEP_OLDEST))
        m.add_command(label="Garder la copie au chemin le plus court",
                      command=lambda: self.auto_select(KEEP_SHORTEST))
        sub = tk.Menu(m, tearoff=0)
        for r in sorted({f.root for g in self.shown for f in g.files}):
            sub.add_command(label=r, command=lambda r=r: self.auto_select(KEEP_NEWEST, r))
        m.add_cascade(label="Garder la copie située sur le disque…", menu=sub)
        m.add_separator()
        m.add_checkbutton(label="Uniquement les groupes au contenu vérifié identique (recommandé)",
                          variable=self.verified_only_var)

    def auto_select(self, keep: str, keep_root: str | None = None) -> None:
        verified_only = self.verified_only_var.get()
        targets = select_copies(self.shown, keep, keep_root, verified_only)
        if not targets:
            if verified_only:
                messagebox.showinfo(
                    "Sélection auto",
                    "Aucun groupe au contenu vérifié identique parmi les résultats affichés.\n\n"
                    "Cliquez d'abord « Vérifier le contenu », ou décochez l'option "
                    "« Uniquement les groupes au contenu vérifié identique » (déconseillé).")
            else:
                messagebox.showinfo("Sélection auto", "Aucun fichier à sélectionner.")
            return
        ids = {id(f) for f in targets}
        iids = [f"g{gi}f{fi}" for gi, g in enumerate(self.shown)
                for fi, f in enumerate(g.files) if id(f) in ids]
        iids = [i for i in iids if self.rtree.exists(i)]
        self._select_iids(iids)
        self.status.set(f"{len(iids)} copie(s) sélectionnée(s) (une copie conservée par groupe). "
                        "Vérifiez puis cliquez « Supprimer la sélection ».")

    # ------------------------------------------------------- Suppression
    def _drive_kind(self, path: str) -> str:
        best, kind = -1, ""
        pn = os.path.normcase(path)
        for d in self.drives:
            if d.kind == KIND_FOLDER:
                continue
            dn = os.path.normcase(d.path)
            if pn.startswith(dn) and len(dn) > best:
                best, kind = len(dn), d.kind
        return kind

    def delete_selected(self) -> None:
        if self.busy:
            return
        sel = self._selected_entries()
        if not sel:
            messagebox.showinfo("Supprimer", "Sélectionnez un ou plusieurs fichiers "
                                "(Ctrl + clic, Maj + clic, ou « Sélection auto »).")
            return
        mode = self.del_mode.get()
        files = [f for _, f in sel]
        total = sum(f.size for f in files)

        # 1. Garde-fou : toutes les copies d'un même groupe sélectionnées ?
        per_group: dict[int, list[FileEntry]] = {}
        for g, f in sel:
            per_group.setdefault(id(g), []).append(f)
        groups_by_id = {id(g): g for g, _ in sel}
        wiped = [groups_by_id[k].name for k, v in per_group.items() if len(v) == groups_by_id[k].count]
        if wiped:
            names = "\n".join("  • " + n for n in wiped[:10]) + ("\n  …" if len(wiped) > 10 else "")
            if not messagebox.askyesno(
                    "⚠ Toutes les copies sélectionnées", icon="warning", default="no",
                    message=f"Pour {len(wiped)} fichier(s), TOUTES les copies sont sélectionnées :\n"
                            f"{names}\n\nIl n'en restera AUCUN exemplaire. Continuer quand même ?"):
                return

        # 2. Avertissements
        notes = []
        unverified = sum(1 for g, _ in sel if not g.verdict.startswith(VERDICT_IDENTICAL))
        if unverified:
            notes.append(f"⚠ {unverified} fichier(s) appartiennent à des groupes dont le contenu "
                         "n'a PAS été vérifié identique : ce sont peut-être des fichiers différents "
                         "portant le même nom.")
        if mode == "trash" and sys.platform == "win32":
            no_bin = sum(1 for f in files if self._drive_kind(f.path) in (KIND_REMOVABLE, KIND_NETWORK))
            if no_bin:
                notes.append(f"⚠ {no_bin} fichier(s) sont sur une clé USB, carte SD ou un lecteur réseau : "
                             "Windows n'y a pas de Corbeille, ils seront supprimés DÉFINITIVEMENT.")
        if mode == "perm":
            notes.append("⚠ Suppression DÉFINITIVE : aucune récupération possible depuis la Corbeille.")
        listing = "\n".join("  " + f.path for f in files[:8]) + (
            f"\n  … et {len(files) - 8} autre(s)" if len(files) > 8 else "")
        what = "Mettre à la corbeille" if mode == "trash" else "Supprimer définitivement"
        msg = f"{what} {len(files)} fichier(s) ({human_size(total)}) ?\n\n{listing}"
        if notes:
            msg += "\n\n" + "\n\n".join(notes)
        if not messagebox.askyesno("Confirmer la suppression", msg, icon="warning", default="no"):
            return

        # 3. Exécution en arrière-plan (les clés USB peuvent être lentes)
        self._set_busy(True)
        self.status.set(f"Suppression de {len(files)} fichier(s)…")
        action = move_to_trash if mode == "trash" else delete_permanently
        label = "corbeille" if mode == "trash" else "définitive"

        def work():
            done, failed, log = [], [], []
            for f in files:
                try:
                    action(f.path)
                    done.append(f)
                    log.append((f.path, f.size, label, "OK"))
                except OSError as e:
                    failed.append((f.path, str(e)))
                    log.append((f.path, f.size, label, f"ÉCHEC : {e}"))
            try:
                log_file = log_deletions(log)
            except OSError:
                log_file = ""
            self.q.put(("deleted", (done, failed, log_file)))
        threading.Thread(target=work, daemon=True).start()

    def _after_delete(self, done: list[FileEntry], failed: list[tuple[str, str]], log_file: str) -> None:
        self._set_busy(False)
        removed = {f.path for f in done}
        self.groups = remove_paths(self.groups, removed)
        self.apply_filter(keep_open=True)
        self._on_select()
        freed = sum(f.size for f in done)
        msg = f"{len(done)} fichier(s) supprimé(s), {human_size(freed)} libérés."
        if failed:
            msg += f"  {len(failed)} échec(s)."
        if log_file:
            msg += f"  Journal : {log_file}"
        self.status.set(msg)
        if failed:
            details = "\n".join(f"{p}\n    → {e}" for p, e in failed[:10])
            messagebox.showwarning("Certains fichiers n'ont pas pu être supprimés",
                                   details + ("\n…" if len(failed) > 10 else "") +
                                   "\n\n(fichier ouvert dans une autre application, protégé en "
                                   "écriture, ou disque retiré)")

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
