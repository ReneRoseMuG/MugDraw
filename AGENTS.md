# AGENTS.md - MugDraw

Diese Datei ist die maßgebliche Arbeitsanweisung für Codex in diesem Repository.
MugDraw ist aktuell eine browserfähige Vorschau für technische Fundamentplan-Zeichnungen
und soll schrittweise zu einer wiederverwendbaren Komponente für Node/React-Apps ausgebaut
werden.

Codex arbeitet ausführend, klein startend und repo-nah. Bei unklaren Anforderungen werden
keine riskanten Architektur-, Produkt- oder Scope-Entscheidungen erfunden. Wenn der Nutzer
ausdrücklich ohne Rückfragen weiterarbeiten lässt, trifft Codex konservative Annahmen und
dokumentiert sie im Abschluss.

---

## 1. Projektüberblick

Aktueller Stand:

- `preview.html` ist die Demo-Hülle mit Formular, A4-Vorschau und Moduleinstieg.
- `src/styles/mug-draw.css` enthält App-, Vorschau- und Druckstyles.
- `src/js/foundation-plan-config.js` enthält Defaults, Normalisierung, Validierung und Geometrie-Berechnung.
- `src/js/app-state-store.js` lädt und speichert den App-Zustand.
- `src/js/svg-drawing.js` enthält niedrige SVG-Zeichenprimitive und Bemaßungshelfer.
- `src/js/foundation-plan-renderer.js` rendert Kopfbereich, Zusammenfassung und SVG-Zeichnung.
- `src/js/foundation-plan-app.js` verbindet DOM-Controls, State und Renderer.
- `src/js/main.js` ist der Browser-Einstiegspunkt für die Demo.
- `scripts/dev-server.js` startet eine lokale Vorschau ohne Build-System.

Zielrichtung:

- Die technische Zeichnungslogik soll von der Demo-Oberfläche getrennt bleiben.
- Wiederverwendbare Logik gehört in klar importierbare Klassen oder pure Funktionen.
- DOM-Bindung und Browser-Demo bleiben austauschbar, damit später eine React-Komponente entstehen kann.
- SVG-Erzeugung, Geometrie, Validierung, Persistenz und UI-Controller sollen nicht wieder vermischt werden.

---

## 2. Auftragsklassifikation

Vor der Arbeit ordnet Codex den Auftrag kurz ein:

1. **Reine Frage oder Leseauftrag**
2. **Analyse-, Audit- oder Test-Report**
3. **Git-Operation ohne Codeänderung**
4. **Kleiner lokaler Fix**
5. **Mehrschichtige Änderung oder neues Feature**

Die Einordnung bestimmt Analyseumfang, Planungstiefe und Verifikation. Kleine Änderungen werden
direkt und lokal bearbeitet. Mehrschichtige Änderungen brauchen einen kurzen Plan und eine saubere
Beschreibung der betroffenen Module.

---

## 3. Analyse vor Umsetzung

Codex startet immer klein und auftragsnah:

- direkt betroffene Dateien lesen,
- bestehende Muster im betroffenen Bereich prüfen,
- vorhandene Klassen und Hilfsfunktionen wiederverwenden,
- keine neuen Strukturen anlegen, wenn bestehende sauber erweitert werden können.

Breitere Analyse ist nur nötig, wenn die lokale Analyse nicht reicht. Dann wird kurz dokumentiert,
warum der Umfang erweitert wurde.

---

## 4. Architekturregeln für MugDraw

### 4.1 Trennung der Verantwortlichkeiten

- Geometrie und fachliche Werte gehören in `FoundationPlanConfig` oder spätere fachliche Module.
- SVG-Primitive und Bemaßungshelfer gehören in `SvgDrawing`.
- Rendering der Zeichnung gehört in `FoundationPlanRenderer`.
- Browser-spezifische Events, DOM-IDs, `window`, `alert`, `confirm` und Drucklogik gehören in `FoundationPlanApp`.
- Persistenz gehört in `AppStateStore`.
- `preview.html` bleibt eine möglichst dünne Demo-Hülle.

### 4.2 React-Vorbereitung

Wenn eine Änderung Richtung React-Komponente geht:

- Kernlogik zuerst unabhängig vom DOM halten.
- React-spezifische Komponenten nicht mit `localStorage`, globalem `document` oder direkter SVG-DOM-Manipulation vermischen, wenn sich dies vermeiden lässt.
- Datenfluss bevorzugt über Props, State und Callbacks modellieren.
- Renderer-Optionen und Konfigurationsdaten typisierbar und serialisierbar halten.

