# BLOCKWELT V31 – Netherfestung Deluxe · Neue Spielstände

**Status: vollständiges GitHub-Austauschpaket, technisch geprüft – iPhone-WebGL-Grafik und Langzeitleistung noch nicht live abgenommen.**

## ACHTUNG – ALTE SPIELSTÄNDE WERDEN GELÖSCHT

Auf ausdrücklichen Wunsch beginnt V31 beim **ersten Start dieser Version in diesem Browser** vollständig neu. Dabei löscht der Code automatisch:

- die selbst gesetzten und abgebauten Blöcke in der **Abenteuerwelt** und auf der **Großen Wiese**,
- alte Entdeckungen und gesammelte Geheimnisse,
- die bereits absolvierten Werkstatt-Aufgaben,
- die zuvor gewählte aktive Welt. Der Neustart öffnet die **Große Wiese**.

**Einmalig, nicht bei jedem Start:** `blockwelt-v31-alte-spielstaende-geloescht` verhindert die erneute Löschung. Alle **nach V31 neu errichteten Bauwerke bleiben dauerhaft gespeichert**, soweit Safari den lokalen Speicher zulässt.

**Wichtig:** Dieser Reset wirkt nur auf Blockwelt-Spielstände **im Browser/Gerät, in dem V31 erstmals geöffnet wird**. Er löscht keine exportierten JSON-Sicherungen auf dem Gerät, keine Spielstände auf anderen Geräten und keine Daten anderer Apps. Grafikoptionen bleiben erhalten. Wenn alte Bauwerke doch noch benötigt werden, müssen sie **vor dem ersten Aufruf von V31** im alten Spiel exportiert werden. Das erneute Öffnen der alten Version stellt gelöschte lokale Daten nicht wieder her.

## Verbesserungen gegenüber V30

- **Aufgewertetes Festungstor:** gestaffelte Portalpfeiler, Lichtakzente, Wappen und markantere Bogenarchitektur.
- **Gluthof:** vier begehbar umgebbare Wachtfeuer und ein erkennbarer Weg durch den Innenhof.
- **Thron- und Reliktkammer:** erhöhte, begehbare Bühne mit einem dunklen Thron, beleuchteten Sockeln und Wandmotiven im zentralen Bergfried.
- **Erkennbare Turmsilhouetten:** Wappen, Eckfackeln und architektonische Akzente an allen sechs Türmen.
- **Verbesserte Nethertexturen:** Mauerfugen, Steinrisse und ein eigenes goldenes Flammenwappen als prozedurale Pixelmaterialien.
- **Etwas bessere Fernwirkung:** dezent später einsetzender Wiesen-Nebel bei unverändertem Chunk-Streaming.
- **V30-Inhalte weiter vorhanden:** sechs begehbare Türme, durchgehende Treppen und Wehrgänge, fliegender großer Drache, fünf Zombies und fünf Creeper. Die Gegner verursachen keinen Gebäudeschaden.

## Spielbare Welten

1. **Große Wiese:** flache Graswelt mit der großen begehbaren Netherfestung.
2. **Abenteuerwelt:** bestehende Orte, Dörfer, Tiere und vier Werkstatt-Abenteuer. Die **Generatoren und Geländehöhen** dieser Welt bleiben unverändert; die bisherigen **lokalen Spieländerungen** werden auf Wunsch zurückgesetzt.

## Installation

1. Bisherige Dateien oder GitHub-Commit bei Bedarf sichern. Bei gewünschtem vollständigem Neustart keine alten JSON-Spielstände später wieder importieren.
2. Das ZIP entpacken und `index.html`, `styles.css`, `game.js`, `README.md` im Repository `HeimHafen/Blockwelt` ersetzen.
3. Für einen geschützten Test den Branch `test/blockwelt-v31-netherfestung` wählen. Ein Testbranch ist nicht automatisch unter der normalen GitHub-Pages-Adresse live.
4. Nach dem Deployment die Seite **einmal vollständig mit V31 laden**. Die einmalige lokale Löschung erfolgt beim Start des neuen `game.js` **ohne gesonderte Rückfrage**.
5. Im Spiel **Große Wiese → Zur Netherfestung**. Haupttor, Gluthof, Bergfried, Turmtreppen und Aussichtsplattformen erkunden.
6. Bei Ruckeln `Grafik: Flüssig` wählen oder `Festungswesen` ausschalten.

## Nachvollziehbare Tests dieses Durchgangs

- `node --check` für `game.js`: bestanden.
- Aus dem echten `makeNetherPlan()` erzeugte Geometrie: **40.668 feste Festungsblockpositionen** in 38 Chunks.
- Unabhängige Raster-Wegsuche mit Sprungregel bis 1 Block: Haupttor, Innenhof, sechs Turmdächer, Bergfried-Dach, Gluthof und Thronfront erreichbar.
- HTML-IDs geprüft: 53 eindeutig; 47 JavaScript-Verweise vollständig vorhanden.
- Automatischer Reset geprüft: beide lokalen Spielstände und Fortschrittsbereiche beim ersten Start gelöscht; andere App-Daten und Grafikvorliebe erhalten; neu gespeicherte Bauwerke überleben den nächsten Start.
- Skriptdatei mit `?v=31` versioniert, um alte HTML-Script-Caches eher zu umgehen.

**Nicht geprüft:** Vollständige Laufzeit im echten Safari-WebGL auf dem iPhone, FPS, Dauerbetrieb, alle Touch-Interaktionen sowie pixelgenaue Übereinstimmung mit der KI-Konzeptgrafik. V31 ist deshalb kein nachweislich finales „1:1“-Bildniveau.
