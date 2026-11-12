# Blockwelt V33 – Festung & Aussicht

V33 basiert auf Netherfestung Deluxe (V31). Alle sechs Außentürme haben durchgehende Wendeltreppen mit Dachausstieg. Vom Innenhof führen Aufgänge zu den Wehrgängen, den Etagen des Bergfrieds und bis zum höchsten Dach. Die Treppen lassen sich in beide Richtungen ohne Springen benutzen. Beide äußeren Wachtürme sind zusätzlich direkt von der Wiese aus erreichbar. Goldene Ecksteine und Wandlichter markieren die Wendeltreppen. Die Ortsanzeige benennt Gluthof, Thronhalle, Wehrgang und die Ebenen des Bergfrieds.

Das Spiel fängt die Safari-Zoomgesten ab. Die Inventarleiste lässt sich weiterhin seitlich wischen und das Menü vertikal scrollen. Sollte Safari bereits vergrößert sein, öffne **☰ → Welt & Grafik → Ansicht neu laden**. Das startet die Seite mit einer frischen Ansicht und setzt die Spielfigur an die Startposition.

V33 löscht beim Update keine lokalen Spielstände. Bereits gesetzte oder abgebaute Blöcke bleiben wirksam, auch innerhalb der Festung. Selbst gesetzte Hindernisse auf Treppen können im Spiel abgebaut werden.

## Installation

1. Den bisherigen Stand in GitHub oder Working Copy sichern.
2. Das ZIP entpacken. Im bestehenden Blockwelt-Repository `index.html`, `styles.css`, `game.js` und `README.md` durch die neuen Dateien ersetzen.
3. Committen und auf den GitHub-Pages-Branch pushen. Nach dem Deployment die Seite neu laden. Oben steht dann **V33 – Festung & Aussicht**.
4. Über **☰ → Welten auswählen → Große Wiese → Zur Netherfestung Deluxe reisen** zur Festung gehen.

## Prüfung

Die Erreichbarkeit wurde an der erzeugten Blockgeometrie vom Weg vor dem Haupttor aus geprüft. Alle sechs Turmdächer, die zentralen Festungsebenen, die Wehrgänge und das höchste Dach waren zu Fuß erreichbar. Die Bewegungsprüfung mit der echten Kollisionslogik hat 768 Übergänge entlang der Aufgänge in beiden Richtungen bestanden. Bei Fokusverlust oder wenn das Spiel in den Hintergrund wechselt, setzt V33 die gehaltenen Eingaben zurück. Die Safari-Gesten sind noch auf einem echten iPhone zu prüfen.
