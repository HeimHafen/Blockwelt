# Blockwelt V25 — Sonnen-Dorf: Bewohner & Dachqualität (Labor)

**Status: TECHNISCH GEPRÜFTE TESTFASSUNG, NICHT VISUELL FREIGEGEBEN.**

Basis ist das interne **V24-Laborpaket**, nicht ein neuer Weltgenerator. Dieses Paket enthält ausschließlich die vier austauschbaren Dateien `index.html`, `styles.css`, `game.js`, `README.md`. Die veröffentlichte GitHub-Version wird durch das Erstellen dieses Pakets nicht verändert.

## Gezielte Verbesserungen in V25

1. **Höflich ausweichende Bewohner:** Einwohner des Sonnen-Dorfs versuchen bei weniger als 1,55 Blöcken Abstand zum Spieler, auf einen freien benachbarten Platz auszuweichen. Zusätzlich werden alternative seitliche Bewegungsrichtungen geprüft.
2. **Abstand zwischen Bewohnern:** Die fünf handplatzierten Einwohner sollen nicht ineinanderlaufen oder nach einer Baublockänderung auf demselben Punkt erscheinen. Bei einer versperrten Standfläche werden sichere Ersatzpositionen gesucht.
3. **Fünf Berufe mit kleinen 3D-Gegenständen:** Händlerwaren, eine Blume, ein Kartenbuch, ein Brotlaib und ein kleines Schild. Die Gegenstände hängen an den Armbewegungen der jeweiligen Figur. Ausschließlich originale, programmatisch erzeugte geometrische Formen und Materialien.
4. **Subtile berufstypische Gesten:** Im Stillstand bewegen die fünf Dorfbewohner Hände und Kopf vorsichtig. Beim Ansprechen ist eine Begrüßung weiterhin vorrangig.
5. **Glaubwürdigere Bewegung:** Steht eine Figur vor einer Wand, werden nicht länger Laufanimationen simuliert, obwohl sie sich nicht bewegt.
6. **Dachflächen ohne regelmäßige Fugen:** Die dekorativen Platten überlappen jetzt minimal (1,012 × 2,012 statt 0,90 × 1,90 Einheiten). Die **massiven** Dachblöcke bleiben identisch.
7. **Cache-/Versionskennzeichnung:** V25-Labor im Header, neu versionierte CSS/JS-Adressen.

## Technischer Prüfstand

- `node --check game.js`: erfolgreich.
- `node test_v25.cjs`: **8 Testgruppen bestanden**. Darunter vollständiger Vergleich aller **36.864 Geländehöhen** mit V24, unveränderte `villageBlocks`, `sunRoofY` und `sunRoofType`, Prüfung der neuen Berufswerkzeuge und des Ausweichverhaltens, unveränderte Speicherformate, 49 eindeutige HTML-IDs.
- `python test_ui_v25.py`: statische Browseroberfläche bei **375 × 667**, **393 × 852** und **844 × 390** ohne horizontalen Dokumentüberlauf; Hauptmenü und Steuerungselemente vorhanden.
- Der alte Welt-Speicherschlüssel `blockwelt-kleine-baumeister-v1` und der Werkstatt-Schlüssel `blockwelt-sonnendorf-werkstaetten-v23` sind unverändert. Eigene Bauwerke und Werkstattstempel sollen damit kompatibel bleiben.
- Die HTML/CSS-Prüfung ist **kein** Nachweis erfolgreicher Three.js-/WebGL-Darstellung.

## Nicht geprüft / Grenzen

- Kein vollständiger Live-3D-Test im echten Safari auf einem iPhone.
- Keine belastbare Messung der Bildrate oder der zusätzlichen Grafikaufrufe auf dem Mobilgerät. Die neuen Handwerksgegenstände verursachen zusätzliche kleine 3D-Meshes; entsprechend kann die Leistung abweichen.
- Kein visuelles Urteil, dass das Sonnen-Dorf den Anspruch einer fertigen Premium-Welt bereits erfüllt.

## Sichere Installation

1. Eigene Bauwerke über **Welt sichern** exportieren und die bisherige funktionierende Version sichern.
2. **Neuen Testbranch** `test/blockwelt-v25` auf Basis der aktuellen Version anlegen (GitHub-Upload: *Create a new branch for this commit and start a pull request*).
3. Die vier Dateien im Repository-Stamm austauschen.
4. Vor einer Veröffentlichung im `main`-Branch: das Sonnen-Dorf in Safari auf dem iPhone prüfen, insbesondere den Abstand der Figuren, Gesprächs-Button, die Dachoberflächen, alle vier Werkstatt-Aktionen, Spielstandimport und Leistung.
5. `Force Push` bleibt **aus**. Es wurde kein automatischer GitHub-Commit vorgenommen.

## GitHub-Texte

**Zusammenfassung:** `Blockwelt V25 – Sonnen-Dorf: lebendige Bewohner & Dachfeinschliff (Labor)`

**Detaillierte Informationen:**

- Bewohner weichen dem Spieler aus und halten Abstand zueinander.
- Handwerksfiguren tragen kleine eigene 3D-Werkzeuge und bewegen sich natürlicher.
- Laufanimationen stoppen an Hindernissen.
- Dekorative Dachplatten haben keine regelmäßigen Zwischenräume mehr.
- Gelände, feste Dorfblöcke und Speicherformate sind unverändert.
- Technische Regressionen und mobile Layouttests bestanden.
- Teststand; iPhone-WebGL-Abnahme und Leistungsprüfung offen.

**Testbranch:** `refs/heads/test/blockwelt-v25` · `Force Push: Aus`.
