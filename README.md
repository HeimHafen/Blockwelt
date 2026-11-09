# BLOCKWELT V6 – Abenteuerwelt

Eine eigenständige, im Browser spielbare 3D-Klötzchenwelt für Smartphone und Desktop. Grundlage ist die funktionierende **Blockwelt V5**. Die Welt nutzt selbst generierte Pixeltexturen und eigenständige Figuren, keine Minecraft-Originaldateien. Blockwelt ist **kein offizielles Minecraft-Produkt**.

## Was V6 tatsächlich enthält

- **192 × 192 Weltfelder** mit dem Chunk-Streaming aus V5: Auf Mobilgeräten werden maximal 5 × 5 sichtbare 16er-Chunks gerendert, dazu ein kleiner Datenpuffer. Keine unendliche Welt.
- **Bestehende V5-Welt und Bedienung erhalten:** Startwiese, Dörfer, Wälder, Berge, Seen, Joystick, Umschauen, Springen, Flugmodus, Bauen, Abbauen, Rückgängig, Export/Import.
- **Landschafts-Upgrade:** Blumen und Grasbüschel als leichte Instanzen, rosafarbene Blütenbäume, Schnee auf hohen Berggipfeln, wärmere Beleuchtung und atmosphärische Sonnen-/Mondscheiben.
- **Zwei Entdeckerorte:** eine steinerne **Himmelswarte** mit Leuchtblock an der Spitze und ein **Kristallfall** aus Wasserblöcken vor einer Felswand. Die Warte ist ein Aussichtsziel; zum Erreichen des oberen Bereichs eignet sich der Flugmodus.
- **Lebendigere Welt:** insgesamt 21 einfache eigenständige 3D-Figuren – Dorfbewohner, friedliche grüne Schleicher, Kühe und Schafe. Sie laufen innerhalb ihrer Bereiche umher und lassen sich freundlich ansprechen bzw. streicheln.
- **Drei Lichtstimmungen:** Morgensonne, Goldene Stunde und Sternennacht, manuell im Menü umschaltbar. Keine automatische Uhr.
- **15 direkt wählbare Baumaterialien:** die bisherigen 12 plus Schnee, Blüten und Laternen; Wege werden in Dörfern automatisch verwendet.
- **Schnellreisen** zur Startwiese, zum Sonnen-Dorf, Birken-Dorf, zur Himmelswarte und zum Kristallfall.
- **iPhone-optimiertes Menü:** kompakte Optionen, scrollbarer Dialog auf kleinen Displays und Landschaftsausrichtung.

## Wichtig: V5 vor dem Update sichern

1. Die bestehende Blockwelt öffnen: https://heimhafen.github.io/Blockwelt/
2. Im Menü **„Welt sichern“** wählen und die heruntergeladene Datei `Blockwelt-Meine-Welt.json` in der Dateien-App aufbewahren. **GitHub sichert nicht automatisch die lokalen Browser-Spielstände!**
3. Optional den aktuellen funktionierenden V5-Commit auf GitHub notieren oder das Repository als ZIP herunterladen.
4. Safari-Website-Daten und lokalen Speicher **nicht löschen**, solange die neue Version noch nicht geprüft wurde.

## Installation auf GitHub (iPhone/Safari)

1. `Blockwelt_V6_Abenteuerwelt.zip` in die Dateien-App laden und entpacken.
2. In GitHub **HeimHafen/Blockwelt** öffnen (nicht `Family-Spots-Map`).
3. Genau die **vier Dateien** `index.html`, `styles.css`, `game.js`, `README.md` direkt ins **Hauptverzeichnis** hochladen und die gleichnamigen bisherigen Dateien ersetzen. Nicht das ZIP selbst hochladen, keine zusätzliche Unterordner-Ebene anlegen.
4. Änderungen auf `main` committen. Bei GitHub Pages muss die Veröffentlichungsquelle `main` und `/(root)` sein.
5. Nach erfolgreicher Veröffentlichung https://heimhafen.github.io/Blockwelt/ öffnen. Oben muss **„Abenteuerwelt · V6“** stehen. Wenn noch V5 angezeigt wird: Seite neu laden und gegebenenfalls etwas warten, aber keine Browserdaten löschen.
6. Zuerst Menü und Steuerung testen, danach Dorf, Kristallfall, Himmelswarte, Tag/Nacht und Speicher-/Ladefunktion prüfen. Falls eigene Bauten fehlen, die zuvor gesicherte JSON-Datei über **„Welt laden“** importieren.

