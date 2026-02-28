// Copyright (c) 2026 François Rouaix

import type { Block } from 'vitrine';
import { image, group } from 'vitrine';
import type { GUIControlOfType, TransformContext } from '../types.ts';
import { GUIControlType } from '../types.ts';
import { IMAGE_DEFAULTS } from './defaultsImage.ts';
import { COMMON_DEFAULTS } from '../constants.ts';

export function transformGUIImage(
  control: GUIControlOfType<GUIControlType.Image>,
  context: TransformContext
): Block {
  const { props } = control;
  const { x: xp = COMMON_DEFAULTS.x, y: yp = COMMON_DEFAULTS.y, dx, dy, id, src, fVisible } = props;
  
  const dxp = dx ?? IMAGE_DEFAULTS.dx;
  const dyp = dy ?? IMAGE_DEFAULTS.dy;
  
  return group(
    {
      x: xp,
      y: yp,
      visible: fVisible !== false,
      id
    },
    [
      image({
        src,
        dx: dxp,
        dy: dyp
      })
    ]
  );
}
