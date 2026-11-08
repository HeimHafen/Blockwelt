# Blockwelt – Kleine Baumeister (V2)

Ein eigenständig programmiertes, friedliches 3D-Blockspiel für Kinder. Es orientiert sich am Prinzip des Bauens und Entdeckens in Blockwelten. **Kein offizielles Minecraft-Produkt.** Keine kopierten Minecraft-Grafiken, -Sounds oder -Dateien.

## Neu in V2

- Größere Welt: 36 × 36 statt 26 × 26 Blockfelder, mehr Bäume.
- Zwei zusätzliche Materialien: Sand und Bretter (jetzt sieben Baumaterialien).
- Gedrückt gehaltene Tasten zum fortlaufenden Abbauen oder Bauen.
- Optionaler Flugmodus, über das Menü ein- und ausschaltbar: Beim Fliegen mit HOCH und RUNTER steigen oder sinken.
- Letzte Änderung rückgängig machen (bis zu 40 Schritte innerhalb derselben Spielsitzung).
- Welt als JSON-Datei sichern und V2-Sicherung wieder laden.
- Etwas kompaktere Materialleiste, sodass möglichst alle sieben Baumaterialien auf ein iPhone-Display passen.

## Bewusst unverändert

- Die 3D-Grafik und grundlegende Steuerung aus V1.
- Das Speicherformat und der lokale Speicherschlüssel: `blockwelt-kleine-baumeister-v1`.
- Bereits gespeicherte V1-Bauänderungen werden weiter eingelesen (auf demselben Gerät, unter derselben Webadresse und mit unveränderten Browserdaten).
- Ohne Werbeanzeigen, Kampf, Monster oder Account.

## Update auf GitHub Pages

1. **Backup anlegen:** Das bisherige Repository als ZIP herunterladen (GitHub: Code → Download ZIP); bereits erstellte Bauten bleiben grundsätzlich nur im Browser und sollten nach dem Update über „Welt sichern“ als Datei gesichert werden.
2. Die **vier Dateien** `index.html`, `styles.css`, `game.js`, `README.md` aus diesem Paket direkt in das Hauptverzeichnis des Repositories `Blockwelt` hochladen. Bei bestehendem Namen die alte Datei ersetzen. **Nicht** die ZIP selbst hochladen.
3. Änderungen auf `main` übernehmen (Commit). GitHub Pages soll weiterhin von `main` / `/(root)` veröffentlichen.
4. Die bisherige Website erneut öffnen. Bei veralteten Dateien in Safari neu laden. Keine Browserdaten löschen.

Beispiel: https://heimhafen.github.io/Blockwelt/

## Bedienung

- **iPhone/Android:** Links den Joystick benutzen, rechts im freien Bildbereich wischen, „SPRINGEN“, „ABBAUEN“ und „SETZEN“ antippen. Die Bauen/Abbauen-Tasten kann man für mehrere Blöcke gedrückt halten.
- **Flugmodus:** Menü ☰ → „Flugmodus einschalten“ → weiterspielen. HOCH / RUNTER gedrückt halten. Im Menü wieder ausschalten.
- **Rückgängig:** Menü ☰ → „Letzten Block rückgängig“. Funktioniert innerhalb der aktuellen Sitzung; nach Neustart beginnt die Rückgängig-Liste leer.
- **Sicherung:** Menü ☰ → „Welt sichern“ (JSON-Datei herunterladen), „Welt laden“ (diese Datei auswählen und Austausch bestätigen). Der Import ersetzt die aktuelle Bauwelt.
- **Computer:** WASD/Pfeiltasten, Leertaste, Maus ziehen; linker Mausklick abbauen, rechter setzen. Tasten 1–7 wählen das Baumaterial. Mit Strg+Z die letzte Aktion rückgängig machen. Im Flugmodus E/Leertaste hoch und Q/Umschalttaste runter.

## Hinweise und Grenzen

- **V2 ist ein Prototyp und wurde nicht auf einem echten iPhone durchgetestet.** HTML-Struktur, JavaScript-Syntax und sichtbares Responsive-Layout sind geprüft, aber echte Touch- und WebGL-Funktionen müssen auf dem Zielgerät getestet werden.
- Offlinefähigkeit und Synchronisierung über mehrere Geräte fehlen weiterhin. Die Welt ist endlich und hat noch keine Höhlen, Crafting-, Inventar-, Tier-, Multiplayer- oder komplexen Mob-Systeme.
- Browser-Löschung kann die lokale Welt entfernen. Die Sicherungsfunktion ist deshalb besonders wichtig.
- Die 3D-Engine Three.js 0.187.0 (MIT) wird online über jsDelivr geladen; beim ersten Spielstart wird eine Internetverbindung benötigt.

Three.js: https://threejs.org/ · Lizenz: https://github.com/mrdoob/three.js/blob/master/LICENSE
