import { FoundationPlanConfig, STORAGE_KEY } from './foundation-plan-config.js';

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.get(key) || null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }
}

export class AppStateStore {
  constructor({ storage = globalThis.localStorage, storageKey = STORAGE_KEY } = {}) {
    this.storage = storage || new MemoryStorage();
    this.storageKey = storageKey;
  }

  load() {
    try {
      const raw = this.storage.getItem(this.storageKey);
      if (!raw) return FoundationPlanConfig.createDefaultState();

      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.configs) || parsed.configs.length === 0) {
        return FoundationPlanConfig.createDefaultState();
      }

      parsed.configs = parsed.configs.map(config => FoundationPlanConfig.normalizeConfig(config));

      if (!parsed.selectedId || !parsed.configs.some(config => config.id === parsed.selectedId)) {
        parsed.selectedId = parsed.configs[0].id;
      }

      parsed.layout = {
        ...FoundationPlanConfig.createDefaultLayout(),
        ...(parsed.layout || {})
      };

      if (parsed.layout.headerNote && parsed.layout.headerNote.includes('cm')) {
        parsed.layout.headerNote = parsed.layout.headerNote.replaceAll('cm', 'mm');
      }

      return parsed;
    } catch (error) {
      console.error('Fehler beim Laden des Status:', error);
      return FoundationPlanConfig.createDefaultState();
    }
  }

  save(state) {
    this.storage.setItem(this.storageKey, JSON.stringify(state));
  }

  getCurrentConfig(state) {
    return state.configs.find(config => config.id === state.selectedId) || null;
  }
}
