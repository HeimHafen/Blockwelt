# Blockwelt V24 — Sonnen-Dorf, Qualitätslabor

**Nicht als fertig freigegeben.** Ausgangspunkt ist die auf iPhone getestete V23-Fassung. Diese V24 wurde nur lokal geändert; die bisher veröffentlichte Version wurde nicht automatisch bearbeitet.

## Ziel: Ein Ort statt neuer Funktionen

Die fünf echten iPhone-Screenshots von V23 zeigten drei konkrete Probleme: erhöht stehende Bewohner, zu hohe aufgesetzte Dachaufbauten und einen überladenen zentralen Dorfplatz. V24 setzt an diesen Ursachen an, ohne das ganze Spiel umzubauen.

### Änderungen

1. **Fünf Dorfbewohner auf niedrigeren Plätzen**: Die Berufsfiguren starten nicht länger auf den erhöhten Terrassen der Hauszugänge. Sie laufen nur in einem engeren Bereich auf einer freien Gehfläche auf Dorfhöhe. Wenn eigene Bauwerke einen Standort blockieren, wird ein geeigneter freier Platz beim Arbeitsplatz gesucht; sonst ist die Figur vorübergehend unsichtbar, statt in einer Mauer oder hoch auf einer Säule zu stehen.
2. **Kartenstube und Wachhaus**: Die blockbasierten Dachaufbauten wurden verkleinert. Die Kartenstube hat nun einen niedrigeren Ausguck (maximales Dach-Zellniveau 15); das Wachhaus einen kompakten Aufsatz mit Fenstern und Dachkante (maximales Dach-Zellniveau 17). Auch Dachdekoration, Wimpel und Geländer wurden entsprechend neu gesetzt.
3. **Ruhigerer Dorfplatz**: Der zweite dekorative Marktstand neben dem Brunnen ist entfernt. Der vorhandene vollständige Marktstand bleibt erhalten. Brunnen, zentrale Straßen und die vier Werkstätten bleiben am selben Ort.
4. **Keine neuen Bildschirmknöpfe**: Interaktion, Entdeckerbuch, vier Werkstatt-Abenteuer und sieben Entdeckungsorte bleiben erhalten. Beibehalten sind die Speicherschlüssel `blockwelt-kleine-baumeister-v1`, `blockwelt-entdeckerbuch-v10` und `blockwelt-sonnendorf-werkstaetten-v23`.
5. **Cache-/Versionskennzeichnung**: `index.html` nennt V24-Labor und verlangt per Query-Parameter eine neue CSS- und JS-Ressource.

### Durchgeführte Prüfungen (11. November 2026)

- JavaScript: `node --check game.js` erfolgreich.
- Welt: `node test_v24.cjs`: acht Regressionstestgruppen erfolgreich, darunter unveränderte **36.864 Gelände-Höhen**, unveränderte Birken-Dorf-Voxel und ausschließlich **68 geänderte erzeugte Dachblockpositionen** im Sonnen-Dorf.
- Wege: `node test_house_paths_v23.cjs`: alle vier Werkstattwege und die freie Innenraumhöhe geprüft. Sechs Hauseingänge bleiben frei.
- NPCs: `node test_npc_v24.cjs`: alle fünf neuen Bewohner-Standorte auf passierbarer Dorfhöhe; Ausweichposition nach selbst platziertem zweistöckigem Block geprüft.
- Aktivitäten: `node test_workshops_v23.cjs`: 31 Interaktions- und Fortschrittsprüfungen erfolgreich.
- Speicher: `node test_backup_v23.cjs`: fünf Import- und Exportfälle erfolgreich.
- Handy-UI: `python test_ui_v24.py`: 375×667, 393×852, 844×390 ohne horizontale Überläufe, 49 eindeutige HTML-IDs.
- Technische Vorschau: `V24_Dorf_Ueberblick_Codedaten.png` und `V24_Dorf_Dorfstrasse_Codedaten.png`, gerendert aus erzeugten Voxelpositionen und Dekorationsmaßen **mit einem separaten Prüf-Renderer**, nicht aus Safari/Three.js.

## Grenzen

- **Nicht geprüft:** tatsächliche Three.js-Laufzeit-/Bildrate mit WebGL auf einem iPhone, reale Material- und Lichtwirkung, Interaktionsgefühl beim Spielen mit Berührung.
- **Nicht garantiert:** dass alle vorhandenen, selbst platzierten Bauwerke perfekt zu neuen Dachformen passen. Eigene gespeicherte Bearbeitungen haben bei der Weltgenerierung weiterhin Vorrang; daher vor jedem Test die Ingame-Funktion „Welt sichern“ verwenden.
- Die Grafik entspricht weiterhin nicht der detaillierten Konzeptillustration und darf nicht als fertig bezeichnet werden.

## Testen

Dieses ZIP besteht aus **`index.html`, `styles.css`, `game.js`, `README.md`**. Vor dem Austausch V23 und die persönliche Welt sichern. **Zuerst einen separaten Testbranch verwenden; `main` nicht blind überschreiben.** Erst nach einem echten iPhone-Spieltest anhand Screenshots über eine Veröffentlichung entscheiden.
