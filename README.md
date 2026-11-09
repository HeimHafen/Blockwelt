# Blockwelt V7 – Fernweh

**Eigenständiges, kreatives 3D-Blockspiel** für Smartphone und Desktop. Weiterentwicklung der funktionierenden **V6 Abenteuerwelt**. Alle Grafiken und Figuren werden vom Spiel selbst erzeugt; es enthält keine Minecraft-Dateien. Es ist kein offizielles Minecraft-Produkt.

## Neu in V7

1. **Mehr Fernsicht statt blauer Leere:** Der sichtbare Horizont wird aus einem separaten, stark vereinfachten Landschaftsmodell (Level of Detail, LOD) ergänzt. Hinter den tatsächlich geladenen 16×16-Blöcke-Chunks erscheinen Hügel, Felsen, Sand, Seen und Baum-Silhouetten. Die fernen Flächen sind nur Dekoration – nicht abbaubar, nicht begehbar; beim Annähern werden daraus wieder die echten Baublöcke.
2. **Weniger, sanfterer Nebel:** Größere Sichtweite, besonders im Hochland. Die Sichtweite kann im Menü zwischen **Weit** (Standard) und **Normal** (leistungsärmer) gewechselt werden.
3. **Schönerer Himmel:** eigenständig erzeugter Farbverlauf für Tageslicht, Sonnenuntergang und Nacht. Kein heruntergeladenes Bild nötig.
4. **Mehr Atmosphäre:** dezente Wasserbewegung, abgestimmte Sonneneinstrahlung und kontrastreichere Landschaftsfarben.
5. **Kleine Dorffelder:** Goldfarbene Feldpflanzen als instanzierte Dekoration neben den Dorfbauten. Sie beeinflussen die Spieler-Bauklötze nicht.
6. **Erhalten:** die komplette 192×192-V6-Welt, beide Dörfer, Himmelswarte, Kristallfall, Bewohner, Tiere, Schleicher, Flugmodus, Spielmenü, Touch-Steuerung, Bauen/Abbauen, Undo und Export/Import.

## Erst sichern – dann installieren

1. **Blockwelt V6** unter https://heimhafen.github.io/Blockwelt/ öffnen.
2. In der App über **☰ → Welt sichern** die Datei `Blockwelt-Meine-Welt.json` herunterladen und sicher in der Dateien-App speichern. Eine GitHub-Sicherung allein **enthält den persönlichen Browser-Spielstand nicht**.
3. Optional zusätzlich das GitHub-Repository als ZIP sichern oder den letzten funktionierenden V6-Commit notieren.
4. Safari-Browserdaten und Website-Daten **nicht löschen**.

## Installation

1. Das ZIP `Blockwelt_V7_Fernweh_WebApp.zip` in der iPhone-Dateien-App entpacken.
2. **Ausschließlich `HeimHafen/Blockwelt`** auf GitHub öffnen. Nicht `Family-Spots-Map`.
3. Die vier Dateien `index.html`, `styles.css`, `game.js`, `README.md` **direkt im Hauptverzeichnis** hochladen und jeweils die vorhandenen Dateien ersetzen. Kein zusätzliches Unterverzeichnis, keine ZIP-Datei hochladen.
4. **Commit** direkt auf `main`; GitHub Pages bleibt auf `main` und `/(root)`.
5. Nach der Veröffentlichung https://heimhafen.github.io/Blockwelt/?v=7 öffnen. Oben muss **„Fernweh · V7“** stehen.
6. **Testen:** Menü, Blickbewegung, Laufen, Bauen und Abbauen; dann Dorf, Hochland, See, Sichtweiten-Schalter, Tiere und V6-Speicherstand prüfen. Bei Leistungseinbrüchen im Menü **Sichtweite: Normal** wählen.

### Commit-Texte

**Zusammenfassung:** `Blockwelt V7 – Fernsicht, Himmel und lebendigere Landschaft`

**Detaillierte Informationen:** `Mobiles Fernlandschafts-LOD statt zusätzlicher Vollblöcke; größere Sichtweite, Farbverlauf-Himmel, Wasserbewegung, Dorffelder und feinere Farben. Alte V6-Welt und Spielstände erhalten.`

### Working Copy

- Repository: `HeimHafen/Blockwelt`
- Source-Referenz: `refs/heads/main`
- Vorhandene oder neue Remote-Referenz: `refs/heads/main`
- Force Push: **Aus**

## Spielstände und Grenzen

- Der alte lokale Speicherschlüssel **`blockwelt-kleine-baumeister-v1`** bleibt unverändert, dadurch werden die früheren Bauten weiter geladen.
- Exportformat V7 enthält weiterhin nur die vom Spieler geänderten Blöcke; V2-, V3-, V5- und V6-JSON-Dateien lassen sich importieren.
- Ein **Import überschreibt nach Bestätigung** den aktuellen Spielstand. Vorher exportieren.
- „Welt neu anfangen“ kann die lokalen Bauänderungen löschen. Nicht zum Testen des Updates drücken.
- Die Welt ist **192 × 192** Felder groß, nicht unendlich. Die Fernlandschaft ist nur Kulisse, keine zusätzlichen echten Blöcke.
- Es gibt keine Kampf- oder Explosionsfunktion und keine Multiplayer-Funktion; Schleicher bleiben freundlich.
- Die grafische KI-Konzeptillustration aus dem Chat ist **nicht** ein echtes Screenshot-Ziel für diese Version. V7 ist ein mobiles WebGL-Blockspiel mit bewusst reduzierter Geometrie, nicht fotorealistisch.

## Technische Prüfung und offene Tests

- `node --check game.js` erfolgreich.
- Browser-Logiktests in 393×852, 375×667 und 844×390 mit **Three.js-Testattrappe** erfolgreich: Initialisierung, Fernlandschaftsaufbau, Sichtweitenwechsel, Tag/Nacht, Schnellreise, Menü und V6-Speicherstandimport.
- Sämtliche Kernfunktionen der V6-Weltberechnung (`terrainHeight`, `biomeAt`, `baseWorld`, `generateChunkData`, `loadEdits`, `saveEdits`, `modifyWorld`) wurden unverändert übernommen.
- Die fernsichtige Darstellung verwendet eine einzige zusammengefasste Geometrie sowie zwei instanzierte Baumarten (Stämme und Kronen). Die eigentliche, interaktive Welt bleibt auf die bereits genutzten Chunkbereiche beschränkt.
- **Nicht geprüft:** reales Three.js-WebGL-Rendering und FPS auf einem echten iPhone / Android-Gerät sowie langfristige Stabilität nach mehreren Stunden Spielen. Diese Tests müssen nach Veröffentlichung erfolgen.
- Three.js 0.187.0 (MIT) wird wie bisher über jsDelivr geladen. Beim ersten Spielstart ist Internet erforderlich.

## Rückkehr zu V6

Bei Problemen: auf GitHub den zuletzt funktionierenden V6-Commit durch einen neuen Wiederherstellungs-Commit herstellen (nicht per Force Push) und den gesicherten Spielstand über **Welt laden** importieren, falls erforderlich.
