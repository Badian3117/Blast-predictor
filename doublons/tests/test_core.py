import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from doublons_app.core import (Scanner, ScanOptions, VERDICT_DIFFERENT, VERDICT_IDENTICAL,
                               export_csv, filter_groups, make_key, normalize_roots,
                               parse_extensions, verify_group)
from doublons_app.drives import parse_linux_mounts


def write(path, data=b"x"):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as fh:
        fh.write(data)


class ScanTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        t = self.tmp.name
        self.d1, self.d2 = os.path.join(t, "disk1"), os.path.join(t, "disk2")
        write(os.path.join(self.d1, "docs", "Rapport.pdf"), b"A" * 100)
        write(os.path.join(self.d2, "backup", "rapport.PDF"), b"A" * 100)
        write(os.path.join(self.d2, "old", "Rapport.pdf"), b"B" * 100)
        write(os.path.join(self.d1, "photo.jpg"), b"P" * 300_000)
        write(os.path.join(self.d1, "a", "photo.jpg"), b"P" * 300_000)
        write(os.path.join(self.d1, "unique.txt"), b"u")
        write(os.path.join(self.d1, "vide.txt"), b"")
        write(os.path.join(self.d2, "vide.txt"), b"")
        write(os.path.join(self.d1, ".cache", "photo.jpg"), b"P" * 300_000)
        write(os.path.join(self.d1, "node_modules", "photo.jpg"), b"P")

    def tearDown(self):
        self.tmp.cleanup()

    def groups(self, **kw):
        return {g.name.casefold(): g for g in Scanner(ScanOptions(**kw)).scan([self.d1, self.d2])}

    def test_case_insensitive_grouping_across_drives(self):
        g = self.groups()
        self.assertEqual(set(g), {"rapport.pdf", "photo.jpg"})
        self.assertEqual(g["rapport.pdf"].count, 3)
        self.assertEqual(len(g["rapport.pdf"].roots), 2)
        self.assertEqual(g["photo.jpg"].count, 2)          # caché + node_modules exclus

    def test_case_sensitive(self):
        g = self.groups(case_sensitive=True)
        self.assertEqual(g["rapport.pdf"].count, 2)

    def test_hidden_included_and_empty_files(self):
        g = self.groups(skip_hidden=False, min_size=0)
        self.assertEqual(g["photo.jpg"].count, 3)
        self.assertIn("vide.txt", g)

    def test_extension_filter(self):
        g = self.groups(extensions=parse_extensions("pdf"))
        self.assertEqual(set(g), {"rapport.pdf"})

    def test_cross_drive_filter(self):
        groups = Scanner().scan([self.d1, self.d2])
        names = {g.name.casefold() for g in filter_groups(groups, cross_drive_only=True)}
        self.assertEqual(names, {"rapport.pdf"})

    def test_verify(self):
        g = self.groups()
        self.assertTrue(verify_group(g["photo.jpg"]).startswith(VERDICT_IDENTICAL))
        self.assertTrue(verify_group(g["rapport.pdf"]).startswith("Partiellement identique (2/3)"))
        write(os.path.join(self.d2, "photo.jpg"), b"P" * 299_999 + b"Q")
        g = self.groups()
        self.assertTrue(verify_group(g["photo.jpg"]).startswith("Partiellement"))

    def test_verify_different(self):
        write(os.path.join(self.d1, "x", "z.bin"), b"1" * 10)
        write(os.path.join(self.d2, "x", "z.bin"), b"2" * 10)
        self.assertEqual(verify_group(self.groups()["z.bin"]), VERDICT_DIFFERENT)

    def test_nested_roots_not_double_counted(self):
        groups = Scanner().scan([self.d1, os.path.join(self.d1, "a"), self.d1])
        self.assertEqual({g.name: g.count for g in groups}, {"photo.jpg": 2})

    def test_export_csv(self):
        out = os.path.join(self.tmp.name, "out.csv")
        export_csv(Scanner().scan([self.d1, self.d2]), out)
        with open(out, encoding="utf-8-sig") as fh:
            lines = fh.read().splitlines()
        self.assertEqual(len(lines), 1 + 5)
        self.assertTrue(lines[0].startswith("Groupe;Nom"))

    def test_cancel(self):
        sc = Scanner()
        sc.cancel()
        self.assertEqual(sc.scan([self.d1]), [])


class HelpersTest(unittest.TestCase):
    def test_unicode_normalisation(self):
        self.assertEqual(make_key("été.txt", False), make_key("été.TXT", False))

    def test_parse_extensions(self):
        self.assertEqual(parse_extensions("pdf, .JPG;docx"), {".pdf", ".jpg", ".docx"})

    def test_normalize_roots(self):
        with tempfile.TemporaryDirectory() as t:
            sub = os.path.join(t, "sub")
            os.mkdir(sub)
            self.assertEqual(normalize_roots([sub, t]), [os.path.abspath(t)])

    def test_linux_mounts(self):
        text = "\n".join([
            "proc /proc proc rw 0 0",
            "/dev/sda2 / ext4 rw 0 0",
            "/dev/sda1 /boot/efi vfat rw 0 0",
            "/dev/sdb1 /media/moi/CLE\\040USB vfat rw 0 0",
            "/dev/loop3 /snap/core/1 squashfs ro 0 0",
            "/dev/sda2 /home ext4 rw 0 0",
            "//nas/partage /mnt/nas cifs rw 0 0",
        ])
        got = [(m, fs) for _, m, fs in parse_linux_mounts(text)]
        self.assertEqual(got, [("/", "ext4"), ("/media/moi/CLE USB", "vfat"), ("/mnt/nas", "cifs")])


if __name__ == "__main__":
    unittest.main()
