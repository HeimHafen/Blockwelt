# Blockwelt V8 – Lebendige Welt

Ein eigenes, familienfreundliches 3D-Klötzchen-Abenteuer als Web-App. Eigenständige Grafiken und prozedural erzeugte Texturen; keine Minecraft-Originaldateien. Basiert auf der funktionierenden V5/V6-Grundlage und enthält auch die V7-Fernsicht.

## Was ist neu?

- **Wasser in Seen und am Wasserfall:** Statt aller transparenten Würfelseiten werden hauptsächlich die oberen Wasserflächen und die äußeren Wände gezeichnet. Dadurch entstehen ruhigere Seeflächen und weniger störende innere Kanten.
- **Kristallfall:** Die bisher gerade, hoch aufragende Stein-/Wassersäule wurde durch einen gestaffelten Felsrücken mit sichtbarem Wasserlauf und flachem Becken ersetzt.
- **Dorfhäuser:** Satteldächer, Dachüberstände, Giebel, Holzbalken, Eingangsüberdachungen, Fenster und kleine Details. Türen bleiben offen; die Dorfwege sind weiterhin begehbar.
- **Wälder:** Variierende Bäume – höhere Eichen, Blütenbäume und gestufte Tannen.
- **Dorfleben:** Goldene Felder mit kleinen Holzzäunen; freundlichere Gesichter der Bewohner.
- **Texturen und Licht:** Feinere originale Pixeltexturen für Erde, Stein, Gras, Holz, Ziegel und Wasser; weniger überhellte Darstellung und spätere Nebelgrenze.
- **V7-Fernsicht enthalten:** Vereinfachte entfernte Landschaft; Umschalter »Sichtweite: Weit/Normal« im Menü.
- **Mobile Bedienung bleibt:** Joystick, Umsehen, Springen, Abbauen, Setzen, Flugmodus, Schnellreisen, 15 Materialien.

## Wichtig vor dem Update

1. Die aktuelle Blockwelt-Web-App im Safari-Browser öffnen.
2. Im Menü **»Welt sichern«** wählen und die JSON-Datei in der iPhone-Dateien-App behalten. Zusätzlich bei Bedarf eine Sicherung des Repositorys anlegen.
3. **Nicht** »Welt neu anfangen« wählen und **keine** Safari-Website-Daten löschen.
4. Die vier Dateien dieses Pakets `index.html`, `styles.css`, `game.js`, `README.md` in das **Stammverzeichnis** von `HeimHafen/Blockwelt` übertragen und dort die gleichnamigen Dateien ersetzen (nicht das ZIP als Datei hochladen).
5. Auf `main` committen; falls mit Working Copy gepusht wird: Source `refs/heads/main`, Remote `refs/heads/main`, **Force Push: Aus**.
6. Website öffnen: `https://heimhafen.github.io/Blockwelt/?v=8`. Oben muss **»Lebendige Welt · V8«** stehen.
7. Die bisherigen Bauten prüfen, danach Kristallfall und Sonnen-Dorf erkunden. Bei Rucklern im Menü die Sichtweite auf »Normal« stellen.

## Spielstände / Kompatibilität

- Die bereits vorhandene Speicherkennung bleibt `blockwelt-kleine-baumeister-v1`. Das Update löscht keine lokalen Bauänderungen.
- Die ursprüngliche V3-Welt im Bereich von 64×64 Feldern bleibt bei der **Blockgeneration** unverändert.
- Außerhalb dieses alten Bereichs können **automatisch erzeugte** Bäume, Häuser und Wasserfallbereiche gegenüber V6/V7 anders aussehen. Spieler-Edits werden nach der Generierung erneut angewendet.
- Die JSON-Sicherung ist unabhängig vom GitHub-Repository. Ein GitHub-Commit enthält **nicht** die persönliche, nur im Browser gespeicherte Bauwelt.
- Falls eine alte Welt nach dem Update nicht erscheint: im Menü »Welt laden« die JSON-Sicherung importieren. Nicht unüberlegt »Welt neu anfangen« auswählen.

## Prüfstand

- JavaScript-Syntax geprüft (`node --check`).
- Gleichheit der Legacy-/Geländeformeln zur V7-Version automatisch geprüft.
- Logiktests: Dorf-Dach, Türen, Fenster und Vorbau; gestufter Kristallfall; Wasserrendering ohne innere Wasserwände.
- HTML/CSS des Menüs auf 393×852, 375×667 und 844×390 Bildschirmgrößen gerendert.
- Ein **vollständiger WebGL- und Touch-Performance-Test auf echtem iPhone** konnte hier nicht durchgeführt werden. Er muss nach dem GitHub-Pages-Update stattfinden; V8 ist ein testbereiter, nicht abschließend gerätegeprüfter Stand.

## Technisches

- Originale JavaScript-/Canvas-Pixeltexturen, auf dem Gerät aus Code erzeugt.
- Keine zusätzlichen Bibliotheken gegenüber V7. Three.js 0.187.0 (MIT) wird über jsDelivr geladen; Internetverbindung erforderlich.
- Teile der entfernten Landschaft werden als LOD-Geometrie dargestellt, während die aktiven Bereiche blockweise in Chunks nachgeladen werden.
- Keine Multiplayer-Funktion, keine Werbung, kein Konto und keine aggressiven Kämpfe.
