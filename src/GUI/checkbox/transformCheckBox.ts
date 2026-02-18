// Copyright (c) 2026 François Rouaix

import type { Block, VitrinePointerEvent } from '../../core/types.ts';
import { rectangle, text, circle, group } from '../../core/blocks.ts';
import type { GUIControlOfType, TransformContext } from '../types.ts';
import { GUIControlType } from '../types.ts';
import { CHECKBOX_DEFAULTS } from './defaultsCheckBox.ts';
import { COMMON_DEFAULTS, TEXT_DEFAULTS, getControlStyle } from '../constants.ts';

export function transformCheckBox(
  control: GUIControlOfType<GUIControlType.CheckBox>,
  context: TransformContext,
  state: { fHovered?: boolean } = {}
): Block {
  const { props } = control;
  const style = getControlStyle(control, context);
  const {
    colBgChecked,
    colBgHover,
    colBg,
    colBorder,
    colText,
    borderWidth,
    borderRadius,
    fontSize,
    fontFamily
  } = style;
  const { x: xp = COMMON_DEFAULTS.x, y: yp = COMMON_DEFAULTS.y, id, fChecked, stLabel, fVisible, onHover, onChange } = props;
  
  const dypBox = CHECKBOX_DEFAULTS.duBox;
  const dxpLabelSpacing = CHECKBOX_DEFAULTS.duLabelSpacing;
  
  const children: Block[] = [];
  
  const { fHovered } = state;
  const fCheckedActual = fChecked === true;

  // Checkbox box
  const colBgActual = fCheckedActual
    ? colBgChecked
    : fHovered
    ? colBgHover || colBg
    : colBg;
  
  children.push(
    rectangle({
      dx: dypBox,
      dy: dypBox,
      fill: colBgActual,
      stroke: colBorder,
      strokeWidth: borderWidth,
      cornerRadius: borderRadius,
      onClick: onChange ? (_event: VitrinePointerEvent) => onChange(!fCheckedActual) : undefined,
      onHover
    })
  );
  
  // Check mark
  if (fCheckedActual) {
    children.push(
      text({
        text: CHECKBOX_DEFAULTS.checkmark.stText,
        x: dypBox / 2,
        y: dypBox / 2,
        fill: CHECKBOX_DEFAULTS.checkmark.colFill,
        fontSize: CHECKBOX_DEFAULTS.checkmark.duFont,
        align: TEXT_DEFAULTS.alignCenter,
        baseline: TEXT_DEFAULTS.baselineMiddle
      })
    );
  }
  
  // Label
  if (stLabel) {
    children.push(
      text({
        text: stLabel,
        x: dypBox + dxpLabelSpacing,
        y: dypBox / 2,
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
