// Copyright (c) 2026 François Rouaix

import type { Block } from 'vitrine';
import { text, group } from 'vitrine';
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
    dx,
    dy,
    id,
    fontSize: duFont,
    stText,
    fVisible,
    align,
  } = props;
  const style = getControlStyle(control, context);
  const { colText, fontSize, fontFamily } = style;
  const stTextActual = stText || '';
  
  // Position text within the label's allocated area
  let xt = 0;
  if (dx !== undefined && align === 'center') {
    xt = dx / 2;
  } else if (dx !== undefined && align === 'right') {
    xt = dx;
  }
  
  let yt = 0;
  let baseline: 'middle' | undefined;
  if (dy !== undefined) {
    yt = dy / 2;
    baseline = 'middle';
  }
  
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
        x: xt,
        y: yt,
        fill: colText,
        fontSize: duFont || fontSize,
        font: fontFamily,
        align,
        baseline
      })
    ]
  );
}
