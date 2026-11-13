# Blockwelt V37 – Drachenwächter

Die Schulterkamera ist standardmäßig aktiv. Unter **☰ → Welt & Grafik → Kamera** kannst du auf Ich-Sicht wechseln. In engen Gängen rückt die Kamera vor Hindernisse. Falls der Browserzoom trotzdem einsetzt, erscheint **Normalansicht laden**. Das Neuladen setzt die Spielfigur an den Startpunkt zurück.

Zwei steinerne Drachenwächter flankieren den Gluthof. Im oberen Bergfried führen gestufte Fensterbuchten an die Aussicht, und auf dem höchsten Dach wartet ein leuchtender Schrein. Der Weg dorthin führt über die bestehende Treppe.

V35 baut auf V34 auf. Die Festung hat reliefierte Turmecken, gestaffelte Dachkanten und anders geschnittene Bodenplatten. Gluthof, Hallen und Terrassen erhalten Steinläufer und Einlegearbeiten. Auf der Großen Wiese führen Pflaster und Wegränder zum Tor. Abseits der zentralen Baufläche stehen Baumgruppen, blühende Sträucher und Felsen. Die Fernansicht zeichnet die Silhouette und ihre Materialien mit eigenen Farben. Zombies und Creeper erhalten Pixeltexturen. Die Wolken liegen höher.

Alle sechs Außentürme haben durchgehende Wendeltreppen mit Dachausstieg. Vom Innenhof führen Aufgänge zu den Wehrgängen, den Etagen des Bergfrieds und bis zum höchsten Dach. Die Treppen lassen sich in beide Richtungen ohne Springen benutzen. Beide äußeren Wachtürme sind zusätzlich direkt von der Wiese aus erreichbar. Goldene Ecksteine und Wandlichter markieren die Wendeltreppen. Die Ortsanzeige benennt Gluthof, Thronhalle, Wehrgang und die Ebenen des Bergfrieds.

Das Spiel fängt die Safari-Zoomgesten ab. Die Inventarleiste lässt sich weiterhin seitlich wischen und das Menü vertikal scrollen. Sollte Safari bereits vergrößert sein, öffne **☰ → Welt & Grafik → Ansicht neu laden**. Das startet die Seite mit einer frischen Ansicht und setzt die Spielfigur an die Startposition.

V35 löscht beim Update keine lokalen Spielstände. Bereits gesetzte oder abgebaute Blöcke bleiben wirksam, auch innerhalb der Festung. Selbst gesetzte Hindernisse auf Treppen können im Spiel abgebaut werden.

## Installation

1. Den bisherigen Stand in GitHub oder Working Copy sichern.
2. Das ZIP entpacken. Im bestehenden Blockwelt-Repository `index.html`, `styles.css`, `game.js` und `README.md` durch die neuen Dateien ersetzen.
3. Committen und auf den GitHub-Pages-Branch pushen. Nach dem Deployment die Seite neu laden. Oben steht dann **V37 – Drachenwächter**.
4. Über **☰ → Welten auswählen → Große Wiese → Zur Netherfestung Deluxe reisen** zur Festung gehen.

## Prüfung

Die Erreichbarkeit wurde an der erzeugten Blockgeometrie vom Weg vor dem Haupttor aus geprüft. Alle sechs Turmdächer, die zentralen Festungsebenen, die Wehrgänge und das höchste Dach waren zu Fuß erreichbar. Die Bewegungsprüfung mit der echten Kollisionslogik hat 768 Übergänge entlang der Aufgänge in beiden Richtungen bestanden. Bei Fokusverlust oder wenn das Spiel in den Hintergrund wechselt, setzt V35 die gehaltenen Eingaben zurück. Die Safari-Gesten sind noch auf einem echten iPhone zu prüfen.
