# Doublons — fichiers en double sur plusieurs disques

Application de bureau (Windows, macOS, Linux) qui retrouve tous les fichiers portant
**le même nom et la même extension** sur un ou plusieurs disques : disques internes,
disques externes USB, clés USB, cartes SD, partages réseau, ou simples dossiers.

## Lancer

| Méthode | Comment |
|---|---|
| **Windows, sans Python** | Télécharger `Doublons.exe` (artefact *Doublons-windows* de l'onglet *Actions*, ou release `doublons-v*`) et double-cliquer. |
| Avec Python 3.9+ | Double-cliquer `Doublons.pyw`, ou `python -m doublons_app` depuis ce dossier. |
| Ligne de commande | `python -m doublons_app D:\ E:\ --cross-drive --verify --csv doublons.csv` |

Aucune dépendance externe : uniquement la bibliothèque standard Python (Tkinter).

## Utilisation

1. **Disques** : tous les disques locaux et amovibles détectés sont cochés par défaut
   (réseau et CD/DVD décochés). Une clé USB branchée pendant que l'appli est ouverte
   apparaît et se coche toute seule en ~3 s. « + Dossier… » ajoute un dossier précis.
2. **Options** : casse, fichiers cachés/système, filtre d'extensions (`pdf, jpg, mp4`),
   taille minimale, liste des dossiers exclus (Windows, Program Files, AppData,
   $Recycle.Bin, node_modules…).
3. **Rechercher** — puis filtrer : *seulement sur des disques différents*,
   *même taille uniquement*, recherche par nom. Double-clic sur un fichier = ouvrir
   son emplacement dans l'Explorateur. Clic droit = copier le chemin.
4. **Vérifier le contenu** (recommandé avant toute suppression) : compare réellement
   les fichiers (empreinte BLAKE2b), groupe par groupe.
5. **Exporter CSV** : s'ouvre directement dans Excel (UTF-8, séparateur `;`).

## Ce qu'il faut savoir (limites assumées)

- **Même nom ≠ même fichier.** `IMG_0001.JPG`, `Rapport.pdf`, `desktop.ini` existent
  par milliers avec des contenus différents. Le nom sert à *repérer* ; seul le verdict
  « Contenu identique » prouve un vrai doublon. La vérification lit d'abord la taille,
  puis 64 Ko au début et à la fin, et ne lit le fichier entier que si tout concorde —
  ce qui évite de relire des Go sur une clé USB lente.
- **L'inverse aussi** : un même fichier renommé (`Rapport (1).pdf`, `Copie de…`)
  n'est **pas** détecté, puisque la clé de recherche est le nom.
- **Casse** : insensible par défaut (`Photo.JPG` = `photo.jpg`), comme NTFS/FAT/exFAT.
  Les noms Unicode sont normalisés (un `é` macOS et un `é` Windows sont égaux).
- **Disques externes vus comme « Interne »** : Windows classe la plupart des disques
  durs/SSD USB comme *fixes* ; seules les clés USB et cartes SD sont *amovibles*.
  Ils sont tous listés, l'étiquette est juste indicative.
- **Aucune suppression** n'est faite par l'application, volontairement. Supprimez
  depuis l'Explorateur (double-clic) après vérification du contenu.
- Pas de double comptage : racines imbriquées fusionnées (C:\ + C:\Users), liens
  symboliques et jonctions NTFS ignorés, le parcours ne déborde pas d'un disque à
  l'autre. Les chemins de plus de 260 caractères sont pris en charge sous Windows.

## Tests

```bash
python -m unittest discover -s tests -v
```

## Construire l'exécutable Windows soi-même

```bash
pip install pyinstaller
pyinstaller --onefile --windowed --name Doublons Doublons.pyw
```
