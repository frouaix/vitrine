// Copyright (c) 2026 François Rouaix

import type { Block } from 'vitrine';
import { group } from 'vitrine';
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
    alignment,
    fVisible
  } = props;
  const direction: LayoutDirection = control.type === GUIControlType.HStack ? 'horizontal' : 'vertical';

  const spacing = duSpacing || COMMON_DEFAULTS.duSpacing;
  const padding = duPadding || COMMON_DEFAULTS.duPadding;
  
  if (!control.children) {
    return group({ x: xp, y: yp }, []);
  }
  
  // First pass: measure children to determine cross-axis extent for alignment
  const childData: Array<{ block: Block; rs: Rs }> = [];
  let maxCrossAxis = 0;
  
  for (const child of control.children) {
    const transformed = transformGUIControl(child, context);
    const rs = rsControl(child);
    childData.push({ block: transformed, rs });
    if (direction === 'horizontal') {
      maxCrossAxis = Math.max(maxCrossAxis, rs.height);
    } else {
      maxCrossAxis = Math.max(maxCrossAxis, rs.width);
    }
  }
  
  // Second pass: position children with alignment
  const children: Block[] = [];
  let mainOffset = padding;
  
  for (const { block, rs } of childData) {
    let crossOffset = padding;
    
    if (alignment === 'center') {
      const crossSize = direction === 'horizontal' ? rs.height : rs.width;
      crossOffset = padding + (maxCrossAxis - crossSize) / 2;
    } else if (alignment === 'end') {
      const crossSize = direction === 'horizontal' ? rs.height : rs.width;
      crossOffset = padding + maxCrossAxis - crossSize;
    }
    
    const positionedBlock = repositionBlock(
      block,
      direction === 'horizontal' ? mainOffset : crossOffset,
      direction === 'horizontal' ? crossOffset : mainOffset
    );
    
    mainOffset += (direction === 'horizontal' ? rs.width : rs.height) + spacing;
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
