import { FoundationPlanConfig } from './foundation-plan-config.js';
import { SvgDrawing } from './svg-drawing.js';

export class FoundationPlanRenderer {
  constructor(elements, drawing = new SvgDrawing()) {
    this.elements = elements;
    this.drawing = drawing;
  }

  render(config, layout, validationError) {
    this.renderSummary(config);
    this.renderHeader(config, layout);
    return this.renderDrawing(config, layout, validationError);
  }

  renderHeader(config, layout) {
    this.elements.pageHeaderTitle.textContent = config.model || '';
    this.elements.pageHeaderNote.textContent = layout.headerNote || '';
  }

  renderSummary(config) {
    const gaps = FoundationPlanConfig.parseGapValues(config.gaps);
    const footCount = gaps.length + 1;
    const totalY = gaps.reduce((sum, value) => sum + value, 0) + footCount * Number(config.footThicknessMm);

    this.elements.summary.innerHTML = `
      <div><strong>Modell:</strong> ${this.escapeHtml(config.model)}</div>
      <div><strong>Innenabstände:</strong> ${gaps.join(', ')} mm</div>
      <div><strong>Anzahl Füße:</strong> ${footCount}</div>
      <div><strong>Breite:</strong> ${config.widthMm} mm</div>
      <div><strong>Fußdicke:</strong> ${config.footThicknessMm} mm</div>
      <div><strong>Montagebereich:</strong> ${config.montageMm} mm</div>
      <div><strong>Gesamtmaß Y:</strong> ${totalY} mm</div>
    `;
  }

  renderDrawing(config, layout, validationError) {
    const { drawingContainer, pageBody } = this.elements;
    drawingContainer.innerHTML = '';
    if (validationError) return '';

    const geometry = FoundationPlanConfig.buildGeometry(config);
    const { gaps, widthMm, footThicknessMm, montageMm, feet, totalConstructionYmm } = geometry;

    const pageBodyWidthPx = pageBody.clientWidth;
    const pageBodyHeightPx = pageBody.clientHeight;
    const leftDimArea = 150;
    const rightDimArea = 140;
    const bottomDimArea = 85;
    const topPadding = 16;
    const mountVisibleHeight = 58;
    const bodyPaddingX = 28;
    const bodyPaddingY = 24;
    const availableWidthPx = Math.max(0, pageBodyWidthPx - bodyPaddingX * 2);
    const availableHeightPx = Math.max(0, pageBodyHeightPx - bodyPaddingY * 2);
    const maxScaleX = Math.max(0.03, (availableWidthPx - leftDimArea - rightDimArea) / widthMm);
    const maxScaleY = Math.max(0.03, (availableHeightPx - topPadding - mountVisibleHeight - bottomDimArea) / totalConstructionYmm);

    let scale = Math.min(maxScaleX, maxScaleY);
    scale *= Number(layout.zoomPercent) / 100;
    scale = Math.max(0.02, scale);

    const feetWidthPx = widthMm * scale;
    const totalConstructionYPx = totalConstructionYmm * scale;
    const svgWidth = Math.ceil(leftDimArea + feetWidthPx + rightDimArea);
    const svgHeight = Math.ceil(topPadding + mountVisibleHeight + totalConstructionYPx + bottomDimArea);

    const placement = this.getPlacement(layout, pageBodyWidthPx, pageBodyHeightPx, svgWidth, svgHeight, bodyPaddingX, bodyPaddingY);

    drawingContainer.classList.toggle('debug', !!layout.showDebugContainer);
    drawingContainer.style.width = `${svgWidth}px`;
    drawingContainer.style.height = `${svgHeight}px`;
    drawingContainer.style.left = `${placement.left}px`;
    drawingContainer.style.top = `${placement.top}px`;
    drawingContainer.style.right = '';
    drawingContainer.style.bottom = '';

    const svg = this.drawing.createElement('svg', {
      width: svgWidth,
      height: svgHeight,
      viewBox: `0 0 ${svgWidth} ${svgHeight}`
    });
    drawingContainer.appendChild(svg);

    const defs = this.drawing.createElement('defs');
    this.drawing.addMarker(defs, 'arrowDim', '#0f766e');
    this.drawing.createMontagePattern(defs);
    svg.appendChild(defs);

    if (layout.showGrid) this.drawing.grid(svg, svgWidth, svgHeight, 50, 25);

    const objectX = leftDimArea;
    const objectRightX = objectX + feetWidthPx;
    const objectCenterX = objectX + feetWidthPx / 2;
    const highestFootTopY = topPadding + mountVisibleHeight;
    const lowestFootBottomY = highestFootTopY + totalConstructionYPx;
    const footSvgTop = foot => highestFootTopY + (totalConstructionYmm - foot.yTop) * scale;
    const footSvgBottom = foot => highestFootTopY + (totalConstructionYmm - foot.yBottom) * scale;

    this.drawFeet(svg, feet, objectX, feetWidthPx, footThicknessMm, scale, footSvgTop);
    this.drawMontageArea(svg, objectX, feetWidthPx, topPadding, highestFootTopY);
    this.drawPowerConnection(svg, objectCenterX, highestFootTopY);
    this.drawDimensions(svg, {
      gaps,
      feet,
      footThicknessMm,
      montageMm,
      totalConstructionYmm,
      widthMm,
      objectX,
      objectRightX,
      highestFootTopY,
      lowestFootBottomY,
      footSvgTop,
      footSvgBottom
    });

    if (this.hasOverflow(placement, svgWidth, svgHeight, pageBodyWidthPx, pageBodyHeightPx)) {
      return 'Hinweis: Die Zeichnung überschreitet bei dieser Platzierung bzw. Skalierung den A4-Bereich.';
    }

    return '';
  }

