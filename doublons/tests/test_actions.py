import os
import sys
import tempfile
import unittest
from urllib.parse import quote

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from doublons_app.actions import delete_permanently, log_deletions, trash_home
from doublons_app.core import (KEEP_NEWEST, KEEP_OLDEST, KEEP_SHORTEST, VERDICT_IDENTICAL,
                               DuplicateGroup, FileEntry, remove_paths, select_copies)


def group(verdict=VERDICT_IDENTICAL):
    files = [FileEntry("/a/x.txt", 10, 100, "/a"),
             FileEntry("/b/long/x.txt", 10, 300, "/b"),
             FileEntry("/c/mid/x.txt", 10, 200, "/c")]
    return DuplicateGroup("x.txt", files, verdict)


class SelectCopiesTest(unittest.TestCase):
    def kept(self, g, sel):
        left = [f.path for f in g.files if f not in sel]
        self.assertEqual(len(left), 1)
        return left[0]

    def test_keep_rules(self):
        g = group()
        self.assertEqual(self.kept(g, select_copies([g], KEEP_NEWEST)), "/b/long/x.txt")
        self.assertEqual(self.kept(g, select_copies([g], KEEP_OLDEST)), "/a/x.txt")
        self.assertEqual(self.kept(g, select_copies([g], KEEP_SHORTEST)), "/a/x.txt")
        self.assertEqual(self.kept(g, select_copies([g], keep_root="/c")), "/c/mid/x.txt")

    def test_skips_unverified_and_missing_root(self):
        self.assertEqual(select_copies([group("")]), [])
        self.assertEqual(len(select_copies([group("")], verified_only=False)), 2)
        self.assertEqual(select_copies([group()], keep_root="/zzz"), [])

    def test_remove_paths(self):
        g1, g2 = group(), group("Partiellement identique (2/3)")
        out = remove_paths([g1, g2], {"/a/x.txt"})
        self.assertEqual([g.count for g in out], [2, 2])
        self.assertEqual(out[0].verdict, VERDICT_IDENTICAL)
        self.assertEqual(out[1].verdict, "")           # verdict partiel obsolète
        self.assertEqual(remove_paths(out, {"/b/long/x.txt"}), [])


class FileActionsTest(unittest.TestCase):
    def test_trash_and_delete_and_log(self):
        with tempfile.TemporaryDirectory() as t:
            f1 = os.path.join(t, "doc.txt")
            f2 = os.path.join(t, "sub", "doc.txt")
            os.makedirs(os.path.dirname(f2))
            for p in (f1, f2):
                with open(p, "w") as fh:
                    fh.write("x")
            trash = os.path.join(t, "Trash")
            d1 = trash_home(f1, trash)
            d2 = trash_home(f2, trash)
            self.assertFalse(os.path.exists(f1) or os.path.exists(f2))
            self.assertEqual(sorted(os.listdir(os.path.join(trash, "files"))), ["doc.2.txt", "doc.txt"])
            self.assertTrue(os.path.exists(d1) and os.path.exists(d2))
            with open(os.path.join(trash, "info", "doc.txt.trashinfo")) as fh:
                self.assertIn("Path=" + quote(os.path.abspath(f1)), fh.read())
            delete_permanently(d1)
            delete_permanently(d1)                     # déjà supprimé : pas d'erreur
            self.assertFalse(os.path.exists(d1))
            log = os.path.join(t, "log.csv")
            log_deletions([(f1, 1, "corbeille", "OK")], log)
            log_deletions([(f2, 1, "définitive", "OK")], log)
            with open(log, encoding="utf-8-sig") as fh:
                self.assertEqual(len(fh.read().splitlines()), 3)


if __name__ == "__main__":
    unittest.main()
