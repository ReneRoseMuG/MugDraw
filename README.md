# MugDraw

MugDraw ist die ausgelagerte Basis für technische Fundamentplan-Zeichnungen.
Die aktuelle Vorschau läuft ohne Build-System direkt im Browser und ist so
strukturiert, dass die Kernklassen später in eine React-App übernommen werden
können.

## Lokale Vorschau

```bash
node scripts/dev-server.js
```

Danach ist die Vorschau unter `http://127.0.0.1:5174/preview.html` erreichbar.

## Struktur

- `preview.html`: Demo-Hülle mit Formular und A4-Vorschau.
- `src/styles/mug-draw.css`: ausgelagerte Styles für App, Vorschau und Druck.
- `src/js/foundation-plan-config.js`: Defaults, Normalisierung, Validierung und Geometrie-Berechnung.
- `src/js/app-state-store.js`: Laden/Speichern des Zustands.
- `src/js/svg-drawing.js`: niedrige SVG-Zeichenprimitive und Bemaßungshelfer.
- `src/js/foundation-plan-renderer.js`: rendert Kopfbereich, Zusammenfassung und SVG-Zeichnung.
- `src/js/foundation-plan-app.js`: verbindet DOM-Controls, State und Renderer.
- `src/js/main.js`: Browser-Einstiegspunkt für die Demo.