  drawFeet(svg, feet, objectX, feetWidthPx, footThicknessMm, scale, footSvgTop) {
    const feetGroup = this.drawing.createElement('g');
    svg.appendChild(feetGroup);

    feet.forEach(foot => {
      this.drawing.rect(feetGroup, objectX, footSvgTop(foot), feetWidthPx, footThicknessMm * scale, {
        fill: '#8a5a2b',
        stroke: '#111827',
        'stroke-width': 2
      });
    });
  }

  drawMontageArea(svg, objectX, feetWidthPx, topPadding, highestFootTopY) {
    const mountGroup = this.drawing.createElement('g');
    svg.appendChild(mountGroup);

    const mountTopVisibleY = topPadding;
    const mountBottomVisibleY = highestFootTopY;
    const mountSegmentHeight = 18;

    this.drawing.rect(mountGroup, objectX, mountTopVisibleY, feetWidthPx, mountSegmentHeight, {
      fill: 'url(#montagePattern)',
      stroke: '#4b5563',
      'stroke-width': 1.6
    });

    this.drawing.rect(mountGroup, objectX, mountBottomVisibleY - mountSegmentHeight, feetWidthPx, mountSegmentHeight, {
      fill: 'url(#montagePattern)',
      stroke: '#4b5563',
      'stroke-width': 1.6
    });

    const breakY1 = mountTopVisibleY + mountSegmentHeight + 4;
    const breakY2 = mountBottomVisibleY - mountSegmentHeight - 4;

    mountGroup.appendChild(this.drawing.createElement('path', {
      d: this.drawing.buildWavePath(objectX, breakY1, feetWidthPx, 8, 10),
      fill: 'none',
      stroke: '#4b5563',
      'stroke-width': 1.7
    }));

    mountGroup.appendChild(this.drawing.createElement('path', {
      d: this.drawing.buildWavePath(objectX, breakY2, feetWidthPx, 8, 10),
      fill: 'none',
      stroke: '#4b5563',
      'stroke-width': 1.7
    }));
  }

