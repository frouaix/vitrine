// Copyright (c) 2026 François Rouaix

// GUI Color Picker transform

import { circle, group, rectangle, text } from 'vitrine';
import type { Block, VitrinePointerEvent } from 'vitrine';
import type {
  ControlStyle,
  GUIControlOfType,
  TransformContext
} from '../types.ts';
import { GUIControlType } from '../types.ts';
import type { ColorPickerProps, ColorPickerChange } from './propsColorPicker.ts';
import type { ColorPickerDragState } from './stateColorPicker.ts';
import { COLORPICKER_DEFAULTS } from './defaultsColorPicker.ts';

const DEFAULTS = COLORPICKER_DEFAULTS;

// Re-export for backward compatibility
export { COLORPICKER_DEFAULTS as DEFAULTS } from './defaultsColorPicker.ts';

function clamp(unValue: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, unValue));
}

function getColorPickerStyle(
  control: GUIControlOfType<GUIControlType.ColorPicker>,
  context: TransformContext
): ControlStyle {
  const { theme } = context;
  const { className } = control.props;

  if (className && theme.styles[className]) {
    return { ...(theme.defaults[control.type] || {}), ...theme.styles[className] };
  }

  return theme.defaults[control.type] || {};
}

function normalizeHue(unHue: number): number {
  const wrapped = unHue % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

function hsvToRgbTuple(hue: number, saturation: number, value: number): { red: number; green: number; blue: number } {
  const normalizedHue = normalizeHue(hue);
  const normalizedSaturation = clamp(saturation, 0, 100) / 100;
  const normalizedValue = clamp(value, 0, 100) / 100;
  const chroma = normalizedValue * normalizedSaturation;
  const secondary = chroma * (1 - Math.abs(((normalizedHue / 60) % 2) - 1));
  const offset = normalizedValue - chroma;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (normalizedHue < 60) {
    red = chroma;
    green = secondary;
  } else if (normalizedHue < 120) {
    red = secondary;
    green = chroma;
  } else if (normalizedHue < 180) {
    green = chroma;
    blue = secondary;
  } else if (normalizedHue < 240) {
    green = secondary;
    blue = chroma;
  } else if (normalizedHue < 300) {
    red = secondary;
    blue = chroma;
  } else {
    red = chroma;
    blue = secondary;
  }

  return {
    red: Math.round((red + offset) * 255),
    green: Math.round((green + offset) * 255),
    blue: Math.round((blue + offset) * 255)
  };
}

function hsvToRgbString(hue: number, saturation: number, value: number): string {
  const { red, green, blue } = hsvToRgbTuple(hue, saturation, value);
  return `rgb(${red}, ${green}, ${blue})`;
}

function hsvToHexString(hue: number, saturation: number, value: number): string {
  const { red, green, blue } = hsvToRgbTuple(hue, saturation, value);
  const toHex = (channel: number): string => channel.toString(16).padStart(2, '0');
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function hexToHsv(stHex: string): { hue: number; saturation: number; value: number } {
  const normalizedHex = stHex.replace('#', '');
  const fullHex = normalizedHex.length === 3
    ? normalizedHex.split('').map((char) => char + char).join('')
    : normalizedHex;

  if (!/^[0-9a-fA-F]{6}$/.test(fullHex)) {
    return { hue: 0, saturation: 0, value: 0 };
  }

  const red = parseInt(fullHex.slice(0, 2), 16) / 255;
  const green = parseInt(fullHex.slice(2, 4), 16) / 255;
  const blue = parseInt(fullHex.slice(4, 6), 16) / 255;

  const maxChannel = Math.max(red, green, blue);
  const minChannel = Math.min(red, green, blue);
  const delta = maxChannel - minChannel;

  let hue = 0;
  if (delta !== 0) {
    if (maxChannel === red) {
      hue = 60 * (((green - blue) / delta) % 6);
    } else if (maxChannel === green) {
      hue = 60 * (((blue - red) / delta) + 2);
    } else {
      hue = 60 * (((red - green) / delta) + 4);
    }
  }

  if (hue < 0) {
    hue += 360;
  }

  const saturation = maxChannel === 0 ? 0 : (delta / maxChannel) * 100;
  const value = maxChannel * 100;

  return {
    hue: Math.min(359, Math.max(0, Math.round(hue))),
    saturation: Math.min(100, Math.max(0, Math.round(saturation))),
    value: Math.min(100, Math.max(0, Math.round(value)))
  };
}

function emitColorChange(
  hue: number,
  saturation: number,
  value: number,
  onChange?: (value: ColorPickerChange) => void
): void {
  if (!onChange) {
    return;
  }

  const nextHue = Math.round(clamp(hue, 0, 359));
  const nextSaturation = Math.round(clamp(saturation, 0, 100));
  const nextValue = Math.round(clamp(value, 0, 100));
  onChange({
    hue: nextHue,
    saturation: nextSaturation,
    value: nextValue,
    stRgb: hsvToRgbString(nextHue, nextSaturation, nextValue),
    stHex: hsvToHexString(nextHue, nextSaturation, nextValue)
  });
}

function getEventLocalX(event: VitrinePointerEvent): number | null {
  return typeof event.xl === 'number' ? event.xl : null;
}

function getEventSceneX(event: VitrinePointerEvent): number | null {
  return typeof event.xs === 'number' ? event.xs : null;
}

function ensureDragState(props: ColorPickerProps): ColorPickerDragState {
  const key = '_colorPickerDragState';
  const propsWithState = props as ColorPickerProps & { [key: string]: ColorPickerDragState | undefined };

  if (!propsWithState[key]) {
    propsWithState[key] = {
      stChannel: null,
      xsStart: 0,
      hueStart: 0,
      saturationStart: 0,
      valueStart: 0
    };
  }

  return propsWithState[key] as ColorPickerDragState;
}

export function colorpicker(props: ColorPickerProps): GUIControlOfType<GUIControlType.ColorPicker> {
  return {
    type: GUIControlType.ColorPicker,
    props
  };
}

export function transformColorPicker(
  control: GUIControlOfType<GUIControlType.ColorPicker>,
  context: TransformContext,
  _state?: unknown
): Block {
  const { props } = control;
  const {
    x: xp = DEFAULTS.x,
    y: yp = DEFAULTS.y,
    dx,
    dy,
    id,
    hue: hueProp,
    saturation: saturationProp,
    value: valueProp,
    presets,
    fShowPreview,
    fShowPresets,
    fVisible,
    onHover,
    onChange
  } = props;

  const style = getColorPickerStyle(control, context);
  const {
    colBg,
    colBorder,
    colText,
    colSliderTrack,
    colSliderThumb,
    borderWidth,
    borderRadius,
    fontSize,
    fontFamily
  } = style;

  const dxp = dx ?? DEFAULTS.dx;
  const dyp = dy ?? DEFAULTS.dy;
  const duPadding = DEFAULTS.duPadding;
  const dxLabel = DEFAULTS.dxLabel;
  const dxLabelGap = DEFAULTS.dxLabelGap;
  const dyBar = DEFAULTS.dyBar;
  const dyBarGap = DEFAULTS.dyBarGap;
  const dyPreview = DEFAULTS.dyPreview;
  const dyPresetGap = DEFAULTS.dyPresetGap;
  const duPresetRadius = DEFAULTS.duPresetRadius;
  const duPresetSpacing = DEFAULTS.duPresetSpacing;

  const hue = clamp(hueProp ?? DEFAULTS.hue, 0, 359);
  const saturation = clamp(saturationProp ?? DEFAULTS.saturation, 0, 100);
  const value = clamp(valueProp ?? DEFAULTS.value, 0, 100);
  const showPreview = fShowPreview !== false;
  const showPresets = fShowPresets !== false;
  const presetsActual = presets ?? [...DEFAULTS.presets];

  const xlpBars = duPadding + dxLabel + dxLabelGap;
  const dxpBars = Math.max(1, dxp - xlpBars - duPadding);
  const duTrackHeight = DEFAULTS.duTrackHeight;
  const duThumbRadius = DEFAULTS.duThumbRadius;
  const colTrackStroke = colSliderTrack || DEFAULTS.colTrackStroke;
  const colThumbFill = colSliderThumb || DEFAULTS.colThumbFill;

  const currentRgb = hsvToRgbTuple(hue, saturation, value);
  const currentColor = hsvToRgbString(hue, saturation, value);
  const currentHex = hsvToHexString(hue, saturation, value);
  const luminance = (0.2126 * currentRgb.red + 0.7152 * currentRgb.green + 0.0722 * currentRgb.blue) / 255;
  const colPreviewText = luminance > 0.55
    ? (colBg || colText)
    : (colText || colBg);

  let ylpCursor = duPadding;
  const children: Block[] = [];
  const dragState = ensureDragState(props);

  children.push(
    rectangle({
      dx: dxp,
      dy: dyp,
      fill: colBg,
      stroke: colBorder,
      strokeWidth: borderWidth,
      cornerRadius: borderRadius
    })
  );

  if (showPreview) {
    children.push(
      rectangle({
        x: duPadding,
        y: ylpCursor,
        dx: dxp - 2 * duPadding,
        dy: dyPreview,
        fill: currentColor,
        stroke: colBorder,
        strokeWidth: borderWidth,
        cornerRadius: DEFAULTS.duPreviewRadius
      })
    );

    children.push(
      text({
        x: dxp / 2,
        y: ylpCursor + dyPreview / 2,
        text: currentHex,
        fill: colPreviewText,
        align: 'center',
        baseline: 'middle',
        fontSize,
        font: fontFamily
      })
    );

    ylpCursor += dyPreview + DEFAULTS.dySectionGap;
  }

  const cHueSegments = DEFAULTS.cHueSegments;
  const cSvSegments = DEFAULTS.cSvSegments;
  const dyTrackOffset = (dyBar - duTrackHeight) / 2;

  const startDrag = (stChannel: 'hue' | 'saturation' | 'value', event: VitrinePointerEvent): void => {
    const xsStart = getEventSceneX(event);
    dragState.stChannel = stChannel;
    dragState.xsStart = xsStart ?? 0;
    dragState.hueStart = hue;
    dragState.saturationStart = saturation;
    dragState.valueStart = value;
  };

  const dragToValue = (stChannel: 'hue' | 'saturation' | 'value', event: VitrinePointerEvent): void => {
    if (dragState.stChannel !== stChannel) {
      return;
    }

    // Use scene coordinates (xs) for drag delta — stable regardless
    // of which block the pointer is currently over.
    const xsCurrent = getEventSceneX(event);
    if (xsCurrent === null) {
      return;
    }

    const dxsScene = xsCurrent - dragState.xsStart;
    const normalizedDelta = dxsScene / dxpBars;

    if (stChannel === 'hue') {
      const deltaHue = normalizedDelta * 359;
      emitColorChange(dragState.hueStart + deltaHue, dragState.saturationStart, dragState.valueStart, onChange);
      return;
    }

    if (stChannel === 'saturation') {
      const deltaSat = normalizedDelta * 100;
      emitColorChange(dragState.hueStart, dragState.saturationStart + deltaSat, dragState.valueStart, onChange);
      return;
    }

    const deltaVal = normalizedDelta * 100;
    emitColorChange(dragState.hueStart, dragState.saturationStart, dragState.valueStart + deltaVal, onChange);
  };

  const mapLocalXToChannelValue = (
    stChannel: 'hue' | 'saturation' | 'value',
    xlpLocal: number
  ): { hue: number; saturation: number; value: number } => {
    const progress = clamp(xlpLocal / dxpBars, 0, 1);

    if (stChannel === 'hue') {
      return {
        hue: progress * 359,
        saturation,
        value
      };
    }

    if (stChannel === 'saturation') {
      return {
        hue,
        saturation: progress * 100,
        value
      };
    }

    return {
      hue,
      saturation,
      value: progress * 100
    };
  };

  const applyFromTrackPosition = (
    stChannel: 'hue' | 'saturation' | 'value',
    xlpLocal: number
  ): { hue: number; saturation: number; value: number } => {
    const next = mapLocalXToChannelValue(stChannel, xlpLocal);
    emitColorChange(next.hue, next.saturation, next.value, onChange);
    return next;
  };

  const startTrackDrag = (stChannel: 'hue' | 'saturation' | 'value', event: VitrinePointerEvent): void => {
    // If already dragging (thumb's handler fired first), don't jump
    if (dragState.stChannel !== null) {
      return;
    }

    const xlpLocal = getEventLocalX(event);
    const next = xlpLocal !== null
      ? applyFromTrackPosition(stChannel, xlpLocal)
      : { hue, saturation, value };

    const xsStart = getEventSceneX(event);
    dragState.stChannel = stChannel;
    dragState.xsStart = xsStart ?? 0;
    dragState.hueStart = next.hue;
    dragState.saturationStart = next.saturation;
    dragState.valueStart = next.value;
  };

  const clickTrack = (stChannel: 'hue' | 'saturation' | 'value', event: VitrinePointerEvent): void => {
    const xlpLocal = getEventLocalX(event);
    if (xlpLocal === null) {
      return;
    }

    applyFromTrackPosition(stChannel, xlpLocal);
  };

  const endDrag = (): void => {
    dragState.stChannel = null;
  };

  const xlpHueThumb = xlpBars + (hue / 359) * dxpBars;
  const xlpSatThumb = xlpBars + (saturation / 100) * dxpBars;
  const xlpValThumb = xlpBars + (value / 100) * dxpBars;

  children.push(
    text({
      x: duPadding,
      y: ylpCursor + dyBar / 2,
      text: 'Hue',
      fill: colText,
      baseline: 'middle',
      fontSize,
      font: fontFamily
    })
  );
  for (let i = 0; i < cHueSegments; i++) {
    const hueSegment = (i / cHueSegments) * 360;
    children.push(
      rectangle({
        x: xlpBars + (i / cHueSegments) * dxpBars,
        y: ylpCursor + dyTrackOffset,
        dx: dxpBars / cHueSegments + 1,
        dy: duTrackHeight,
        fill: hsvToRgbString(hueSegment, 100, 100)
      })
    );
  }
  children.push(
    rectangle({
      x: xlpBars,
      y: ylpCursor,
      dx: dxpBars,
      dy: dyBar,
      fill: 'transparent',
      stroke: colTrackStroke,
      strokeWidth: 1,
      cornerRadius: duTrackHeight / 2,
      onClick: onChange ? (event: VitrinePointerEvent) => clickTrack('hue', event) : undefined,
      onPointerDown: onChange ? (event: VitrinePointerEvent) => startTrackDrag('hue', event) : undefined,
      // Note: No onDrag handler - only the thumb handles dragging
      onPointerUp: endDrag
    })
  );
  children.push(
    circle({
      x: xlpHueThumb,
      y: ylpCursor + dyBar / 2,
      radius: duThumbRadius,
      fill: colThumbFill,
      stroke: colTrackStroke,
      strokeWidth: 2,
      onPointerDown: onChange ? (event: VitrinePointerEvent) => startDrag('hue', event) : undefined,
      onDrag: onChange ? (event: VitrinePointerEvent) => dragToValue('hue', event) : undefined,
      onPointerUp: endDrag
    })
  );

  ylpCursor += dyBar + dyBarGap;

  children.push(
    text({
      x: duPadding,
      y: ylpCursor + dyBar / 2,
      text: 'Sat',
      fill: colText,
      baseline: 'middle',
      fontSize,
      font: fontFamily
    })
  );
  for (let i = 0; i < cSvSegments; i++) {
    const satSegment = (i / cSvSegments) * 100;
    children.push(
      rectangle({
        x: xlpBars + (i / cSvSegments) * dxpBars,
        y: ylpCursor + dyTrackOffset,
        dx: dxpBars / cSvSegments + 1,
        dy: duTrackHeight,
        fill: hsvToRgbString(hue, satSegment, value)
      })
    );
  }
  children.push(
    rectangle({
      x: xlpBars,
      y: ylpCursor,
      dx: dxpBars,
      dy: dyBar,
      fill: 'transparent',
      stroke: colTrackStroke,
      strokeWidth: 1,
      cornerRadius: duTrackHeight / 2,
      onClick: onChange ? (event: VitrinePointerEvent) => clickTrack('saturation', event) : undefined,
      onPointerDown: onChange ? (event: VitrinePointerEvent) => startTrackDrag('saturation', event) : undefined,
      // Note: No onDrag handler - only the thumb handles dragging
      onPointerUp: endDrag
    })
  );
  children.push(
    circle({
      x: xlpSatThumb,
      y: ylpCursor + dyBar / 2,
      radius: duThumbRadius,
      fill: colThumbFill,
      stroke: colTrackStroke,
      strokeWidth: 2,
      onPointerDown: onChange ? (event: VitrinePointerEvent) => startDrag('saturation', event) : undefined,
      onDrag: onChange ? (event: VitrinePointerEvent) => dragToValue('saturation', event) : undefined,
      onPointerUp: endDrag
    })
  );

  ylpCursor += dyBar + dyBarGap;

  children.push(
    text({
      x: duPadding,
      y: ylpCursor + dyBar / 2,
      text: 'Val',
      fill: colText,
      baseline: 'middle',
      fontSize,
      font: fontFamily
    })
  );
  for (let i = 0; i < cSvSegments; i++) {
    const valueSegment = (i / cSvSegments) * 100;
    children.push(
      rectangle({
        x: xlpBars + (i / cSvSegments) * dxpBars,
        y: ylpCursor + dyTrackOffset,
        dx: dxpBars / cSvSegments + 1,
        dy: duTrackHeight,
        fill: hsvToRgbString(hue, saturation, valueSegment)
      })
    );
  }
  children.push(
    rectangle({
      x: xlpBars,
      y: ylpCursor,
      dx: dxpBars,
      dy: dyBar,
      fill: 'transparent',
      stroke: colTrackStroke,
      strokeWidth: 1,
      cornerRadius: duTrackHeight / 2,
      onClick: onChange ? (event: VitrinePointerEvent) => clickTrack('value', event) : undefined,
      onPointerDown: onChange ? (event: VitrinePointerEvent) => startTrackDrag('value', event) : undefined,
      // Note: No onDrag handler - only the thumb handles dragging
      onPointerUp: endDrag
    })
  );
  children.push(
    circle({
      x: xlpValThumb,
      y: ylpCursor + dyBar / 2,
      radius: duThumbRadius,
      fill: colThumbFill,
      stroke: colTrackStroke,
      strokeWidth: 2,
      onPointerDown: onChange ? (event: VitrinePointerEvent) => startDrag('value', event) : undefined,
      onDrag: onChange ? (event: VitrinePointerEvent) => dragToValue('value', event) : undefined,
      onPointerUp: endDrag
    })
  );

  ylpCursor += dyBar;

  if (showPresets) {
    ylpCursor += dyPresetGap;
    children.push(
      text({
        x: duPadding,
        y: ylpCursor,
        text: 'Presets',
        fill: colText,
        fontSize,
        font: fontFamily
      })
    );
    ylpCursor += DEFAULTS.dyPresetLabelGap;

    const dxpPresetStep = 2 * duPresetRadius + duPresetSpacing;
    const maxPresets = Math.max(1, Math.floor((dxp - 2 * duPadding + duPresetSpacing) / dxpPresetStep));

    presetsActual.slice(0, maxPresets).forEach((stPreset, iPreset) => {
      const xlpPreset = duPadding + duPresetRadius + iPreset * dxpPresetStep;
      children.push(
        circle({
          x: xlpPreset,
          y: ylpCursor,
          radius: duPresetRadius,
          fill: stPreset,
          stroke: colBorder,
          strokeWidth: 2,
          onClick: onChange
            ? () => {
                const hsv = hexToHsv(stPreset);
                emitColorChange(hsv.hue, hsv.saturation, hsv.value, onChange);
              }
            : undefined
        })
      );
    });
  }

  children.push(
    text({
      x: dxp / 2,
      y: dyp - duPadding,
      text: `H:${Math.round(hue)}° S:${Math.round(saturation)}% V:${Math.round(value)}%`,
      align: 'center',
      baseline: 'bottom',
      fill: colText,
      fontSize,
      font: fontFamily
    })
  );

  return group(
    {
      x: xp,
      y: yp,
      visible: fVisible !== false,
      id,
      onHover
    },
    children
  );
}
