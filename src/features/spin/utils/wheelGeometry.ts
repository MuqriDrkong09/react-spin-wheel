import {
  FULL_TURN,
  WHEEL_CENTER_BUTTON_RATIO,
  WHEEL_INNER_RADIUS,
  WHEEL_LABEL_CHAR_WIDTH_RATIO,
  WHEEL_LABEL_FONT_RATIO,
  WHEEL_LABEL_LINE_HEIGHT_RATIO,
  WHEEL_LABEL_MIN_FONT_RATIO,
  WHEEL_LABEL_MIN_SWEEP,
  WHEEL_LABEL_PADDING,
  WHEEL_LABEL_RADIUS_RATIO,
  WHEEL_POINTER,
  WHEEL_RADIUS,
  WHEEL_TANGENT_MIN_SWEEP,
  WHEEL_VIEWBOX_SIZE,
} from '@/features/spin/constants';
import { calculateSegmentAngles } from '@/features/spin/engine/spinEngine';
import type { HexColor, WheelAppearance, WheelItem } from '@/types/wheel';

export { FULL_TURN, POINTER_ANGLE } from '@/features/spin/constants';
export { activeWheelItems, isActiveWheelSegment } from '@/features/spin/engine/spinEngine';

export type WheelLabelOrientation = 'radial' | 'tangent';

export interface WheelLabelLine {
  text: string;
  y: number;
}

export interface WheelSegmentGeometry {
  id: string;
  name: string;
  color: HexColor;
  icon?: string;
  labelText: string;
  labelLines: WheelLabelLine[];
  labelFontSize: number;
  labelOrientation: WheelLabelOrientation;
  clipPathId: string;
  showLabel: boolean;
  path: string;
  labelX: number;
  labelY: number;
  labelRotation: number;
  labelFill: HexColor;
  startAngle: number;
  endAngle: number;
  sweepAngle: number;
  isFullCircle: boolean;
}

export interface WheelGeometry {
  size: number;
  center: number;
  radius: number;
  innerRadius: number;
  hub: {
    cx: number;
    cy: number;
    r: number;
  };
  pointer: {
    points: string;
  };
  centerButtonPercent: number;
  labelFontSize: number;
  segments: WheelSegmentGeometry[];
}

export interface WheelGeometryOptions {
  appearance?: Pick<WheelAppearance, 'segmentColors' | 'textColor' | 'fontSize'>;
}

export function buildWheelGeometry(
  items: readonly WheelItem[],
  size = WHEEL_VIEWBOX_SIZE,
  options: WheelGeometryOptions = {},
): WheelGeometry {
  const center = size / 2;
  const radius = scale(WHEEL_RADIUS, size);
  const innerRadius = scale(WHEEL_INNER_RADIUS, size);
  const fontScale = (options.appearance?.fontSize ?? 14) / 14;
  const baseFontSize = round(size * WHEEL_LABEL_FONT_RATIO * fontScale);
  const minFontSize = round(size * WHEEL_LABEL_MIN_FONT_RATIO * fontScale);
  const padding = scale(WHEEL_LABEL_PADDING, size);
  const segments: WheelSegmentGeometry[] = [];

  for (const angleSegment of calculateSegmentAngles(items)) {
    const { item, startAngle, endAngle, sweepAngle, midAngle } = angleSegment;
    const isFullCircle = sweepAngle >= FULL_TURN - 1e-6;
    const labelRadius = radius * WHEEL_LABEL_RADIUS_RATIO;
    const labelPoint = polar(center, labelRadius, midAngle);
    const labelOrientation = labelOrientationForSweep(sweepAngle, isFullCircle);
    const labelText = segmentLabel(item);
    const showLabel = isFullCircle || sweepAngle >= WHEEL_LABEL_MIN_SWEEP;
    const { maxWidth, maxHeight } = labelBox(
      sweepAngle,
      isFullCircle,
      radius,
      innerRadius,
      labelRadius,
      padding,
      labelOrientation,
    );
    const fitted = showLabel
      ? fitWheelLabel(labelText, maxWidth, maxHeight, baseFontSize, minFontSize)
      : { lines: [] as string[], fontSize: baseFontSize };
    const color = segmentFill(item.color, segments.length, options.appearance?.segmentColors);
    const labelFill = options.appearance?.textColor ?? labelFillForColor(color);

    segments.push({
      id: item.id,
      name: item.name,
      color,
      icon: item.icon,
      labelText,
      labelLines: toLabelLines(fitted.lines, fitted.fontSize),
      labelFontSize: fitted.fontSize,
      labelOrientation,
      clipPathId: `spin-wheel-clip-${item.id.replace(/[^a-zA-Z0-9_-]/g, '')}`,
      showLabel: showLabel && fitted.lines.length > 0,
      path: donutSlicePath(center, innerRadius, radius, startAngle, endAngle),
      labelX: round(labelPoint.x),
      labelY: round(labelPoint.y),
      labelRotation: round(labelRotation(midAngle, labelOrientation)),
      labelFill,
      startAngle,
      endAngle,
      sweepAngle,
      isFullCircle,
    });
  }

  return {
    size,
    center,
    radius,
    innerRadius,
    hub: {
      cx: center,
      cy: center,
      r: innerRadius,
    },
    pointer: {
      points: pointerPoints(center, size),
    },
    centerButtonPercent: round(((innerRadius * 2 * WHEEL_CENTER_BUTTON_RATIO) / size) * 100),
    labelFontSize: baseFontSize,
    segments,
  };
}