  drawPowerConnection(svg, objectCenterX, highestFootTopY) {
    const powerGroup = this.drawing.createElement('g');
    const powerSize = 10;
    svg.appendChild(powerGroup);

    this.drawing.line(
      powerGroup,
      objectCenterX - powerSize,
      highestFootTopY - powerSize,
      objectCenterX + powerSize,
      highestFootTopY + powerSize,
      '#dc2626',
      4.2,
      { 'stroke-linecap': 'round' }
    );
    this.drawing.line(
      powerGroup,
      objectCenterX - powerSize,
      highestFootTopY + powerSize,
      objectCenterX + powerSize,
      highestFootTopY - powerSize,
      '#dc2626',
      4.2,
      { 'stroke-linecap': 'round' }
    );
  }

  drawDimensions(svg, options) {
    const {
      gaps,
      feet,
      footThicknessMm,
      montageMm,
      totalConstructionYmm,
      widthMm,
      objectX,
      objectRightX,
      highestFootTopY,
      lowestFootBottomY,
      footSvgTop,
      footSvgBottom
    } = options;

    const gapDimX = objectRightX + 24;
    const totalDimX = objectRightX + 84;

    gaps.forEach((gapValue, index) => {
      const lowerFoot = feet[index];
      const upperFoot = feet[index + 1];
      this.drawing.verticalDimension(svg, {
        x: gapDimX,
        y1: footSvgBottom(upperFoot),
        y2: footSvgTop(lowerFoot),
        label: `${gapValue} mm`,
        extensionFromX: objectRightX,
        extensionToX: gapDimX
      });
    });

    this.drawing.verticalDimension(svg, {
      x: totalDimX,
      y1: highestFootTopY,
      y2: lowestFootBottomY,
      label: `${totalConstructionYmm} mm`,
      extensionFromX: objectRightX,
      extensionToX: totalDimX
    });

    const widthDimY = lowestFootBottomY + 28;
    this.drawing.horizontalDimension(svg, {
      y: widthDimY,
      x1: objectX,
      x2: objectRightX,
      label: `${widthMm} mm`,
      extensionFromY: lowestFootBottomY,
      extensionToY: widthDimY
    });

    const mountDimX = objectX - 58;
    this.drawing.brokenVerticalDimension(svg, {
      x: mountDimX,
      yTop: 16,
      yBottom: highestFootTopY,
      label: `${Math.round(montageMm)} mm`,
      extensionFromX: objectX,
      extensionToX: mountDimX
    });

    const footDimX = objectX - 24;
    feet.forEach(foot => {
      this.drawing.verticalDimensionOutsideArrows(svg, {
        x: footDimX,
        yTop: footSvgTop(foot),
        yBottom: footSvgBottom(foot),
        label: `${footThicknessMm} mm`,
        extensionFromX: objectX,
        extensionToX: footDimX
      });
    });
  }

  getPlacement(layout, pageBodyWidthPx, pageBodyHeightPx, svgWidth, svgHeight, bodyPaddingX, bodyPaddingY) {
    const horizontalOffset = Number(layout.horizontalOffset);
    const verticalOffset = Number(layout.verticalOffset);
    const fallbackLeft = Math.max(bodyPaddingX, (pageBodyWidthPx - svgWidth) / 2);
    const fallbackTop = Math.max(bodyPaddingY, (pageBodyHeightPx - svgHeight) / 2);

    let left = fallbackLeft;
    let top = fallbackTop;

    if (Number.isFinite(horizontalOffset)) {
      left = layout.horizontalAnchor === 'right'
        ? pageBodyWidthPx - svgWidth - horizontalOffset
        : horizontalOffset;
    }

    if (Number.isFinite(verticalOffset)) {
      top = layout.verticalAnchor === 'bottom'
        ? pageBodyHeightPx - svgHeight - verticalOffset
        : verticalOffset;
    }

    return { left, top };
  }

  hasOverflow(placement, svgWidth, svgHeight, pageBodyWidthPx, pageBodyHeightPx) {
    return (
      placement.left < 0
      || placement.top < 0
      || placement.left + svgWidth > pageBodyWidthPx
      || placement.top + svgHeight > pageBodyHeightPx
    );
  }

  escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
