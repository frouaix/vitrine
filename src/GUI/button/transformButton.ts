// Copyright (c) 2026 François Rouaix

import type { Block } from '../../core/types.ts';
import { rectangle, text, group } from '../../core/blocks.ts';
import type { GUIControl, GUIControlOfType, TransformContext } from '../types.ts';
import { GUIControlType } from '../types.ts';
import { BUTTON_DEFAULTS } from './defaultsButton.ts';
import { COMMON_DEFAULTS, TEXT_DEFAULTS, getControlStyle } from '../constants.ts';

export function transformButton(
  control: GUIControlOfType<GUIControlType.Button>,
  context: TransformContext,
  state: { fHovered?: boolean; fPressed?: boolean } = {}
): Block {
  const { props } = control;
  const {
    x: xp = COMMON_DEFAULTS.x,
    y: yp = COMMON_DEFAULTS.y,
    dx,
    dy,
    id,
    variant,
    className,
    stLabel,
    fEnabled,
    fVisible,
    onClick,
    onHover
  } = props;
  const stLabelActual = stLabel || '';
  const { fHovered, fPressed } = state;
  
  // Use className based on variant if no className specified
  let classNameActual = className;
  if (!classNameActual && variant) {
    classNameActual = `${variant}-button`;
  }
  
  const style = getControlStyle({ ...control, props: { ...props, className: classNameActual } } as GUIControl, context);
  const {
    colBgDisabled,
    colBgActive,
    colBgHover,
    colBg,
    colText,
    colTextDisabled,
    colBorder,
    borderWidth,
    borderRadius,
    fontSize,
    fontFamily
  } = style;
  
  const dxp = dx ?? BUTTON_DEFAULTS.dx;
  const dyp = dy ?? BUTTON_DEFAULTS.dy;
  
  const colBgActual = !fEnabled && fEnabled !== undefined
    ? colBgDisabled
    : fPressed
    ? colBgActive
    : fHovered
    ? colBgHover
    : colBg;
  
  const colTextActual = !fEnabled && fEnabled !== undefined
    ? colTextDisabled
    : colText;
  
  const children: Block[] = [];
  
  // Background
  children.push(
    rectangle({
      dx: dxp,
      dy: dyp,
      fill: colBgActual,
      stroke: colBorder,
      strokeWidth: borderWidth,
      cornerRadius: borderRadius
    })
  );
  
  // Label
  children.push(
    text({
      text: stLabelActual,
      x: dxp / 2,
      y: dyp / 2,
      fill: colTextActual,
      fontSize,
      font: fontFamily,
      align: TEXT_DEFAULTS.alignCenter,
      baseline: TEXT_DEFAULTS.baselineMiddle
    })
  );
  
  return group(
    {
      x: xp,
      y: yp,
      visible: fVisible !== false,
      id,
      onClick: fEnabled !== false && onClick ? (event: PointerEvent) => onClick() : undefined,
      onHover
    },
    children
  );
}
