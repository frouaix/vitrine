// Copyright (c) 2026 François Rouaix

import type { Block } from '../../core/types.ts';
import { rectangle, text, group } from '../../core/blocks.ts';
import type { GUIControlOfType, ControlStyle, TransformContext } from '../types.ts';
import { GUIControlType } from '../types.ts';
import { TEXTBOX_DEFAULTS } from './defaultsTextBox.ts';
import { COMMON_DEFAULTS, TEXT_DEFAULTS, getControlStyle } from '../constants.ts';

export function transformTextBox(
  control: GUIControlOfType<GUIControlType.TextBox>,
  context: TransformContext,
  state: { fHovered?: boolean; fFocused?: boolean } = {}
): Block {
  const { props } = control;
  const style = getControlStyle(control, context);
  const {
    colBg,
    colBgHover,
    colBorderFocus,
    colBorder,
    colText,
    colTextDisabled,
    borderWidth,
    borderRadius,
    duPadding,
    fontSize,
    fontFamily
  } = style;
  const {
    x: xp = COMMON_DEFAULTS.x,
    y: yp = COMMON_DEFAULTS.y,
    dx,
    dy,
    id,
    stValue,
    stPlaceholder,
    fVisible,
    onClick,
    onHover
  } = props;
  
  const dxp = dx ?? TEXTBOX_DEFAULTS.dx;
  const dyp = dy ?? TEXTBOX_DEFAULTS.dy;
  
  const { fFocused, fHovered } = state;

  const colBgActual = fFocused
    ? colBg
    : fHovered
    ? colBgHover || colBg
    : colBg;
  
  const colBorderActual = fFocused
    ? colBorderFocus || colBorder
    : colBorder;
  const colTextActual = stValue ? colText : (colTextDisabled || colText);
  
  const children: Block[] = [];
  
  // Background
  children.push(
    rectangle({
      dx: dxp,
      dy: dyp,
      fill: colBgActual,
      stroke: colBorderActual,
      strokeWidth: borderWidth,
      cornerRadius: borderRadius,
      onClick,
      onHover
    })
  );
  
  // Text content
  const stDisplay = stValue || stPlaceholder || COMMON_DEFAULTS.stEmpty;
  if (stDisplay) {
    children.push(
      text({
        text: stDisplay,
        x: duPadding || TEXTBOX_DEFAULTS.duTextPadding,
        y: dyp / 2,
        fill: colTextActual,
        fontSize,
        font: fontFamily,
        baseline: TEXT_DEFAULTS.baselineMiddle
      })
    );
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
