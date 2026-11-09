# Blockwelt V5 – Mega-Welt

Ein eigenständiges, Minecraft-ähnliches 3D-Kreativspiel für Kinder. Spielbar als Web-App im mobilen Safari, Chrome und am Computer. Die Blockwelt benutzt selbst erzeugte Pixeltexturen und selbst entworfene Figuren; es werden keine Minecraft-Originaldateien, -Texturen oder -Modelle verwendet. **Keine offizielle Minecraft-Version.**

## Was ist neu?

- **192 × 192 Weltfelder**, statt 64 × 64 in V3 (neunmal so viel Fläche).
- **Chunk-Streaming:** Auf dem iPhone werden höchstens 5 × 5 sichtbare Chunks mit einem kleinen Datenpuffer rund um die Spielfigur gehalten. Auf Desktop etwas mehr. Das gesamte 192 × 192-Gelände wird nicht auf einmal als Grafik aufgebaut.
- Die vollständige ursprüngliche **64 × 64-V3-Landschaft bleibt Block für Block unverändert**. Vergleich durchgeführt: 21.556 belegte alte Blockpositionen, null Unterschiede. Alte Bauten werden mit demselben Speicherschlüssel geladen.
- Neue Wälder, Tannenwald, Bergland, Sandland und zwei kleine Seen; zwei einfache Dörfer mit Blockhäusern, Wegen und Brunnen.
- **Bewohner** gehen selbstständig umher. **Grüne Schleicher** sind an Creeper-artige Kreaturen angelehnt, aber eigenständig gestaltet. In dieser Kinderversion **keine Angriffe, kein Schaden und keine Explosionen**.
- Nähe/Fadenkreuz: bei Figuren erscheint eine freundliche Interaktionsschaltfläche.
- Im Menü: **Zum Sonnen-Dorf** springen, **Bewohner/Schleicher ein- und ausschalten**, **Tag/Nacht** wechseln.
- **12 auswählbare Bausteine:** Gras, Erde, Stein, Holz, Blätter, Sand, Bretter, Ziegel, Pflaster, Glas, Gold und Wasser. Ein zusätzlicher Wegblock wird in Dörfern automatisch verwendet.
- Die bekannten Funktionen bleiben: iPhone-Joystick, Blicksteuerung, Springen, Flugmodus, Abbauen/Setzen, Rückgängig, zurück zur Startwiese und Welt als JSON exportieren/importieren.

## Unbedingt zuerst sichern

1. Öffne **vor dem Austausch** deine bisherige Blockwelt: <https://heimhafen.github.io/Blockwelt/>.
2. Im Spiel: `☰ → Welt sichern`. **Die Datei `Blockwelt-Meine-Welt.json` in der Dateien-App behalten.** Sie ist die Sicherung deiner selbst gesetzten und entfernten Blöcke. Ein GitHub-Repository-Backup sichert **keine** lokalen Browser-Spielstände.
3. In GitHub zusätzlich den bisherigen Projektstand als ZIP sichern oder den V3-Commit notieren.
4. **Keine Safari-/Website-Daten löschen**, bis der neue Spielstand geprüft ist.

## Installation via GitHub auf dem iPhone

1. Das ZIP `Blockwelt_V5_Mega_Welt_WebApp.zip` herunterladen und in **Dateien** entpacken.
2. In GitHub das Repository `HeimHafen/Blockwelt` öffnen, **nicht** `Family-Spots-Map`.
3. Alle **vier entpackten Dateien direkt ins Hauptverzeichnis** des Repositories hochladen. Die bisherigen `index.html`, `game.js`, `styles.css`, `README.md` dadurch ersetzen. **Nicht das ZIP selbst hochladen.**
4. Auf `main` committen. GitHub Pages bleibt bei `main` / `/(root)`.
5. Nach erfolgreichem Deployment `https://heimhafen.github.io/Blockwelt/` neu laden. Im Startmenü muss `Mega-Welt · V5` stehen. Bei Cache-Problemen Safari neu laden; keine Website-Daten löschen.
6. Spielen, Dorf besuchen, Bauänderungen und Speicherfunktion testen. Falls Bauten fehlen, `☰ → Welt laden` benutzen und die vorher exportierte JSON-Datei wählen.

## Arbeiten mit Working Copy (wenn verwendet)

- Repository: `HeimHafen/Blockwelt`
- Source-Branch: `refs/heads/main`
- Vorhandene oder neue Remote-Referenz: `refs/heads/main`
- **Force Push: Aus**.
- Commit-Zusammenfassung: `Blockwelt V5 – Mega-Welt, Dörfer und freundliche Bewohner`
- Commit-Details: `192×192 Welt mit Chunk-Streaming, zwei Dörfern, neuen Biomen, 16 friedlichen Kreaturen, Tag/Nacht und Bau- und Speicherstand-Kompatibilität.`

## Technisches und Grenzen

- Alle Spiellogik läuft lokal im Browser mit Three.js 0.187.0 über jsDelivr (MIT-Lizenz); für den ersten Start ist Internet nötig.
- Der alte lokale Speicherschlüssel `blockwelt-kleine-baumeister-v1` wird **weiterverwendet**. Importiert werden Exportdateien aus V2, V3 und V5. V1 wird weiterhin über dessen lokalen Browser-Spielstand berücksichtigt.
- Neue Baublöcke und geladene entfernte Regionen bleiben als Änderungsdaten gespeichert, während die unberührte Landschaft deterministisch neu erzeugt wird.
- Die Dörfer sind einfache, vordefinierte Blockbauten. Figuren besitzen einfache Bewegungsabläufe, **noch keine ausgefeilte Wegfindung, Handel, Crafting, KI-Kämpfe oder Multiplayer**. Das Wasser ist ein einfacher Wasserblock ohne ausgereifte Schwimmphysik.
- **Tests:** `node --check` bestanden. Technischer Browser-Lauf mit einer Three.js-Testattrappe: Welt-Streaming, Dorf, See, Nachtfunktion und Menüs ohne Skriptfehler. Ursprüngliches 64×64-Blockterrain von V3/V5 komplett identisch (21.556 Blöcke). **Ein echter Grafik- und Touch-Test auf einem iPhone steht aus.**
- Die 192×192-Weltgröße bezeichnet die begehbare Gesamtfläche, nicht gleichzeitig geladene Grafik. Auf älteren Smartphones kann ein neues Chunk etwas Ladezeit beanspruchen.

### Zurückrollen

Falls etwas nicht funktioniert, den letzten funktionierenden Commit für `Blockwelt` wiederherstellen und gegebenenfalls die JSON-Weltsicherung wieder importieren. **Ein Downgrade nach längerem Spielen kann neue V5-Bauten außerhalb der 64×64-Welt verlieren; deshalb die JSON vorher separat sichern.**