### Working Copy (Alternative zum Browser-Upload)

- Repository: `HeimHafen/Blockwelt`
- Source-Referenz: `refs/heads/main`
- Vorhandene oder neue Remote-Referenz: `refs/heads/main`
- Force Push: **Aus**
- Commit-Zusammenfassung: `Blockwelt V6 – Abenteuerwelt mit Tieren, Entdeckerorten und neuer Atmosphäre`
- Detaillierte Informationen: `V5-Welt und Steuerung beibehalten; Blumen, Blütenbäume, Schnee, Kühe, Schafe, Himmelswarte, Kristallfall, fünf Schnellreiseziele, drei Lichtstimmungen und neue Baumaterialien ergänzt.`

## Spielstand und Kompatibilität

- Der bisherige Browser-Speicherschlüssel `blockwelt-kleine-baumeister-v1` bleibt erhalten.
- V2-, V3- und V5-Exportdateien können weiterhin importiert werden; V6 exportiert und importiert ebenfalls JSON.
- Die ursprünglichen V5-Funktionen zur Berechnung der alten Landschaft wurden nicht verändert. Die neue Dekoration und die neuen Bauwerke liegen zusätzlich darüber. Bestehende Bauänderungen werden bei der Chunk-Erzeugung zuletzt aufgebracht.
- Beim Import wird der aktuelle Spielstand **nach Bestätigung ersetzt**. Vorher unbedingt sichern.
- Die Welt wird weiterhin **nur lokal im Browser** gespeichert. Ein anderes Gerät sieht nicht automatisch dieselben Bauten.

## Technische Hinweise und Grenzen

- Three.js **0.187.0** wird als ES-Modul über jsDelivr geladen (MIT-Lizenz). Für den ersten Start wird eine Internetverbindung benötigt.
- Die spektakuläre KI-Bildvorschau ist **ein Konzeptbild**, kein Screenshot der tatsächlichen WebGL-Grafik. V6 verwendet einfache, mobile-freundliche Voxelgeometrie; keine fotorealistischen Schatten, keine komplexe Burganlage und keine Shader-Pipeline wie in dem Bild.
- Schleicher sind **friedlich**: keine Kämpfe, Explosionen oder Schadensmechanik. Dorfbewohner und Tiere haben einfache Bewegungsmuster, keine komplexe Wegfindung.
- Kein Crafting, kein Multiplayer, keine unendliche Welt, keine komplexe Wasserphysik.
- Die zusätzliche Dekoration kann die Leistung auf älteren Smartphones beeinflussen. V6 nutzt weiterhin Chunk-Streaming, instanzierte Blöcke und eine begrenzte Pixelauflösung auf Mobilgeräten.

## Prüfstand

- JavaScript-Syntaxprüfung mit `node --check`: bestanden.
- DOM-Abgleich: alle aus JavaScript verwendeten Elemente vorhanden.
- Vergleich der zentralen V5-Funktionen für ursprüngliches Terrain: unverändert.
- Browser-Logiktest mit **Three.js-Testattrappe**: Start, Menüs, Lichtwechsel, Schnellreisen, Chunk-Erzeugung, Tiere, Import einer V5-JSON-Sicherung ohne Skriptfehler durchlaufen.
- Layout-Screenshots in 393 × 852, 375 × 667 und 844 × 390 erstellt. Die Testattrappe rendert **keine echten 3D-Grafiken**.
- **Noch offen:** echter WebGL-Grafiktest mit Three.js und praktischer Touch-/Leistungs-Test auf einem iPhone. Daher keine 1:1-Grafik- oder Performance-Garantie.

## Zurück zur V5

Wenn V6 auf deinem iPhone Probleme verursacht, den letzten funktionierenden V5-Commit auf GitHub wiederherstellen. Anschließend ggf. den gesicherten V5-Spielstand laden. Vor jedem Wechsel den aktuellen Spielstand exportieren, da V6-Bauten aus neuen Materialien in V5 nicht vollständig darstellbar sind.
