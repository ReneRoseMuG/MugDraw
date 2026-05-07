import { AppStateStore } from './app-state-store.js';
import { FoundationPlanConfig } from './foundation-plan-config.js';
import { FoundationPlanRenderer } from './foundation-plan-renderer.js';

export class FoundationPlanApp {
  constructor(root = document, store = new AppStateStore()) {
    this.root = root;
    this.store = store;
    this.state = this.store.load();
    this.elements = this.resolveElements();
    this.renderer = new FoundationPlanRenderer(this.elements);
  }

  mount() {
    this.bindEvents();
    this.updateFormFromState();
    this.renderAll();
  }

  resolveElements() {
    const byId = id => this.root.getElementById(id);

    return {
      configSelect: byId('configSelect'),
      modelInput: byId('modelInput'),
      gapsInput: byId('gapsInput'),
      widthInput: byId('widthInput'),
      footThicknessInput: byId('footThicknessInput'),
      montageInput: byId('montageInput'),
      validationMessage: byId('validationMessage'),
      summary: byId('summary'),
      horizontalAnchor: byId('horizontalAnchor'),
      verticalAnchor: byId('verticalAnchor'),
      horizontalOffset: byId('horizontalOffset'),
      verticalOffset: byId('verticalOffset'),
      zoomInput: byId('zoomInput'),
      showGridInput: byId('showGridInput'),
      showDebugContainerInput: byId('showDebugContainerInput'),
      page: byId('page'),
      pageBody: byId('pageBody'),
      pageHeaderTitle: byId('pageHeaderTitle'),
      pageHeaderNote: byId('pageHeaderNote'),
      headerNoteInput: byId('headerNoteInput'),
      drawingContainer: byId('drawingContainer'),
      newConfigBtn: byId('newConfigBtn'),
      duplicateConfigBtn: byId('duplicateConfigBtn'),
      deleteConfigBtn: byId('deleteConfigBtn'),
      printBtn: byId('printBtn'),
      resetLayoutBtn: byId('resetLayoutBtn')
    };
  }

  getCurrentConfig() {
    return this.store.getCurrentConfig(this.state);
  }

  saveState() {
    this.store.save(this.state);
  }

  renderConfigSelect() {
    const previousValue = this.state.selectedId;
    this.elements.configSelect.innerHTML = '';

    this.state.configs.forEach(config => {
      const option = document.createElement('option');
      option.value = config.id;
      option.textContent = config.model || 'Unbenannte Konfiguration';
      this.elements.configSelect.appendChild(option);
    });

    this.elements.configSelect.value = previousValue;
  }

  updateFormFromState() {
    const config = this.getCurrentConfig();
    if (!config) return;

    this.renderConfigSelect();
    this.elements.modelInput.value = config.model ?? '';
    this.elements.gapsInput.value = config.gaps ?? '';
    this.elements.widthInput.value = config.widthMm ?? '';
    this.elements.footThicknessInput.value = config.footThicknessMm ?? '';
    this.elements.montageInput.value = config.montageMm ?? '';
    this.elements.headerNoteInput.value = this.state.layout.headerNote ?? '';
    this.elements.horizontalAnchor.value = this.state.layout.horizontalAnchor;
    this.elements.verticalAnchor.value = this.state.layout.verticalAnchor;
    this.elements.horizontalOffset.value = this.state.layout.horizontalOffset;
    this.elements.verticalOffset.value = this.state.layout.verticalOffset;
    this.elements.zoomInput.value = this.state.layout.zoomPercent;
    this.elements.showGridInput.checked = !!this.state.layout.showGrid;
    this.elements.showDebugContainerInput.checked = !!this.state.layout.showDebugContainer;
  }

  updateCurrentConfigFromInputs() {
    const config = this.getCurrentConfig();
    if (!config) return;

    config.model = this.elements.modelInput.value.trim();
    config.gaps = this.elements.gapsInput.value.trim();
    config.widthMm = Number(this.elements.widthInput.value);
    config.footThicknessMm = Number(this.elements.footThicknessInput.value);
    config.montageMm = Number(this.elements.montageInput.value);

    this.saveState();
    this.renderConfigSelect();
    this.renderAll();
  }

