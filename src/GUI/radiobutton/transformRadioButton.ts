// Copyright (c) 2026 François Rouaix

import type { Block } from '../../core/types.ts';
import { circle, text, group } from '../../core/blocks.ts';
import type { GUIControlOfType, TransformContext } from '../types.ts';
import { GUIControlType } from '../types.ts';
import { RADIOBUTTON_DEFAULTS } from './defaultsRadioButton.ts';
import { COMMON_DEFAULTS, TEXT_DEFAULTS, getControlStyle } from '../constants.ts';

export function transformRadioButton(
  control: GUIControlOfType<GUIControlType.RadioButton>,
  context: TransformContext,
  state: { fHovered?: boolean } = {}
): Block {
  const { props } = control;
  const { x: xp = COMMON_DEFAULTS.x, y: yp = COMMON_DEFAULTS.y, id, stValue, stLabel, fChecked, fVisible, onChange, onHover } = props;
  const { fHovered } = state;
  const style = getControlStyle(control, context);
  const {
    colBgHover,
    colBg,
    colBorder,
    colBgChecked,
    colText,
    borderWidth,
    fontSize,
    fontFamily
  } = style;
  
  const rl = RADIOBUTTON_DEFAULTS.duRadius;
  const dxpLabelSpacing = RADIOBUTTON_DEFAULTS.duLabelSpacing;
  
  const children: Block[] = [];
  
  // Radio circle
  const colBgActual = fHovered
    ? colBgHover || colBg
    : colBg;
  
  children.push(
    circle({
      radius: rl,
      fill: colBgActual,
      stroke: colBorder,
      strokeWidth: borderWidth,
      onClick: onChange && stValue ? (event: PointerEvent) => onChange(stValue) : undefined,
      onHover
    })
  );
  
  // Inner dot when checked
  if (fChecked) {
    children.push(
      circle({
        radius: RADIOBUTTON_DEFAULTS.duInnerDotRadius,
        fill: colBgChecked
      })
    );
  }
  
  // Label
  if (stLabel) {
    children.push(
      text({
        text: stLabel,
        x: rl + dxpLabelSpacing,
        y: 0,
        fill: colText,
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
