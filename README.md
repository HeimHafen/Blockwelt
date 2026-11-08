# Blockwelt – Kleine Baumeister (V1)

Eine eigenständig entwickelte, Minecraft-ähnliche 3D-Bauwelt für Kinder. **Kein offizielles Minecraft-Produkt.**

## Was V1 kann

- Kleine prozedural erstellte 3D-Welt mit Hügeln und Bäumen
- In Ich-Perspektive laufen, umsehen, springen
- Blöcke abbauen und setzen (Gras, Erde, Stein, Holz und Blätter)
- Große Touch-Steuerung für iPhone und Android
- Eigener friedlicher Kreativmodus ohne Monster, Kämpfe oder Werbung
- Automatisches Speichern der Bauänderungen im Browser über `localStorage`

## Installation über GitHub Pages

1. Ein **neues** GitHub-Repository z. B. `Blockwelt` erstellen. Nicht das Repository der Family Spots Map überschreiben.
2. `index.html`, `styles.css` und `game.js` in das Stammverzeichnis des neuen Repositorys laden.
3. Unter `Settings → Pages` die Veröffentlichung von `main` / `(root)` wählen.
4. Den von GitHub bereitgestellten Weblink auf dem iPhone in Safari öffnen.
5. Optional in Safari: Teilen → `Zum Home-Bildschirm`.

**Wichtig:** Zum Laden der 3D-Bibliothek wird anfangs eine Internetverbindung benötigt: die festgelegte Three.js-Version 0.187.0 wird vom jsDelivr-CDN eingebunden. Das Spiel arbeitet danach clientseitig. Offlinefähigkeit/Server-Synchronisierung sind noch nicht implementiert.

## Steuerung

- **Handy:** Links den virtuellen Joystick bewegen, im freien Bildbereich wischen, `SPRINGEN`, `ABBAUEN`, `SETZEN` drücken.
- **Computer:** WASD/Pfeiltasten, Leertaste; Maus ziehen, links abbauen, rechts setzen. Tasten 1–5 wählen Material.
- Fünf Materialien in der Leiste unten auswählen.
- Über ☰ das Spiel pausieren und bei Bedarf die Welt zurücksetzen.

## Grenzen und nächste Schritte

Dies ist ein **erster Prototyp**, nicht das komplette Minecraft. Der Kartenrand ist begrenzt, es gibt noch keine Höhlen, Inventar-Logik, Werkzeuge, Crafting, Tiere, Gegner, Multiplayer oder Server-Speicherung. Bauänderungen sind browser- und gerätegebunden und können verloren gehen, wenn Browserdaten gelöscht werden. Für eine längere Nutzung müssen Performance, Kollisionen und Bedienbarkeit auf echten iPhones/Android-Geräten getestet werden.

## Technik und Rechte

Eigener HTML/CSS/JavaScript-Spielcode mit Three.js (MIT-Lizenz) als Renderer. Eigene generierte Pixeltexturen und eine selbst erzeugte Welt. Keine Dateien, Originalgrafiken oder Markenbestandteile von Minecraft/Mojang/Microsoft integriert. Der Titel „Blockwelt“ ist ein Arbeitstitel.

Three.js: https://threejs.org/ — Lizenz: https://github.com/mrdoob/three.js/blob/master/LICENSE