  updateLayoutFromInputs() {
    this.state.layout.headerNote = this.elements.headerNoteInput.value.trim();
    this.state.layout.horizontalAnchor = this.elements.horizontalAnchor.value;
    this.state.layout.verticalAnchor = this.elements.verticalAnchor.value;
    this.state.layout.horizontalOffset = Number(this.elements.horizontalOffset.value);
    this.state.layout.verticalOffset = Number(this.elements.verticalOffset.value);
    this.state.layout.zoomPercent = Number(this.elements.zoomInput.value);
    this.state.layout.showGrid = this.elements.showGridInput.checked;
    this.state.layout.showDebugContainer = this.elements.showDebugContainerInput.checked;

    this.saveState();
    this.renderAll();
  }

  renderAll() {
    const config = this.getCurrentConfig();
    if (!config) return;

    const validationError = FoundationPlanConfig.validate(config);
    this.elements.validationMessage.textContent = validationError;

    const overflowWarning = this.renderer.render(config, this.state.layout, validationError);
    if (!validationError && overflowWarning) {
      this.elements.validationMessage.textContent = overflowWarning;
    }
  }

  createNewConfig() {
    const config = FoundationPlanConfig.createConfig();
    this.state.configs.push(config);
    this.state.selectedId = config.id;
    this.saveState();
    this.updateFormFromState();
    this.renderAll();
  }

  duplicateCurrentConfig() {
    const current = this.getCurrentConfig();
    if (!current) return;

    const duplicate = FoundationPlanConfig.duplicateConfig(current);
    this.state.configs.push(duplicate);
    this.state.selectedId = duplicate.id;
    this.saveState();
    this.updateFormFromState();
    this.renderAll();
  }

  deleteCurrentConfig() {
    if (this.state.configs.length <= 1) {
      alert('Mindestens eine Konfiguration muss erhalten bleiben.');
      return;
    }

    const current = this.getCurrentConfig();
    if (!current) return;

    const confirmed = confirm(`Konfiguration "${current.model}" wirklich löschen?`);
    if (!confirmed) return;

    this.state.configs = this.state.configs.filter(config => config.id !== current.id);
    this.state.selectedId = this.state.configs[0].id;
    this.saveState();
    this.updateFormFromState();
    this.renderAll();
  }

  resetLayout() {
    this.state.layout = FoundationPlanConfig.createDefaultLayout();
    this.saveState();
    this.updateFormFromState();
    this.renderAll();
  }

  bindEvents() {
    this.elements.configSelect.addEventListener('change', () => {
      this.state.selectedId = this.elements.configSelect.value;
      this.saveState();
      this.updateFormFromState();
      this.renderAll();
    });

    [
      this.elements.modelInput,
      this.elements.gapsInput,
      this.elements.widthInput,
      this.elements.footThicknessInput,
      this.elements.montageInput
    ].forEach(node => {
      node.addEventListener('input', () => this.updateCurrentConfigFromInputs());
      node.addEventListener('change', () => this.updateCurrentConfigFromInputs());
    });

    [
      this.elements.headerNoteInput,
      this.elements.horizontalAnchor,
      this.elements.verticalAnchor,
      this.elements.horizontalOffset,
      this.elements.verticalOffset,
      this.elements.zoomInput,
      this.elements.showGridInput,
      this.elements.showDebugContainerInput
    ].forEach(node => {
      node.addEventListener('input', () => this.updateLayoutFromInputs());
      node.addEventListener('change', () => this.updateLayoutFromInputs());
    });

    this.elements.newConfigBtn.addEventListener('click', () => this.createNewConfig());
    this.elements.duplicateConfigBtn.addEventListener('click', () => this.duplicateCurrentConfig());
    this.elements.deleteConfigBtn.addEventListener('click', () => this.deleteCurrentConfig());
    this.elements.resetLayoutBtn.addEventListener('click', () => this.resetLayout());
    this.elements.printBtn.addEventListener('click', () => window.print());
    window.addEventListener('resize', () => this.renderAll());
  }
}
