# Blockwelt V23 – Sonnen-Dorf: Lebendige Werkstätten (internes Labor)

**NICHT VERÖFFENTLICHT – nicht auf `main` hochladen.**

Arbeitsbasis ist die lokal gesicherte V22-Innenraumfassung. Die auf GitHub veröffentlichte V12 wurde nicht bearbeitet.

## Ziel dieses Schritts

Die vier sorgfältig eingerichteten Werkstätten des Sonnen-Dorfs sollen **spielerisch erforschbar** sein, nicht nur aus dekorativen Möbeln bestehen. Die bereits recht volle Touch-Oberfläche soll dabei ruhig bleiben; fremde Orte und bestehende Bauwerke bleiben unangetastet.

## Neu in V23

- Vier kindgerechte Mini-Aktivitäten in den echten V22-Gebäuden: **Brot backen, Karte lesen, Pflanze pflegen und Wache halten**. Pro Aktivität drei kurze, aufeinander aufbauende Schritte.
- Die **bereits vorhandene NPC-Interaktionstaste** wird in Innenräumen kontextabhängig als Werkstattaktion verwendet. Kein zusätzlicher dauerhafter Bildschirmknopf.
- Die Aktion ist nur aus dem jeweiligen **Innenraum**, auf richtiger Fußhöhe, in Reichweite des Arbeitsplatzes und mit freier Sichtlinie durch die festen Blöcke möglich. Benutzeränderungen im Bereich des Arbeitsplatzes deaktivieren das Angebot.
- Sichtbare Rückmeldung als kurzer Text und als kleiner, maximal 1,15 Sekunden dauernder Partikeleffekt. Die **12 Würfelpartikel** verwenden ein einziges wiederverwendetes `InstancedMesh` und keine neue Bilddatei.
- Nach drei Schritten wird eine **Werkstattmarke** verliehen. Die vier Marken erscheinen im bestehenden Entdeckerbuch, in einem dezenten 2×2-Raster. Sie sind bewusst **nicht** Teil der bestehenden sieben Ortsentdeckungen.
- Werkstattfortschritte werden unabhängig von den gebauten Blöcken unter `blockwelt-sonnendorf-werkstaetten-v23` gespeichert. Eine erneute Durchführung erzeugt keine doppelten Marken.
- Neue Welt-Backups enthalten den **optionalen** Eintrag `workshops`, zusätzlich zum unveränderten `edits`-Format (`format: blockwelt`, `version: 7`). Beim Import aus älteren Backupdateien bleiben bereits vorhandene Marken erhalten; ein V23-Backup kann die Marken wiederherstellen. Andere Spielversionen können den optionalen Eintrag ignorieren.
- Versions- und Cache-Parameter für das lokale V23-Labor aktualisiert.

**Wichtig:** Die Aktionen sind momentan text- und effektgestützte Abläufe, **keine physisch animierten Arbeitsmaschinen und keine vollwertigen Minispiele**. Sie sind ein funktionierender erster Interaktionsbaustein.

## Technische Prüfungen

Ausgeführt am 11. November 2026:

- `node --check game.js` – bestanden.
- `node test_v23.cjs` – **8 Welt-Regressionsgruppen bestanden:** Alle 36.864 Geländehöhen identisch mit V22; feste generierte Blöcke beider Dörfer identisch; alle sechs Hauseingänge frei; unveränderte Innenraum- und Dekorationsdaten (1.161 Elemente); Speicher- und Weltfunktionen erhalten.
- `node test_house_paths_v23.cjs` – alle **vier Innenräume** besitzen von der Tür aus eine freie Zwei-Block-hohe Route zum benutzbaren Arbeitsplatz.
- `node test_workshops_v23.cjs` – **31 Assertionen** zu korrektem Raum, Reichweite, Höhenbereich, Sichtlinien-Sperre, eigenen Bauänderungen, drei Arbeitsschritten, einmaliger Belohnung und Wiederholbarkeit.
- `node test_backup_v23.cjs` – **fünf Szenarien** für Altsicherungen, neue Marken, Importabbruch und ungültige Baukoordinaten.
- `python test_ui_v23.py` – Menü und Stempelbereich bei 375 × 667, 393 × 852, 844 × 390 Pixeln ohne horizontale Überläufe. 49 einzigartige HTML-IDs. Die Bilder aus diesem Test sind statische DOM/CSS-Prüfungen.

## Grenzen / noch offen

- Kein vollständiger Live-Test der originalen Three.js-WebGL-Szene auf iPhone/Safari in dieser Umgebung. Echte Performance, Touch-Feeling und Effektwirkung sind noch nicht visuell abgenommen.
- Das Sonnen-Dorf ist noch nicht auf dem angestrebten grafischen Referenzniveau. Insbesondere Architektur, Licht, Landschaft und Figuren benötigen weiterhin viel Arbeit.
- Die 3-Schritte-Aktivitäten bieten aktuell keine visuellen Animationen der Möbel oder Hände. Das wäre ein späterer Qualitätsdurchgang.
- Werkstattfortschritte werden im Browser und optional in **V23-Backups** gespeichert; sie werden nicht in ältere JSON-Sicherungen rückwirkend geschrieben.

## Laufzeitdateien

`index.html`, `styles.css`, `game.js`, `README.md`.

Die Testskripte, Mockup-Bilder, Baselines und interne Arbeitsdateien sind nicht Teil des vierteiligen Laufzeitpakets.
