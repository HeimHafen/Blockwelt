# Blockwelt V10 – Legendenwelt

**Status: INTERNAL / NICHT FREIGEGEBEN** (10. November 2026)

Die Grafik aus dem KI-Konzeptbild ist nicht als echte Spielgrafik nachgewiesen. Dieses Verzeichnis enthält einen technisch weiterentwickelten, aber nicht vollständig auf einem iPhone geprüften Entwicklungsstand. Keine Freigabe, keine Veröffentlichung.

## Technische Grundlage

* Wiederhergestellte vollständige **V9**-Spiellogik (`game.js` und `styles.css`) plus die bereits entwickelte V10-HTML-Oberfläche.
* Dieselbe Weltgröße 192 × 192; alle 36.864 Terrain-Höhen mit V9 verglichen, unverändert.
* Sämtliche alten 64 × 64 Biome unverändert.
* Browser-Speicherschlüssel `blockwelt-kleine-baumeister-v1` bleibt erhalten; alte Blockwelt-Sicherungen (Formatversion 7) wurden importiert.

## Implementiert in dieser Arbeitsrunde

1. **Schattenruine:** begehbarer gepflasterter Innenhof, Torbogen, verwitterte Außenmauern, Laternen und dezenter magisch-violetter Dunst; Schattenwald-Biom außerhalb der Alt-Welt. Der Hof ist geräumt und bleibt auf begehbarer Höhe.
2. **Entdeckungen:** sechs erkundbare Orte, drei leuchtende Geheimnisse; getrennte Speicherbereiche für Orte und Relikte; gesammelte Kristalle verschwinden nach dem Aufsammeln.
3. **Dörfer:** zusätzliche kleine Marktstände mit gestreiften Dächern, Kisten und Leuchten; instanzierte Dekoration, damit mobile Geräte nur wenige zusätzliche Drawcalls pro Chunk benötigen.
4. **Bewohner:** sechs Rollen mit individuelleren Farben, Kopfbedeckungen, Gesichtern und Dialogen. Gesicht, Hut und Augen sind jetzt Kind-Objekte des drehbaren Kopfes. Bewohner beachten Hindernisse, Sichtlinien und reagieren mit einer kurzen Begrüßungsgeste.
5. **Kamerastart:** Schnellreisen positionieren die Kamera auf dem Dorfweg bzw. am Zielort, Blickrichtung zum Zentrum.
6. **Performance:** gemeinsam genutzte Geometrien für ähnliche Körperteile, NPC-Sichtprüfung auf 125-ms-Intervall, optionale Entwicklermesswerte über `?debug=1`.
7. **UI:** Entdeckerbuch mit sechs Orten und Fortschrittsanzeige; Responsive CSS und reduzierte Animationen für entsprechende Systemeinstellungen.

## Prüfungen

* `node --check game.js` bestanden.
* `node qa_internal.cjs`: **11 Tests bestanden**, einschließlich 192² Terrain-Vergleich, 64² Alt-Biome, begehbarer Ruinenöffnung, Dorf-Haustür, DOM-Kopplung, Speicher-Kompatibilität und NPC-Verhalten.
* `python ui_qa.py`: Menü, Spielstart und Entdeckerbuch bei **375×667, 393×852 und 844×390** geprüft.
* `python runtime_qa.py`: vollständige JavaScript-Initialisierung mit **simulierter** Three.js-API, Menü-/Schnellreise-/Entdeckeraktionen, V9-Backup-Import und Chunk-Rundreise; **0 JavaScript-Laufzeitfehler**.
* **NICHT geprüft:** visuelle Echtzeit-WebGL-Ausgabe mit realer Three.js-Bibliothek; FPS und Touchsteuerung auf einem echten iPhone; detaillierte grafische Übereinstimmung mit dem V10-Konzeptbild. Die Simulation ist nur ein Funktions-Smoke-Test, kein 3D-Rendernachweis.

## Freigabe-Gates

1. Vollständige originale Three.js-Szene im echten Browser rendern und aus dem laufenden Spiel aufnehmen.
2. Architektur, Landschaft und Figuren mit echten Live-Spielbildern beurteilen und visuell verbessern.
3. iPhone-Tests für Steuerung, Bau- und Abbauaktionen, Speichern, Import, Schnellreise und langes Erkundungsspiel.
4. Leistung bei Bewegung über viele Chunk-Grenzen, Bildschirmgrößen und Grafikstufen prüfen.
5. Erst nach visueller und technischer Abnahme ein Austauschpaket veröffentlichen.

Keine externe Veröffentlichung. Die vorherige Live-Version (V9) bleibt unangetastet.

## Weiterer Qualitätsschritt – 10.11.2026 (intern, nicht freigegeben)

Dies ist eine Arbeitskopie von V10 und **keine freigegebene Veröffentlichung**.

* **Licht/Schatten:** Den vorhandenen Instanz-Blöcken wird beim Chunk-Bau ein vorsichtiger Nachbarschafts-/Abdeckungsschatten zugewiesen. Keine teuren zusätzlichen GPU-Schattenkarten.
* **Lebendigere Figuren:** Sechs Berufe tragen unterschiedliche kleine Accessoires; Bewohner bleiben beim nahen Spieler stehen, wenden sich ihm zu, begrüßen ihn gestisch und wandern danach weiter. Tiere können gelegentlich friedlich grasen. Kopfteile bewegen sich weiterhin gemeinsam.
* **Geheimnisvolle Waldgebiete:** Sparsam verteilte violette Lichtpunkte und Pilzgruppen im Schattenwald; warme Lichtpunkte an Dörfern. Instanziertes Rendering ohne zusätzliche Kollision.
* **Beleuchtung:** Langsame, subtile Helligkeitsänderung der Lichtpunkte. Instanzlisten werden nur bei Chunk-Erzeugung erstellt.
* **Sicherheit:** Ursprüngliche V9/V10-Terrain-Höhen, 64x64-Biome, Spielstandformat und Speicherschlüssel bleiben unverändert.

### Nachgewiesene Tests

* `node --check`: gültige JS-Syntax.
* `node qa_internal.cjs`: 11 Struktur-/Welt- und Speicherregressionen bestanden.
* `python runtime_qa.py`: simulierte vollständige Three.js-Initialisierung ohne Laufzeitfehler; V9-JSON-Import, entfernte gesetzte Blöcke nach Chunk-Rundreise, Dorf-/Ruinenwechsel; zusätzliche Tests für Begrüßung, zufügte Hindernisse und Lichtmaterialien.
* `python ui_qa.py`: drei Viewports mit interaktiver Bedienung.

**Noch nicht abgenommen:** Echte WebGL-Bilder, die iPhone-Frame-Rate, Touchsteuerung auf dem Gerät und visuelle Äquivalenz zur Bildvorlage. Keine Veröffentlichung/keine Freigabe.
