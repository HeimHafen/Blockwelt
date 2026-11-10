# Blockwelt V12 – Natur & Präzision

**Status: interner, technisch geprüfter Teststand vom 10. November 2026. Nicht als grafisch abgenommene Vollversion freigegeben.**

Blockwelt ist eine eigenständige, kinderfreundliche, frei begehbare Blockwelt als Web-App. Die 3D-Technik basiert auf Three.js. Sämtliche Blocktexturen und die neuen Pflanzenformen werden zur Laufzeit selbst erzeugt; keine Minecraft-Grafiken, Modelle oder fremden Spielinhalte werden übernommen.

## Änderungen gegenüber V11

### Präzise Interaktion und geringere Rechenlast

- Die bisherige Raycaster-Suche durch zahlreiche InstancedMesh-Würfel wurde durch einen eigenen **3D-DDA-Blockstrahl** ersetzt. Er folgt dem festen Voxelraster, berechnet die getroffene Blockseite und erlaubt weiterhin Abbauen und Setzen am richtigen Nachbarblock.
- Bewohner dürfen weiterhin nur angesprochen werden, wenn keine massiven Blöcke die Blicklinie verdecken. Diese Prüfung nutzt denselben leichten Rasterstrahl statt einer zusätzlichen 3D-Mesh-Raycaster-Abfrage.
- Die Reichweite von 5,6 Blockeinheiten bleibt gleich. Diese Änderung optimiert *nur die Auswahl/Interaktion*, nicht das eigentliche Rendering.

### Differenziertere Natur ohne neue Baublöcke

- Selbst erzeugte, pixelartig texturierte Pflanzen, zwei gekreuzte Ebenen pro Pflanze sowie kleine polygonale Steine ergänzen geeignete Flächen.
- Die Details sind deterministisch nach Weltkoordinaten verteilt und werden in gemeinsam gerenderten InstancedMeshes pro Chunk gruppiert.
- Sie sind **keine** festen Baublöcke, beeinflussen Kollisionen und Weltbearbeitung nicht und erscheinen nicht auf Häuserböden oder bebauten Flächen.
- Im Modus **„Grafik: Flüssig“** werden die zusätzlichen 3D-Pflanzen und Steine ausgeblendet, um mobile Geräte zu entlasten. Der Modus **„Grafik: Schön“** zeigt sie an.

### Begehbare Dorfhäuser

- Die Innenräume und Türen werden beim Generieren freigeräumt, auch wenn die natürliche Geländehöhe unter dem Haus höher liegt. Der Boden wird bei Bedarf abgestützt.
- Wenige kleine Einrichtungsblöcke und eine Deckenlaterne beleben den Innenraum. Die Hauptgänge und Türen bleiben frei.
- **Wichtig:** Diese Änderungen an den automatisch generierten Dorfgebäuden befinden sich außerhalb des ursprünglichen 64×64-Weltausschnitts. Spielerbearbeitungen werden nach der Generierung wieder darübergelegt.

### Unverändert

- Alle 36.864 Höhenwerte des 192×192-Geländegenerators.
- Alle 21.556 generierten Baublöcke im ursprünglichen 64×64-Ausschnitt.
- Bisheriger Speicherschlüssel `blockwelt-kleine-baumeister-v1`, Welt-Import und -Export. Bauwerke werden **nicht** durch den Versionswechsel zurückgesetzt.
- Entdeckerbuch, Kompass, Waldlager, Schattenruine, Himmelswarte, Wasserfall und sämtliche bisherigen Orte.
- Die vier Dateien für GitHub bleiben: `index.html`, `styles.css`, `game.js`, `README.md`.

## Durchgeführte Tests

Die reproduzierbaren Tests liegen im Entwicklungsordner, nicht im vierteiligen Austausch-ZIP:

- `node --check game.js` – JavaScript-Syntax OK.
- `node raycast_qa.cjs` – sechs Richtungen, äußere Flächennormale, Reichweitengrenze und **1.867** Vergleiche gegen einen unabhängigen Ray/AABB-Schnitt. Im Messfall durchschnittlich **acht Blockabfragen** pro Strahl. Das sind keine FPS-Messwerte.
- `node houses_qa.cjs` – begehbare Innenräume und Türöffnungen bei **sieben** Geländehöhen.
- `node world_qa.cjs` – **36.864** Höhen identisch; Waldlager und Konfliktschutz überprüft.
- `node compat_qa.cjs` – **21.556** ursprüngliche Blöcke identisch; Import/Export-Routinen und Speicherschlüssel verglichen.
- `node movement_qa.cjs` – Schwimmen über 300 Simulationsschritte stabil.
- `python ui_review.py` – Chromium-HTML/CSS-Kontrolle bei 375 × 667, 393 × 852 und 844 × 390 Pixel. Keine Überlappung zwischen Entdeckerbuch und Kompass; Menü erreichbar.
- Prüfung auf doppelte HTML-IDs und fehlende DOM-Referenzen – OK.

### Noch offen

Die vollständige Web-App konnte in dieser Umgebung mangels lokaler Three.js-Bibliothek und wegen gesperrter Browsernavigation **nicht** mit originalem WebGL gerendert werden. Deshalb sind die tatsächliche 3D-Bildqualität, die iPhone-FPS, die Touchsteuerung und die Grafikleistung mit vielen Pflanzen **noch nicht geprüft**. Ein Test mit dem originalen Spiel auf einem echten Gerät bleibt erforderlich. Es wurden keine künstlichen Livebilder zur Freigabe herangezogen.

## Sichere Testinstallation

1. Auf deinem bisherigen Blockwelt-Stand **„Welt sichern“** benutzen; die heruntergeladene JSON-Datei aufbewahren.
2. Das bisherige Repository sichern. V12 zunächst in einem **Testbranch** ausprobieren, nicht ungeprüft auf `main` übernehmen.
3. Vier Projektdateien an gleicher Stelle austauschen.
4. In Safari oder Chrome das Starten, Bewegen, Abbauen, Setzen, Schwimmen und die Speicherfunktion prüfen. Dorfhäuser betreten und prüfen, ob die Naturdetails in beiden Grafikmodi korrekt erscheinen.
5. Bei Problemen auf den unveränderten Live-Stand zurückgehen und die JSON-Sicherung bereithalten.

**Commit-Zusammenfassung:** `Blockwelt V12 – Natur, präzise Blockauswahl und begehbare Häuser (Test)`

**Remote-Referenz für einen gesonderten Testbranch:** `refs/heads/test/blockwelt-v12-natur-praezision` (Branch im Repository anlegen bzw. auswählen; Force Push aus).
