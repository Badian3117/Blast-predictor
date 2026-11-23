"""Double-cliquez sur ce fichier (Windows) pour lancer l'interface graphique."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from doublons_app.__main__ import run  # noqa: E402

run()
