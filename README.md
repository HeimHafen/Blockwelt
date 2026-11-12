# Blockwelt V26 – Große Wiese (Labor-Testversion)

**Basis:** V25 Sonnen-Dorf. Neu: zweite eigenständige Welt **„Große Wiese“**.

## Was ist neu?

Die Blockwelt hat jetzt **zwei getrennte Welten**, umschaltbar im Start-/Spielmenü unter **„🌍 Welten auswählen“**:

1. **🏰 Abenteuerwelt** – die bisherige 192 × 192 große Legendenwelt mit Dörfern, Werkstätten, Entdeckerbuch, Bergen, Ruinen und Tieren. Der vorhandene Bauwerks-Speicherschlüssel `blockwelt-kleine-baumeister-v1` bleibt exakt gleich.
2. **🌿 Große Wiese** – eine eigene 192 × 192 große, völlig flache Grasfläche, auf der anfangs **keine Bäume, Blumen, Seen, Häuser, Figuren, Tiere oder Entdeckungsorte** stehen. Auf dem Gras kann man eigene Bauwerke frei errichten. Die Oberfläche liegt überall auf der gleichen Höhe; darunter befinden sich Erde und Stein. Baublöcke, die man selbst setzt, können die Wiese natürlich verändern.

Beide Welten verwenden denselben Baukasten, dieselbe mobile Steuerung und dieselben Grafikoptionen. In der Großen Wiese sind das Entdeckerbuch und der Abenteuer-Kompass ausgeblendet. Über das Menü lässt sich jederzeit zur Abenteuerwelt zurückwechseln.

## Spielstände & Sicherungen

- **Abenteuerwelt:** `blockwelt-kleine-baumeister-v1` (unverändert).
- **Große Wiese:** `blockwelt-grosse-wiese-v26` (neu, getrennt).
- Aktive Welt: `blockwelt-aktive-welt-v26` (nur die Auswahl wird gemerkt).
- Bauwerke werden in jeder Welt separat automatisch im Browser gespeichert.
- **„Welt sichern“** exportiert immer nur die aktuell ausgewählte Welt. Der Abenteuer-Export bleibt rückwärtskompatibel mit V25 (Formatversion 7). Der Wiesen-Export verwendet Formatversion 8 und die ausdrückliche Weltkennzeichnung `world: "wiese"`.
- **„Welt laden“** verhindert, dass eine Sicherung versehentlich in die falsche Welt importiert wird.
- **„Welt neu anfangen“** löscht ausdrücklich nur die aktuell ausgewählte Welt. Die andere wird nicht angetastet.

**Vor jedem Austausch:** Alte Version sichern und im vorhandenen Spiel beide Welten bei Bedarf als JSON exportieren. Testversion zunächst in einem Testbranch prüfen. Ein GitHub-Branch wird nicht automatisch über die bestehende GitHub-Pages-Adresse veröffentlicht.

## Bedienung

1. Öffne das Blockwelt-Menü (`☰`).
2. Öffne **„🌍 Welten auswählen“**.
3. Wähle **„🌿 Große Wiese“** oder **„🏰 Abenteuerwelt“**.
4. Tippe auf **„▶ Große Wiese betreten“** bzw. **„▶ Abenteuerwelt betreten“**.
5. Baue wie gewohnt; deine Änderungen werden nur in dieser Welt gespeichert.

## Technische Prüfungen

- `node --check game.js`: bestanden.
- Vergleich **aller 36.864 Geländepunkte und Biome** zwischen V25 und der V26-Abenteuerwelt: **identisch**.
- Neue Wiese: alle 36.864 Geländehöhen = 5, Biom `wiese`.
- Echte Wiesen-Chunkgeneratorfunktion separat getestet: nur ebene Grasschicht, Erde, Stein; keine automatisch erzeugten Bauwerke; selbst gesetzte/entfernte Blöcke bleiben erhalten.
- Zwei getrennte Spielstände: Speichern, Wechsel und Wiedereinlesen in einer isolierten Testumgebung bestanden.
- HTML-/CSS-Menü bei **375 × 667, 393 × 852 und 844 × 390** Pixeln geprüft. Weltwahl erreichbar; Wiesenmodus blendet Abenteuer-HUD aus.
- 52 eindeutige HTML-IDs, keine fehlenden aus dem Skript referenzierten IDs.
- ZIP-Integrität wird vor Übergabe geprüft.

**Grenzen:** Die vollständige Three.js-WebGL-Welt und die Leistung auf einem echten iPhone wurden in dieser Umgebung noch nicht live geprüft. V26 ist deshalb eine **Labor-Testversion**, keine visuell abgenommene Veröffentlichung.

## GitHub-Texte

**Zusammenfassung:**

`Blockwelt V26 – Eigenständige Große Wiese mit getrennten Spielständen (Labor)`

**Detaillierte Informationen:**

- Zweite, völlig ebene Bauwelt „Große Wiese“ (192 × 192 Felder) ergänzt.
- Keine automatisch erzeugten Häuser, Bäume, Figuren, Seen oder Dekorationen auf der Wiese.
- Umschaltung zwischen Abenteuerwelt und Großer Wiese direkt im Menü.
- Getrennte automatische Speicherung, eigene Exporte und Importschutz pro Welt.
- Die ursprüngliche Abenteuerwelt mit allen 36.864 Geländehöhen und bestehendem Speicherschlüssel unverändert.
- HTML-/CSS- und Weltgenerator-Regressionstests bestanden.
- Laborfassung: vollständiger Safari-WebGL-Test noch offen.

**Branch:** `refs/heads/test/blockwelt-v26-grosse-wiese`

**Force Push:** Aus.
