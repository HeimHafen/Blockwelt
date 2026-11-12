# Blockwelt V29 – Drachenfestung mit Turmzugang | Labor-Testpaket

## Wichtiger Status
**Technisch geprüfte Testversion, keine visuell abgenommene finale Premiumfassung.**
Die gezeigte KI-Konzeptgrafik mit einer riesigen Drachenfestung kann nicht automatisch 1:1 in die aktuelle Three.js-Engine übersetzt werden. Diese Version enthält echte 3D-Figuren, die große Netherfestung und zusätzliche Turmtreppen für begehbare Türme. Eine vollständige Safari-WebGL- und FPS-Prüfung auf dem iPhone steht noch aus.

## Neu gegenüber V27

- **Alle Haupttürme sind jetzt per Treppe erreichbar**: Fronttürme, Hintertürme und die äußeren Wehrtürme besitzen echte begehbare Aufstiege zu ihren Ebenen und aufs Dach.
- Ein **großer fliegender, blockbasierter Drache** mit animierten Flügeln, segmentiertem Schwanz, violett leuchtenden Augen und vereinfachtem Atem-Partikeleffekt (nur im Grafikmodus *Schön*).
- **5 Zombies und 5 Creeper** als echte 3D-Figuren, verteilt auf der freien Wiese, der Festungstreppe, dem Innenhof und oberen Wehrgängen.
- Die Figuren bewegen sich langsam, orientieren sich am Spieler und berücksichtigen vorhandene Böden, eigene Blockänderungen und Hindernisse.
- Bei Nähe reagieren die Kreaturen, ohne Bauwerke zu beschädigen: **keine zerstörerischen Explosionen, kein Kampf- oder Schadenssystem**.
- Acht rote Festungsbanner mit Wappen und zehn zusätzliche Lichtakzente an ausgewählten Türmen, als kompakte instanzierte Geometrie.
- Sichtweite auf der *Großen Wiese* angepasst, damit die große Festung weniger früh im Nebel verschwindet.
- Der Menüpunkt *Festungswesen* schaltet Drachen, Zombies und Creeper gemeinsam ein/aus. In der Abenteuerwelt schaltet derselbe Knopf weiter Tiere und Bewohner.
- Im Grafikmodus *Flüssig* werden die violetten Atempartikel nicht angezeigt.

## Bestehende Welten und Bauwerke

- Die beiden Weltenslots bleiben erhalten: **Abenteuerwelt** und **Große Wiese**.
- Speicherschlüssel bleiben **exakt unverändert**: `blockwelt-kleine-baumeister-v1`, `blockwelt-grosse-wiese-v26`.
- Der bestehende Festungsbauplan bleibt die Grundlage. Zusätzlich wurden feste Treppen- und Podestblöcke in mehreren Türmen ergänzt, damit die Turmebenen ohne Flugmodus erreichbar sind.
- Die bisherigen Werkstatt-Aktivitäten und Entdeckerbuch-Speicher bleiben erhalten.
- Spieleränderungen werden nach dem generierten Festungsplan angewendet und haben Vorrang.
- Figuren werden nur in der Großen Wiese angezeigt. Die Abenteuerwelt enthält weiterhin ihre eigenen Tiere und Bewohner.

## Installation (vorher sichern!)

1. In der aktuell geöffneten Blockwelt beide Welten einzeln über **Welt sichern** als JSON exportieren. Falls du bisher auf `main` arbeitest, sichere zusätzlich den aktuellen GitHub-Commit.
2. Lade das ZIP herunter und entpacke es. Enthalten sind **`index.html`, `styles.css`, `game.js`, `README.md`**.
3. Am besten einen neuen Testbranch in `HeimHafen/Blockwelt` erzeugen und die vier Dateien dort ersetzen. Nicht direkt `main` überschreiben, bevor der iPhone-Test bestanden ist.
4. Nach dem Veröffentlichen eines Tests: **Große Wiese** wählen, zum Festungstor reisen und die Drachen-/Gegnerbewegungen beobachten. Achte auf flüssige Bildrate und mögliche Überlappungen.
5. Der Menüpunkt **Festungswesen** lässt alle neuen Kreaturen ausschalten. **Grafik: Flüssig** reduziert visuelle Effekte.

## Interne Prüfungen

- JavaScript-Syntax und HTML/JS-Elementreferenzen geprüft.
- Festungsgeometrie mit V27 verglichen.
- Alle zehn Spawnflächen über die konkrete Blockbelegung geprüft.
- 1.000 simulierte Gegner-Bewegungsiterationen auf Kollisionen geprüft.
- Welttrennung und Kreaturen-Schalter geprüft.
- Menülayout bei mehreren iPhone-Auflösungen geprüft.
- ZIP-Datei auf Vollständigkeit und CRC geprüft.

**Noch offen:** echter durchgehender Three.js-WebGL-Lauf auf dem iPhone, grafische Abnahme mit echten Screenshots, langfristige FPS-/Speicherprüfung. Das Konzeptbild darf nicht als Livebild ausgegeben werden.
