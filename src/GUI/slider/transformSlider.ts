// Copyright (c) 2026 François Rouaix

import type { Block, VitrinePointerEvent } from '../../core/types.ts';
import { rectangle, circle, group } from '../../core/blocks.ts';
import type { GUIControlOfType, TransformContext } from '../types.ts';
import { GUIControlType } from '../types.ts';
import { SLIDER_DEFAULTS } from './defaultsSlider.ts';
import { COMMON_DEFAULTS, getControlStyle } from '../constants.ts';

export function transformSlider(
  control: GUIControlOfType<GUIControlType.Slider>,
  context: TransformContext,
  state: { fHovered?: boolean } = {}
): Block {
  const { props } = control;
  const {
    x: xp = COMMON_DEFAULTS.x,
    y: yp = COMMON_DEFAULTS.y,
    dx,
    dy,
    id,
    orientation,
    min,
    max,
    value: valueProp,
    fVisible,
    onChange,
    onHover
  } = props;
  const style = getControlStyle(control, context);
  const {
    colSliderTrack,
    colSliderThumb
  } = style;

  const fVertical = orientation === 'vertical';
  const duLength = fVertical
    ? (dy ?? dx ?? SLIDER_DEFAULTS.dx)
    : (dx ?? SLIDER_DEFAULTS.dx);
  const duCross = fVertical
    ? (dx ?? SLIDER_DEFAULTS.dy)
    : (dy ?? SLIDER_DEFAULTS.dy);
  const dypTrack = SLIDER_DEFAULTS.duTrack;
  const rlThumb = SLIDER_DEFAULTS.duThumbRadius;
  const dypHitArea = rlThumb * 2;
  const duCrossCenter = duCross / 2;
  
  const minActual = min ?? SLIDER_DEFAULTS.min;
  const maxActual = max ?? SLIDER_DEFAULTS.max;
  const value = valueProp ?? minActual;
  const range = maxActual - minActual;
  const colTrackFill = colSliderTrack || SLIDER_DEFAULTS.colTrackFill;
  const colTrackStroke = SLIDER_DEFAULTS.colTrackStroke;
  const colThumbFill = colSliderThumb || SLIDER_DEFAULTS.colThumbFill;
  const colThumbStroke = SLIDER_DEFAULTS.colThumbStroke;
  const normalizedValue = range === 0
    ? 0
    : Math.max(0, Math.min(1, (value - minActual) / range));
  const duThumbMin = Math.min(rlThumb, duLength / 2);
  const duThumbMax = Math.max(duThumbMin, duLength - rlThumb);
  const duThumbAxis = duThumbMin + (fVertical ? (1 - normalizedValue) : normalizedValue) * (duThumbMax - duThumbMin);

  const getEventLocalPosition = (event: VitrinePointerEvent): number | null => {
    const local = fVertical ? event.yl : event.xl;
    return typeof local === 'number' ? local : null;
  };

  const getEventScenePosition = (event: VitrinePointerEvent): number | null => {
    const scene = fVertical ? event.ys : event.xs;
    return typeof scene === 'number' ? scene : null;
  };

  const getValueFromLocalPosition = (duLocal: number): number => {
    if (range === 0) {
      return minActual;
    }

    const normalizedPosition = Math.max(0, Math.min(1, duLocal / duLength));
    const normalizedForValue = fVertical ? (1 - normalizedPosition) : normalizedPosition;
    return minActual + normalizedForValue * range;
  };

  const applyFromTrackPosition = (duLocal: number): number => {
    const nextValue = getValueFromLocalPosition(duLocal);
    onChange?.(nextValue);
    return nextValue;
  };

  const startTrackDrag = (event: VitrinePointerEvent): void => {
    if (dragState.fDragging) {
      return;
    }

    const duLocal = getEventLocalPosition(event);
    const startValue = duLocal !== null
      ? applyFromTrackPosition(duLocal)
      : value;

    const xsStart = getEventScenePosition(event);
    dragState.fDragging = true;
    dragState.xsStart = xsStart ?? 0;
    dragState.startValue = startValue;
  };

  const startThumbDrag = (event: VitrinePointerEvent): void => {
    const xsStart = getEventScenePosition(event);
    dragState.fDragging = true;
    dragState.xsStart = xsStart ?? 0;
    dragState.startValue = value;
  };

  const clickTrack = (event: VitrinePointerEvent): void => {
    const duLocal = getEventLocalPosition(event);
    if (duLocal === null) {
      return;
    }

    applyFromTrackPosition(duLocal);
  };

  const dragToValue = (event: VitrinePointerEvent): void => {
    if (!dragState.fDragging) {
      return;
    }

    if (range === 0) {
      onChange?.(minActual);
      return;
    }

    // Use scene coordinates (xs/ys) for drag delta — they are stable
    // regardless of which block the pointer is currently over.
    const xsCurrent = getEventScenePosition(event);
    if (xsCurrent === null) {
      return;
    }

    const dxsScene = xsCurrent - dragState.xsStart;
    const normalizedDelta = dxsScene / duLength;
    const deltaValue = (fVertical ? -normalizedDelta : normalizedDelta) * range;
    const newValue = Math.max(minActual, Math.min(maxActual, dragState.startValue + deltaValue));

    onChange?.(newValue);
  };
  
  // Persistent drag state (stored on props to survive re-renders)
  if (!(props as any)._dragState) {
    (props as any)._dragState = { fDragging: false, xsStart: 0, startValue: 0 };
  }
  const dragState = (props as any)._dragState;
  
  const children: Block[] = [];
  
  // Visual track
  children.push(
    rectangle({
      x: fVertical ? (duCrossCenter - dypTrack / 2) : 0,
      y: fVertical ? 0 : (duCrossCenter - dypTrack / 2),
      dx: fVertical ? dypTrack : duLength,
      dy: fVertical ? duLength : dypTrack,
      fill: colTrackFill,
      cornerRadius: dypTrack / 2,
      stroke: colTrackStroke,
      strokeWidth: SLIDER_DEFAULTS.duTrackStroke
    })
  );

  children.push(
    rectangle({
      x: fVertical ? (duCrossCenter - rlThumb) : 0,
      y: fVertical ? 0 : (duCrossCenter - rlThumb),
      dx: fVertical ? dypHitArea : duLength,
      dy: fVertical ? duLength : dypHitArea,
      fill: 'transparent',
      onClick: onChange ? clickTrack : undefined,
      onPointerDown: onChange ? startTrackDrag : undefined,
      onPointerUp: () => {
        dragState.fDragging = false;
      }
    })
  );
  
  // Thumb - draggable
  children.push(
    circle({
      x: fVertical ? duCrossCenter : duThumbAxis,
      y: fVertical ? duThumbAxis : duCrossCenter,
      radius: rlThumb,
      disableCulling: true,
      fill: colThumbFill,
      stroke: colThumbStroke,
      strokeWidth: SLIDER_DEFAULTS.duThumbStroke,
      onPointerDown: onChange ? startThumbDrag : undefined,
      onDrag: onChange ? dragToValue : undefined,
      onPointerUp: () => {
        dragState.fDragging = false;
      }
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
