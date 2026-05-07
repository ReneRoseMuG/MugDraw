const SVG_NS = 'http://www.w3.org/2000/svg';

export class SvgDrawing {
  createElement(tag, attrs = {}) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => {
      node.setAttribute(key, String(value));
    });
    return node;
  }

  addMarker(defs, id, fill) {
    const marker = this.createElement('marker', {
      id,
      markerWidth: 8,
      markerHeight: 8,
      refX: 4,
      refY: 4,
      orient: 'auto-start-reverse',
      markerUnits: 'strokeWidth'
    });
    marker.appendChild(this.createElement('path', { d: 'M 0 0 L 8 4 L 0 8 z', fill }));
    defs.appendChild(marker);
  }

  createMontagePattern(defs) {
    const pattern = this.createElement('pattern', {
      id: 'montagePattern',
      patternUnits: 'userSpaceOnUse',
      width: 8,
      height: 8,
      patternTransform: 'rotate(45)'
    });

    pattern.appendChild(this.createElement('rect', {
      x: 0,
      y: 0,
      width: 8,
      height: 8,
      fill: '#ffffff'
    }));

    pattern.appendChild(this.createElement('rect', {
      x: 4,
      y: 0,
      width: 4,
      height: 8,
      fill: '#4b5563'
    }));

    defs.appendChild(pattern);
    return pattern;
  }

  line(parent, x1, y1, x2, y2, stroke = '#111827', width = 1.5, extra = {}) {
    const line = this.createElement('line', { x1, y1, x2, y2, stroke, 'stroke-width': width, ...extra });
    parent.appendChild(line);
    return line;
  }

  text(parent, x, y, textContent, attrs = {}) {
    const text = this.createElement('text', {
      x,
      y,
      fill: '#111827',
      'font-size': 13,
      'font-family': 'Arial, Helvetica, sans-serif',
      ...attrs
    });
    text.textContent = textContent;
    parent.appendChild(text);
    return text;
  }

  rect(parent, x, y, width, height, attrs = {}) {
    const rect = this.createElement('rect', { x, y, width, height, ...attrs });
    parent.appendChild(rect);
    return rect;
  }

  grid(parent, width, height, majorStep = 50, minorStep = 25) {
    for (let x = 0; x <= width; x += minorStep) {
      this.line(parent, x, 0, x, height, '#e5e7eb', x % majorStep === 0 ? 1 : 0.7);
    }
    for (let y = 0; y <= height; y += minorStep) {
      this.line(parent, 0, y, width, y, '#e5e7eb', y % majorStep === 0 ? 1 : 0.7);
    }
  }

  verticalDimension(parent, options) {
    const {
      x,
      y1,
      y2,
      label,
      extensionFromX = null,
      extensionToX = x,
      textOffsetX = 10,
      color = '#0f766e',
      arrowInset = 7
    } = options;

    const topY = Math.min(y1, y2);
    const bottomY = Math.max(y1, y2);

    if (extensionFromX !== null) {
      this.line(parent, extensionFromX, topY, extensionToX, topY, color, 1.2);
      this.line(parent, extensionFromX, bottomY, extensionToX, bottomY, color, 1.2);
    }

    const usableTop = topY + arrowInset;
    const usableBottom = bottomY - arrowInset;

    if (usableBottom > usableTop) {
      this.line(parent, x, usableTop, x, usableBottom, color, 1.7, {
        'marker-start': 'url(#arrowDim)',
        'marker-end': 'url(#arrowDim)'
      });
    } else {
      this.line(parent, x, topY, x, bottomY, color, 1.7, {
        'marker-start': 'url(#arrowDim)',
        'marker-end': 'url(#arrowDim)'
      });
    }

    this.text(parent, x + textOffsetX, (topY + bottomY) / 2 + 4, label, {
      fill: color,
      'font-size': 13,
      'font-weight': 700
    });
  }

  horizontalDimension(parent, options) {
    const {
      y,
      x1,
      x2,
      label,
      extensionFromY = null,
      extensionToY = y,
      textOffsetY = 18,
      color = '#0f766e',
      arrowInset = 7
    } = options;

    const leftX = Math.min(x1, x2);
    const rightX = Math.max(x1, x2);

    if (extensionFromY !== null) {
      this.line(parent, leftX, extensionFromY, leftX, extensionToY, color, 1.2);
      this.line(parent, rightX, extensionFromY, rightX, extensionToY, color, 1.2);
    }

    const usableLeft = leftX + arrowInset;
    const usableRight = rightX - arrowInset;

    if (usableRight > usableLeft) {
      this.line(parent, usableLeft, y, usableRight, y, color, 1.7, {
        'marker-start': 'url(#arrowDim)',
        'marker-end': 'url(#arrowDim)'
      });
    } else {
      this.line(parent, leftX, y, rightX, y, color, 1.7, {
        'marker-start': 'url(#arrowDim)',
        'marker-end': 'url(#arrowDim)'
      });
    }

    this.text(parent, (leftX + rightX) / 2, y + textOffsetY, label, {
      fill: color,
      'font-size': 13,
      'font-weight': 700,
      'text-anchor': 'middle'
    });
  }

  verticalDimensionOutsideArrows(parent, options) {
    const {
      x,
      yTop,
      yBottom,
      label,
      extensionFromX,
      extensionToX = x,
      outwardSize = 12,
      color = '#0f766e',
      labelOffsetX = -8
    } = options;

    this.line(parent, extensionFromX, yTop, extensionToX, yTop, color, 1.2);
    this.line(parent, extensionFromX, yBottom, extensionToX, yBottom, color, 1.2);

    this.line(parent, x, yTop - outwardSize, x, yTop, color, 1.7, {
      'marker-end': 'url(#arrowDim)'
    });

    this.line(parent, x, yBottom + outwardSize, x, yBottom, color, 1.7, {
      'marker-end': 'url(#arrowDim)'
    });

    this.text(parent, x + labelOffsetX, (yTop + yBottom) / 2 + 4, label, {
      fill: color,
      'font-size': 12,
      'font-weight': 700,
      'text-anchor': 'end'
    });
  }

  brokenVerticalDimension(parent, options) {
    const {
      x,
      yTop,
      yBottom,
      label,
      extensionFromX,
      extensionToX = x,
      color = '#0f766e',
      arrowInset = 7
    } = options;

    this.line(parent, extensionFromX, yTop, extensionToX, yTop, color, 1.2);
    this.line(parent, extensionFromX, yBottom, extensionToX, yBottom, color, 1.2);

    const mid = (yTop + yBottom) / 2;
    const gap = 16;
    const upperLineEnd = Math.max(yTop + arrowInset, mid - gap);
    const lowerLineStart = Math.min(yBottom - arrowInset, mid + gap);

    this.line(parent, x, yTop + arrowInset, x, upperLineEnd, color, 1.7, {
      'marker-start': 'url(#arrowDim)'
    });
    this.line(parent, x, lowerLineStart, x, yBottom - arrowInset, color, 1.7, {
      'marker-end': 'url(#arrowDim)'
    });

    parent.appendChild(this.createElement('path', {
      d: `M ${x - 6} ${mid - 8} L ${x + 6} ${mid - 2} L ${x - 6} ${mid + 4} L ${x + 6} ${mid + 10}`,
      fill: 'none',
      stroke: color,
      'stroke-width': 1.7
    }));

    this.text(parent, x - 8, mid + 4, label, {
      fill: color,
      'font-size': 12,
      'font-weight': 700,
      'text-anchor': 'end'
    });
  }

  buildWavePath(xStart, y, width, amplitude, wavelength) {
    let d = `M ${xStart} ${y}`;
    let currentX = xStart;
    let up = true;

    while (currentX < xStart + width) {
      const nextX = Math.min(currentX + wavelength, xStart + width);
      const midX = currentX + (nextX - currentX) / 2;
      const controlY = up ? y - amplitude : y + amplitude;
      d += ` Q ${midX} ${controlY} ${nextX} ${y}`;
      currentX = nextX;
      up = !up;
    }

    return d;
  }
}