### 4.3 Zeichnungslogik

- Maße werden in Millimetern geführt, sofern nicht ausdrücklich anders verlangt.
- Skalierung, Platzierung und A4-Grenzen dürfen nicht still geändert werden.
- Änderungen an Maßlinien, Montagebereich, Fußgeometrie oder Stromanschluss gelten als fachlich relevant und müssen sichtbar geprüft werden.
- SVG-Ausgabe muss im Browser nicht leer sein und darf die A4-Fläche nicht unbeabsichtigt überlaufen.

---

## 5. Frontend- und UI-Regeln

- Bestehende nüchterne technische Oberfläche respektieren.
- Keine Landingpage bauen; die nutzbare Vorschau ist der erste Screen.
- Keine dekorativen Effekte, die die technische Zeichnung überlagern.
- Texte müssen in Controls und Karten sauber passen.
- Druckdarstellung immer mitdenken, wenn die A4-Seite oder CSS geändert wird.
- Inline-Styles vermeiden; Styling gehört in `src/styles/mug-draw.css`.

---

## 6. Tests und Verifikation

Aktuell gibt es noch kein vollständiges Test- oder Build-System. Relevante lokale Checks:

- `Get-ChildItem src/js/*.js | ForEach-Object { node --check $_.FullName }`
- `node --check scripts/dev-server.js`
- `node --input-type=module -e "import('./src/js/foundation-plan-config.js').then(m => console.log(m.FoundationPlanConfig.validate(m.FoundationPlanConfig.createDefaultState().configs[0])))"`
- `node scripts/dev-server.js`
- Browser-Vorschau: `http://127.0.0.1:5174/preview.html`

Bei Änderungen an Rendering oder Layout zusätzlich prüfen:

- HTML lädt CSS und JS über den lokalen Server mit HTTP 200.
- Die SVG-Zeichnung erscheint in der A4-Vorschau.
- Formularänderungen aktualisieren Zeichnung und Zusammenfassung.
- Drucken/PDF bleibt erreichbar.
- Umlaute und Maßtexte sind nicht mojibake-kodiert.

Wenn später `package.json` und Testskripte entstehen, haben repo-eigene Skripte Vorrang vor ad-hoc-Kommandos.

---

## 7. Git-Regeln

- Vor Commits immer `git status --short --branch` prüfen.
- Keine fremden oder offensichtlich unabhängigen Änderungen stillschweigend revertieren.
- Git-Schritte seriell ausführen, besonders `add`, `commit`, `push`.
- Commit-Messages kurz und fachlich: z. B. `Refactor MugDraw preview into modules`.
- Vor Push prüfen, ob der Remote auf `https://github.com/ReneRoseMuG/MugDraw.git` zeigt.
- Wenn der Nutzer `save` oder ausdrücklich Commit/Push verlangt, offene Änderungen prüfen, relevante Checks laufen lassen, committen und pushen.

---

## 8. Wichtige Short Commands

`plan`  
Auftrag klassifizieren, betroffene Dateien lesen und einen kurzen Umsetzungsplan schreiben.

`test`  
Keine Änderungen vornehmen. Nur die verfügbaren lokalen Checks aus Abschnitt 6 ausführen und berichten.

`serve`  
Lokale Vorschau starten: `node scripts/dev-server.js`.

`save`  
Alle zum aktuellen Auftrag gehörenden Änderungen seriell prüfen, stagen, committen und pushen.

`status`  
Nur Git-Status, Branch, Remote und kurze Arbeitsbaum-Zusammenfassung ausgeben.

`component`  
Beim nächsten Umbau die Demo weiter in Richtung wiederverwendbarer React-Komponente strukturieren.

`audit`  
Struktur, Importgrenzen, Encoding, Browser-Ladefähigkeit und naheliegende Rendering-Risiken prüfen. Solange kein vollständiges Audit-Skript existiert, ist dies ein lokaler Struktur-Audit.

---

## 9. Abschlussbericht

Der Abschluss nennt knapp:

- was geändert wurde,
- welche Dateien zentral betroffen sind,
- welche Checks gelaufen sind,
- ob Commit und Push erfolgt sind,
- bekannte Risiken oder nächste sinnvolle Schritte.

Wenn etwas nicht geprüft werden konnte, wird das ausdrücklich gesagt.
