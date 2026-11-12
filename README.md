# Blockwelt V30 – Turmabenteuer in der Drachenfestung

**Status:** Technisch geprüfter Teststand. Die iPhone-WebGL-Darstellung und die Bildrate sind noch nicht live geprüft. Das KI-Referenzbild stellt weiterhin ein gestalterisches Ziel dar, keine 1:1 geprüfte Liveansicht.

## Neu gegenüber V29

Die Turmaufstiege wurden neu angelegt: geschlossene, echte Wendeltreppen ersetzen die teilweise unterbrochenen Rampen aus V29. Von der Großen Wiese gelangt man jetzt laut unabhängiger geometrischer Wegsuche ohne Flugmodus auf die Dächer **aller sechs Türme** (beide Fronttürme, beide rückwärtigen Türme und beide äußeren Türme). Auch der zentrale Bergfried ist bis zur höchsten Plattform erreichbar.

Im zentralen Bergfried gibt es zwei kleine **Glutkabinette** mit leuchtenden Sockeln und Wandzeichen. Die Türme erhalten innen Orientierungspunkte und auf dem Dach ein warm leuchtendes Signal. An der Hofkante wurden zwei zurückhaltende Wegmarken ergänzt. Hauptwege und die geprüften Turmaufstiege bleiben offen.

**Unverändert:** Drache, fünf Zombies und fünf Creeper aus V28, die Festungsbrücken und -bauten, die Abenteuerwelt sowie die bestehenden Werkstatt-Abenteuer. Die Kreaturen können weiterhin über das Menü ausgeschaltet werden und zerstören keine selbst gebauten Blöcke.

## Speicherstände und Sicherheit

- Abenteuerwelt: `blockwelt-kleine-baumeister-v1`
- Große Wiese: `blockwelt-grosse-wiese-v26`
- Aktive Welt: `blockwelt-aktive-welt-v26`
- Diese **Speicherschlüssel sind unverändert**. Eigene gespeicherte Blockänderungen haben Vorrang vor dem generierten Bauplan. Bereits selbst veränderte Turmblöcke können daher örtlich einzelne neue Stufen beeinflussen.
- Die Umgebung der Festung und die ursprüngliche Abenteuerwelt wurden nicht umgestaltet.

## Einspielen

1. **Vorher sichern:** In jeder Welt im Spielmenü »Welt sichern« benutzen. Auch das aktuelle GitHub-Repository bzw. den bisherigen Commit sichern.
2. Das ZIP entpacken. Die enthaltenen Dateien `index.html`, `styles.css`, `game.js`, `README.md` ersetzen die gleichnamigen Dateien im GitHub-Repository `HeimHafen/Blockwelt`.
3. Empfehlenswert: erst den Testbranch `test/blockwelt-v30-turmabenteuer` verwenden. Beachte, dass ein GitHub-Testbranch nicht automatisch auf die bisherige Pages-Live-URL veröffentlicht wird. Für das Testen auf der Pages-URL muss die Deployment-Quelle entsprechend eingerichtet oder nach Sicherung auf `main` übernommen werden.
4. Im Spiel **Große Wiese → Zur Drachenfestung reisen**, das Haupttor betreten, danach die Türme über die Treppen hinaufsteigen. Dabei die Grafik- und Bedienleistung auf dem iPhone beobachten.
5. Bei niedriger Bildrate **Grafik: Flüssig** wählen und gegebenenfalls **Festungswesen** ausschalten.

## Prüfungen in dieser Entwicklungsrunde

- `node --check` auf `game.js`: bestanden.
- 53 HTML-Kennungen: eindeutig; alle 47 per JavaScript referenzierten IDs vorhanden.
- Unabhängige Raster-Wegsuche von der Wiese aus: alle 6 Turmdächer, die oberen Wehrgänge sowie die höchste Bergfriedplattform erreicht, ohne Flugmodus oder Teleportation.
- Vergleich zum V29-Bauplan: 40.100 bisherige vs. 40.156 aktuelle generierte Festungsblockeinträge; keine Veränderung an den geprüften Bereichen außerhalb der Festung und keine Änderung am Wiesengelände.
- Bisherige Speicherschlüssel und Umschaltung der Festungswesen vorhanden.
- ZIP-Struktur und CRC-Integrität geprüft.

**Noch offen:** Echte vollständige WebGL-Abnahme auf einem iPhone; längerfristige FPS-/Speicher- und Touchscreen-Prüfung; pixelgenaue Grafikübereinstimmung mit dem KI-Konzeptbild (nicht erreicht).
