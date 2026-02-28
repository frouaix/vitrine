// Copyright (c) 2026 François Rouaix

import type { Block } from 'vitrine';
import { rectangle, text, group } from 'vitrine';
import type { GUIControlOfType, TransformContext } from '../types.ts';
import { GUIControlType } from '../types.ts';
import { PANEL_DEFAULTS } from './defaultsPanel.ts';
import { COMMON_DEFAULTS, getControlStyle } from '../constants.ts';
import { transformGUIChildren } from '../transform.ts';

export function transformPanel(
  control: GUIControlOfType<GUIControlType.Panel>,
  context: TransformContext
): Block {
  const { props } = control;
  const {
    x: xp = COMMON_DEFAULTS.x,
    y: yp = COMMON_DEFAULTS.y,
    dx,
    dy,
    id,
    duPadding,
    stTitle,
    fVisible
  } = props;
  const style = getControlStyle(control, context);
  const {
    duPadding: duPaddingStyle,
    colBg: colBg,
    colBorder,
    colText,
    borderWidth,
    borderRadius,
    fontSize,
    fontFamily
  } = style;
  
  const dxp = dx ?? PANEL_DEFAULTS.dx;
  const dyp = dy ?? PANEL_DEFAULTS.dy;
  const duPaddingActual = duPadding || duPaddingStyle || PANEL_DEFAULTS.duPadding;
  
  const children: Block[] = [];
  
  // Background
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
  
  // Title if provided
  if (stTitle) {
    children.push(
      text({
        text: stTitle,
        x: duPaddingActual,
        y: duPaddingActual,
        fill: colText,
        fontSize,
        font: fontFamily
      })
    );
  }
  
  // Transform children
  if (control.children) {
    const ypContent = stTitle ? duPaddingActual + (fontSize || PANEL_DEFAULTS.duTitleFont) + PANEL_DEFAULTS.duTitleGap : duPaddingActual;
    const transformedChildren = transformGUIChildren(control.children, context, duPaddingActual, ypContent);
    children.push(...transformedChildren);
  }
  
  return group(
    {
      x: xp,
      y: yp,
      visible: fVisible !== false,
      id
    },
    children
  );
}
