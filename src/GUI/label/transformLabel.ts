// Copyright (c) 2026 François Rouaix

import type { Block } from '../../core/types.ts';
import { text, group } from '../../core/blocks.ts';
import type { GUIControlOfType, TransformContext } from '../types.ts';
import { GUIControlType } from '../types.ts';
import { COMMON_DEFAULTS, getControlStyle } from '../constants.ts';

export function transformLabel(
  control: GUIControlOfType<GUIControlType.Label>,
  context: TransformContext
): Block {
  const { props } = control;
  const {
    x: xp = COMMON_DEFAULTS.x,
    y: yp = COMMON_DEFAULTS.y,
    id,
    fontSize: duFont,
    stText,
    fVisible,
    align,
  } = props;
  const style = getControlStyle(control, context);
  const { colText, fontSize, fontFamily } = style;
  const stTextActual = stText || '';
  
  return group(
    {
      x: xp,
      y: yp,
      visible: fVisible !== false,
      id
    },
    [
      text({
        text: stTextActual,
        fill: colText,
        fontSize: duFont || fontSize,
        font: fontFamily,
        align
      })
    ]
  );
}