function labelOrientationForSweep(
  sweepAngle: number,
  isFullCircle: boolean,
): WheelLabelOrientation {
  if (isFullCircle || sweepAngle >= WHEEL_TANGENT_MIN_SWEEP) {
    return 'tangent';
  }

  return 'radial';
}

function labelBox(
  sweepAngle: number,
  isFullCircle: boolean,
  radius: number,
  innerRadius: number,
  labelRadius: number,
  padding: number,
  orientation: WheelLabelOrientation,
): { maxWidth: number; maxHeight: number } {
  const ringSpan = Math.max(0, radius - innerRadius - padding * 2);
  const chordSpan = isFullCircle
    ? radius
    : Math.max(0, 2 * labelRadius * Math.sin(sweepAngle / 2) - padding * 2);

  if (orientation === 'radial') {
    return { maxWidth: ringSpan, maxHeight: chordSpan };
  }

  return { maxWidth: chordSpan, maxHeight: ringSpan };
}

function fitWheelLabel(
  text: string,
  maxWidth: number,
  maxHeight: number,
  baseFontSize: number,
  minFontSize: number,
): { lines: string[]; fontSize: number } {
  if (maxWidth <= 0 || maxHeight <= 0 || text.length === 0) {
    return { lines: [], fontSize: minFontSize };
  }

  for (let fontSize = baseFontSize; fontSize >= minFontSize; fontSize = round(fontSize - 0.4)) {
    const maxLines = lineCapacity(maxHeight, fontSize);
    const lines = layoutLines(text, fontSize, maxWidth, maxLines, false);
    if (lines) {
      return { lines, fontSize };
    }
  }

  const fontSize = minFontSize;
  const maxLines = lineCapacity(maxHeight, fontSize);
  return {
    lines: layoutLines(text, fontSize, maxWidth, maxLines, true) ?? [],
    fontSize,
  };
}

function lineCapacity(maxHeight: number, fontSize: number): number {
  const lineHeight = fontSize * WHEEL_LABEL_LINE_HEIGHT_RATIO;
  return Math.min(2, Math.max(1, Math.floor((maxHeight + lineHeight * 0.15) / lineHeight)));
}

function layoutLines(
  text: string,
  fontSize: number,
  maxWidth: number,
  maxLines: number,
  allowTruncate: boolean,
): string[] | undefined {
  const tokens = tokenize(text);
  if (tokens.length === 0) {
    return [];
  }

  const lines: string[] = [];
  let index = 0;

  while (index < tokens.length && lines.length < maxLines) {
    const isLastLine = lines.length === maxLines - 1;
    let line = '';

    while (index < tokens.length) {
      const next = line ? `${line} ${tokens[index]}` : tokens[index]!;
      if (estimateTextWidth(next, fontSize) <= maxWidth) {
        line = next;
        index += 1;
        continue;
      }
      break;
    }

    if (!line) {
      const token = tokens[index]!;
      if (!allowTruncate && estimateTextWidth(token, fontSize) > maxWidth) {
        return undefined;
      }
      line = truncateToWidth(token, fontSize, maxWidth);
      index += 1;
    } else if (isLastLine && index < tokens.length) {
      if (!allowTruncate) {
        return undefined;
      }
      line = truncateToWidth(`${line} ${tokens[index]}`, fontSize, maxWidth);
      index = tokens.length;
    }

    if (line) {
      lines.push(line);
    }
  }

  if (index < tokens.length) {
    return undefined;
  }

  return lines;
}

function tokenize(text: string): string[] {
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && !/[A-Za-z0-9]/.test(parts[0] ?? '')) {
    return [`${parts[0]} ${parts[1]}`, ...parts.slice(2)];
  }

  return parts;
}

function truncateToWidth(text: string, fontSize: number, maxWidth: number): string {
  if (estimateTextWidth(text, fontSize) <= maxWidth) {
    return text;
  }

  const ellipsis = '…';
  if (estimateTextWidth(ellipsis, fontSize) > maxWidth) {
    return '';
  }

  let next = text;
  while (next.length > 0 && estimateTextWidth(`${next}${ellipsis}`, fontSize) > maxWidth) {
    next = [...next].slice(0, -1).join('');
  }

  return next ? `${next}${ellipsis}` : ellipsis;
}

