// Copyright (c) 2026 François Rouaix

import type { Block } from '../../core/types.ts';
import { group } from '../../core/blocks.ts';
import type { Rs, LayoutDirection, GUIControlOfType, TransformContext } from '../types.ts';
import { GUIControlType } from '../types.ts';
import { COMMON_DEFAULTS } from '../constants.ts';
import { transformGUIControl, rsControl, repositionBlock } from '../transform.ts';

export function transformStack(
  control: GUIControlOfType<GUIControlType.HStack | GUIControlType.VStack>,
  context: TransformContext
): Block {
  const { props } = control;
  const {
    x: xp = COMMON_DEFAULTS.x,
    y: yp = COMMON_DEFAULTS.y,
    id,
    duSpacing,
    duPadding,
    fVisible
  } = props;
  const direction: LayoutDirection = control.type === GUIControlType.HStack ? 'horizontal' : 'vertical';

  const spacing = duSpacing || COMMON_DEFAULTS.duSpacing;
  const padding = duPadding || COMMON_DEFAULTS.duPadding;
  
  if (!control.children) {
    return group({ x: xp, y: yp }, []);
  }
  
  const children: Block[] = [];
  let dypOffset = padding;
  let maxCrossAxis = 0;
  
  for (const child of control.children) {
    const transformed = transformGUIControl(child, context);
    const rsChild = rsControl(child);
    
    const positionedBlock = repositionBlock(
      transformed,
      direction === 'horizontal' ? dypOffset : padding,
      direction === 'horizontal' ? padding : dypOffset
    );
    
    dypOffset += (direction === 'horizontal' ? rsChild.width : rsChild.height) + spacing;
    
    if (direction === 'horizontal') {
      maxCrossAxis = Math.max(maxCrossAxis, rsChild.height);
    } else {
      maxCrossAxis = Math.max(maxCrossAxis, rsChild.width);
    }
    
    children.push(positionedBlock);
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
