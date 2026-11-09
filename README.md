# Blockwelt V9 – Weltenzauber

Ein eigenständig entwickeltes, kinderfreundliches **3D-Blockbau-Abenteuer** als Web-App für iPhone, Android und Desktop. Das Spiel verwendet selbst erzeugte Pixeltexturen und Three.js (MIT); keine originalen Minecraft-Dateien, -Modelle oder -Grafiken. Die visuelle Orientierung an spektakulären Blockspiel-Videos ist ein langfristiges Designziel, **keine Zusage fotorealistischer Shader-Qualität**.

## V9: Gezielter grafischer Qualitätsschritt

- **Fernsicht repariert:** Die vereinfachte Fernlandschaft erhält rundum geschlossene Felsflanken. Das soll die hohl wirkenden Gitter- und Schwebekanten der bisherigen Fernansicht vermeiden.
- **Himmelswarte als kleine Burg:** Hauptturm, zwei Seitentürme, Fenster, Zinnen und Mauern statt einer einzelnen Steinsäule.
- **Kristallfall:** Breiterer, unregelmäßig abgestufter Felsrücken mit mehrstufigem Wasserlauf und flacherem Uferbecken.
- **Dorfhäuser:** Vier unterschiedlich gedeckte Giebeldächer; feinere Fensterläden, Holzbänder und Blumenkästen als leichte, nicht kollidierende Dekoration.
- **Neue originale Pixelmaterialien:** Detailreichere 64×64-Texturen für Stein, Holz, Gras, Erde, Sand, Wasser, Pflaster u. a.; es sind keine zusätzlichen Bilddateien erforderlich.
- **Weicheres Tageslicht:** Warmes Umgebungslicht, dezente kühle Seitenaufhellung und weniger früh einsetzender Nebel.
- **Grafik-Auswahl im Menü:** „Schön“ (höhere Renderauflösung) und „Flüssig“ (niedrigere Renderauflösung), ohne Spielstände zu verändern.
- **Übersichtlicheres Menü für Kinder:** „Losspielen“ steht gut sichtbar oben. Schnellreiseziele, Grafikeinstellungen und Spielstände sind in drei aufklappbaren Bereichen organisiert.

Das Spielfeld bleibt 192 × 192 Felder groß und verwendet Chunk-Streaming und vereinfachte entfernte Landschaft. Tiere, friedliche Schleicher, Bewohner, Bauen, Abbauen, Flugmodus und Tageszeiten sind weiterhin vorhanden.

## Vor jedem Update: persönliche Welt sichern

1. Aktuelle Blockwelt öffnen: https://heimhafen.github.io/Blockwelt/
2. ☰ → **Meine Bauwerke** → **Welt sichern**. Die heruntergeladene JSON-Datei in „Dateien“ behalten.
3. Optional GitHub-Repository als ZIP sichern. **Ein GitHub-Backup allein enthält die lokal gespeicherten Bauten nicht.**
4. Die vier Dateien `index.html`, `game.js`, `styles.css`, `README.md` aus dem V9-Archiv direkt in das Hauptverzeichnis von `HeimHafen/Blockwelt` hochladen und die gleichnamigen Dateien ersetzen. **Nicht die ZIP-Datei selbst hochladen.**
5. Auf `main` committen (bei Working Copy: Remote-Referenz `refs/heads/main`, Source `refs/heads/main`, Force Push aus).
6. Nach erfolgreicher GitHub-Pages-Veröffentlichung öffnen: https://heimhafen.github.io/Blockwelt/?v=9
7. Falls alte Bauwerke fehlen: ☰ → Meine Bauwerke → Welt laden und die JSON-Sicherung importieren. **Keine Browserdaten löschen.**

## Bedienung

- Linker Joystick: bewegen; rechts im Spielbild streichen: umsehen.
- Springen, Abbauen, Setzen und Materialleiste am unteren Rand.
- ☰ → Orte entdecken: Startwiese, Sonnen-Dorf, Himmelswarte, Birken-Dorf, Kristallfall.
- ☰ → Welt & Grafik: Bewohner/Tiere, Sichtweite, Renderqualität, Licht und Flugmodus.
- ☰ → Meine Bauwerke: letzten Block rückgängig, exportieren, importieren oder die Welt neu beginnen.
- Am Computer: WASD, Leertaste, Maus ziehen; 1–9 für Materialien.

## Stand der Prüfungen

- **Bestanden:** JavaScript-Syntaxprüfung, HTML-Bedienelemente, alte Höhen- und Geländeformeln, alter Speicher-/Export-/Importcode sowie programmatische Kontrollen der vier Hausdächer, der Burgtürme und des Fels-/Wasserfall-Aufbaus.
- **Bestanden:** Menü-Darstellung mit Chromium bei 393×852, 375×667 und 844×390; Auswahlfelder und Bereiche sind im Menü vorhanden, Scrollbarkeit ist vorgesehen.
- **Nicht in dieser Entwicklungsumgebung möglich:** Vollständiger Live-WebGL-/Touchtest und FPS-Messung auf einem echten iPhone. Auch die grafische Wirkung muss nach dem Hochladen mit tatsächlichen Screenshots kontrolliert werden.

Kompatibilität: Der vorhandene Browser-Speicherschlüssel `blockwelt-kleine-baumeister-v1` sowie Gelände- und Speicherfunktionen wurden beibehalten. Die neue Grafik und neu erzeugte Bauwerke können die Ansicht an bestimmten Orten verändern; eigene gespeicherte Blockänderungen bleiben auf die generierte Welt anwendbar.

Technik: Three.js 0.187.0 wird aus jsDelivr geladen und erfordert Internet beim initialen Aufruf. Three.js: https://threejs.org/ · Lizenz: https://github.com/mrdoob/three.js/blob/master/LICENSE
