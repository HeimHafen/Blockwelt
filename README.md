# Blockwelt – Kleine Baumeister (V3)

Eigenständiges, friedliches 3D-Blockspiel für Kinder, das im Browser auf iPhone, Android und Desktop läuft. Inspiriert vom allgemeinen Prinzip kreativer Klötzchen-Sandboxspiele; **kein offizielles Minecraft-Produkt** und keine Minecraft-Originalgrafiken oder -Dateien.

## Neu in V3

- **64 × 64 Blockfelder** statt 36 × 36; der ursprüngliche V2-Bereich (x/z jeweils -18 bis 17) bleibt **Block für Block unverändert**.
- Neue Landschaft außerhalb der alten Welt mit hügeligem **Waldland**, **Sandtal**, **Felsenberg** und einem ausgehöhlten, begehbaren **Höhlengang** im östlichen Berg.
- Insgesamt **neun** wählbare Bausteine: Gras, Erde, Stein, Holz, Blätter, Sand, Bretter, Ziegel, Pflaster. Materialleiste seitlich wischen, um weitere Steine zu sehen.
- Schnelleres blockweises Neuberechnen der Grafik statt kompletter Neuaufbau bei jedem gesetzten/abgebauten Block (16 × 16-Felder-Chunks).
- Präziseres Fadenkreuz in der **tatsächlichen Mitte** der anvisierten Kamerarichtung.
- Ortsanzeige für die verschiedenen Landschaften.
- **Zur Startwiese** im Menü, um beim Erkunden schnell zurückzukommen.
- Bestehender Flugmodus, Sprungtaste, Touch-Joystick, Langdruck zum Weiterbauen, Undo und Dateisicherung bleiben erhalten.
- V2-Sicherungsdateien und neue V3-Sicherungsdateien können geladen werden.

## Wichtig: Vor dem Update die Bauwelt sichern

1. Die **aktuelle V2** öffnen: https://heimhafen.github.io/Blockwelt/
2. In der App **☰ → Welt sichern** wählen und die heruntergeladene JSON-Datei auf dem iPhone in der **Dateien-App** behalten. Sie enthält die bislang gebauten/abgebauten Blöcke.
3. Optional auch das **GitHub-Repository als ZIP** sichern. **Ein Repository-ZIP enthält nicht den persönlichen Spielstand im Browser.**
4. Die vier Dateien aus dem **V3-ZIP** entpacken und direkt in das **Hauptverzeichnis** des GitHub-Repositories `HeimHafen/Blockwelt` hochladen (gleichnamige Dateien ersetzen; **nicht das ZIP selbst hochladen**).
5. Commit auf `main`, GitHub Pages auf `main` / `/(root)` belassen.
6. Die Website neu laden. **Keine Browserdaten oder Websitedaten löschen.** Der bisherige lokale Speicherschlüssel bleibt gleich: `blockwelt-kleine-baumeister-v1`.
7. Prüfen, ob deine alten Bauten noch da sind. Falls nicht, über **☰ → Welt laden** die zuvor gesicherte JSON-Datei importieren.

**Hinweis:** „Welt neu anfangen“ löscht die lokal gespeicherten Bauänderungen; vorher unbedingt sichern. Der Browser kann lokale Spieldaten bei Löschung der Websitedaten verlieren.

## Bedienung

- **iPhone/Android:** links Joystick, im Spielbild rechts wischen für Blickrichtung, Springen, Abbauen, Setzen; Knöpfe zum fortlaufenden Bauen gedrückt halten.
- **Materialleiste:** horizontal wischen und einen Block antippen.
- **Menü:** Flugmodus, zurück zur Startwiese, rückgängig, Export/Import, neuer Spielstand.
- **Computer:** WASD/Pfeiltasten, Leertaste, Maus ziehen; links klicken abbauen, rechts setzen, Tasten 1–9 zum Materialwechsel, Strg+Z zum Rückgängigmachen.
- **Im Flugmodus:** Hoch = Springtaste / E, Runter = Sinken / Q bzw. Umschalt.

## Technische Hinweise

- Die V2-Basis der alten 36 × 36 Felder wurde programmatisch gegen die V3-Welt verglichen: **keine abweichenden Blöcke in diesem Bereich**.
- JavaScript-Syntax, neun Material-IDs und das responsive HTML/CSS-Menülayout sind geprüft.
- **Noch kein vollständiger 3D-/Touch-Test auf einem echten iPhone für V3.** Die neuen Berge, Höhlen und Chunk-Renderer müssen nach Veröffentlichung auf dem Gerät getestet werden.
- Ohne Multiplayer, Tiere, Crafting oder echtes Wassersystem. Keine Werbung, kein Account, keine Kämpfe.
- Three.js 0.187.0 (MIT) wird, wie in V2, über jsDelivr geladen. Internetverbindung ist nötig.

Quelle Three.js: https://threejs.org/ · MIT: https://github.com/mrdoob/three.js/blob/master/LICENSE