function estimateTextWidth(text: string, fontSize: number): number {
  let units = 0;
  for (const char of text) {
    if (char === ' ') {
      units += 0.32;
    } else if (char > '~') {
      units += 1;
    } else {
      units += WHEEL_LABEL_CHAR_WIDTH_RATIO;
    }
  }

  return units * fontSize;
}

function toLabelLines(lines: string[], fontSize: number): WheelLabelLine[] {
  const lineHeight = fontSize * WHEEL_LABEL_LINE_HEIGHT_RATIO;
  const origin = -((lines.length - 1) * lineHeight) / 2;

  return lines.map((text, index) => ({
    text,
    y: round(origin + index * lineHeight),
  }));
}

function scale(value: number, size: number): number {
  return (value / WHEEL_VIEWBOX_SIZE) * size;
}

function polar(center: number, radius: number, angle: number): { x: number; y: number } {
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  };
}

function donutSlicePath(
  center: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const sweep = endAngle - startAngle;
  if (sweep >= FULL_TURN - 1e-6) {
    return fullDonutPath(center, innerRadius, outerRadius);
  }

  const outerStart = polar(center, outerRadius, startAngle);
  const outerEnd = polar(center, outerRadius, endAngle);
  const innerStart = polar(center, innerRadius, startAngle);
  const innerEnd = polar(center, innerRadius, endAngle);
  const largeArc = sweep > Math.PI ? 1 : 0;

  return [
    `M ${round(outerStart.x)} ${round(outerStart.y)}`,
    `A ${round(outerRadius)} ${round(outerRadius)} 0 ${largeArc} 1 ${round(outerEnd.x)} ${round(outerEnd.y)}`,
    `L ${round(innerEnd.x)} ${round(innerEnd.y)}`,
    `A ${round(innerRadius)} ${round(innerRadius)} 0 ${largeArc} 0 ${round(innerStart.x)} ${round(innerStart.y)}`,
    'Z',
  ].join(' ');
}

function fullDonutPath(center: number, innerRadius: number, outerRadius: number): string {
  const outerTop = round(center - outerRadius);
  const outerBottom = round(center + outerRadius);
  const innerTop = round(center - innerRadius);
  const innerBottom = round(center + innerRadius);
  const cx = round(center);
  const outer = round(outerRadius);
  const inner = round(innerRadius);

  return [
    `M ${cx} ${outerTop}`,
    `A ${outer} ${outer} 0 1 1 ${cx} ${outerBottom}`,
    `A ${outer} ${outer} 0 1 1 ${cx} ${outerTop}`,
    `M ${cx} ${innerTop}`,
    `A ${inner} ${inner} 0 1 0 ${cx} ${innerBottom}`,
    `A ${inner} ${inner} 0 1 0 ${cx} ${innerTop}`,
    'Z',
  ].join(' ');
}

function pointerPoints(center: number, size: number): string {
  const tipY = scale(WHEEL_POINTER.tipY, size);
  const baseY = scale(WHEEL_POINTER.baseY, size);
  const half = scale(WHEEL_POINTER.halfWidth, size);

  return `${round(center)},${round(tipY)} ${round(center - half)},${round(baseY)} ${round(center + half)},${round(baseY)}`;
}

function segmentLabel(item: WheelItem): string {
  return item.icon ? `${item.icon} ${item.name}` : item.name;
}

function labelRotation(midAngle: number, orientation: WheelLabelOrientation): number {
  let degrees = (midAngle * 180) / Math.PI;
  if (orientation === 'tangent') {
    degrees += 90;
  }
  degrees = ((degrees % 360) + 360) % 360;
  if (degrees > 90 && degrees < 270) {
    degrees += 180;
  }

  return ((degrees % 360) + 360) % 360;
}

function segmentFill(
  fallback: HexColor,
  index: number,
  palette: readonly HexColor[] | undefined,
): HexColor {
  if (!palette || palette.length === 0) {
    return fallback;
  }

  return palette[index % palette.length] ?? fallback;
}

function labelFillForColor(color: string): HexColor {
  const rgb = parseHex(color);
  if (!rgb) {
    return '#ffffff';
  }

  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return yiq >= 148 ? '#0f172a' : '#ffffff';
}

function parseHex(color: string): { r: number; g: number; b: number } | undefined {
  const hex = color.startsWith('#') ? color.slice(1) : color;
  const normalized =
    hex.length === 3
      ? hex
          .split('')
          .map((part) => `${part}${part}`)
          .join('')
      : hex;

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return undefined;
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
