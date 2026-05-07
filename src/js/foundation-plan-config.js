export const STORAGE_KEY = 'sauna-fundament-planer-state-v3';

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `config-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function clone(value) {
  if (globalThis.structuredClone) return globalThis.structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export class FoundationPlanConfig {
  static createDefaultState() {
    const configs = [
      this.createConfig({
        model: 'Palkkio Beispiel',
        gaps: '960,1000,960',
        widthMm: 2000,
        footThicknessMm: 80,
        montageMm: 700
      }),
      this.createConfig({
        model: 'Premium Beispiel',
        gaps: '900,900,900,900',
        widthMm: 2200,
        footThicknessMm: 80,
        montageMm: 750
      })
    ];

    return {
      selectedId: configs[0].id,
      configs,
      layout: this.createDefaultLayout()
    };
  }

  static createDefaultLayout() {
    return {
      headerNote: 'Alle Maße in mm. Angaben vor Fundamenterstellung vor Ort prüfen.',
      horizontalAnchor: 'left',
      verticalAnchor: 'top',
      horizontalOffset: 70,
      verticalOffset: 80,
      zoomPercent: 100,
      showGrid: false,
      showDebugContainer: false
    };
  }

  static createConfig(overrides = {}) {
    return {
      id: createId(),
      model: 'Neue Sauna',
      gaps: '960,1000,960',
      widthMm: 2000,
      footThicknessMm: 80,
      montageMm: 700,
      ...overrides
    };
  }

  static duplicateConfig(config) {
    return {
      ...clone(config),
      id: createId(),
      model: `${config.model} Kopie`
    };
  }

  static normalizeConfig(config) {
    const normalized = { ...config };

    if (normalized.widthMm == null && normalized.widthCm != null) {
      normalized.widthMm = Number(normalized.widthCm) * 10;
    }
    if (normalized.footThicknessMm == null && normalized.footThicknessCm != null) {
      normalized.footThicknessMm = Number(normalized.footThicknessCm) * 10;
    }
    if (normalized.montageMm == null && normalized.montageCm != null) {
      normalized.montageMm = Number(normalized.montageCm) * 10;
    }

    delete normalized.widthCm;
    delete normalized.footThicknessCm;
    delete normalized.montageCm;

    if (typeof normalized.gaps === 'string' && normalized.gaps.includes(',')) {
      const values = normalized.gaps
        .split(',')
        .map(value => value.trim())
        .filter(value => value !== '');

      const looksLikeLegacyCm = values.every(value => /^\d+(\.\d+)?$/.test(value) && Number(value) < 300);
      if (looksLikeLegacyCm) {
        normalized.gaps = values.map(value => String(Math.round(Number(value) * 10))).join(',');
      }
    }

    return normalized;
  }

  static parseGapValues(gapText) {
    return String(gapText || '')
      .split(',')
      .map(value => value.trim())
      .filter(value => value !== '')
      .map(value => Number(value))
      .filter(value => Number.isFinite(value) && value >= 0);
  }

  static validate(config) {
    const gaps = this.parseGapValues(config.gaps);

    if (!config.model || !String(config.model).trim()) return 'Bitte ein Sauna-Modell angeben.';
    if (gaps.length < 1) return 'Bitte mindestens einen Innenabstand eingeben.';
    if (!Number.isFinite(Number(config.widthMm)) || Number(config.widthMm) <= 0) return 'Die Breite muss größer als 0 sein.';
    if (!Number.isFinite(Number(config.footThicknessMm)) || Number(config.footThicknessMm) <= 0) return 'Die Fußmaterial-Dicke muss größer als 0 sein.';
    if (!Number.isFinite(Number(config.montageMm)) || Number(config.montageMm) <= 0) return 'Der Montagebereich muss größer als 0 sein.';

    return '';
  }

  static buildGeometry(config) {
    const gaps = this.parseGapValues(config.gaps);
    const footCount = gaps.length + 1;
    const widthMm = Number(config.widthMm);
    const footThicknessMm = Number(config.footThicknessMm);
    const montageMm = Number(config.montageMm);
    const feet = [];
    let currentBottom = 0;

    for (let index = 0; index < footCount; index += 1) {
      const yBottom = currentBottom;
      const yTop = yBottom + footThicknessMm;
      feet.push({ index, yBottom, yTop });
      if (index < gaps.length) currentBottom = yTop + gaps[index];
    }

    return {
      gaps,
      footCount,
      widthMm,
      footThicknessMm,
      montageMm,
      feet,
      totalConstructionYmm: feet[feet.length - 1].yTop
    };
  }
}
