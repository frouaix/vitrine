// Copyright (c) 2026 François Rouaix

import type { Block } from 'vitrine';
import { group } from 'vitrine';
import type { GUIControlOfType, TransformContext } from '../types.ts';
import { GUIControlType } from '../types.ts';
import { GRID_DEFAULTS } from './defaultsGrid.ts';
import { COMMON_DEFAULTS } from '../constants.ts';
import { transformGUIControl, rsControl, repositionBlock } from '../transform.ts';

export function transformGrid(
  control: GUIControlOfType<GUIControlType.Grid>,
  context: TransformContext
): Block {
  const { props } = control;
  const {
    x: xp = COMMON_DEFAULTS.x,
    y: yp = COMMON_DEFAULTS.y,
    id,
    cColumns,
    duSpacing,
    duPadding,
    fVisible
  } = props;

  const columns = cColumns || GRID_DEFAULTS.cColumns;
  const spacing = duSpacing || COMMON_DEFAULTS.duSpacing;
  const padding = duPadding || COMMON_DEFAULTS.duPadding;
  
  if (!control.children) {
    return group({ x: xp, y: yp }, []);
  }
  
  const children: Block[] = [];
  let maxRowHeight: number[] = [];
  let maxColWidth: number[] = [];
  
  // First pass: determine the maximum dimensions for each row and column
  control.children.forEach((child, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const rsChild = rsControl(child);
    
    maxColWidth[col] = Math.max(maxColWidth[col] || COMMON_DEFAULTS.duAxisStart, rsChild.width);
    maxRowHeight[row] = Math.max(maxRowHeight[row] || COMMON_DEFAULTS.duAxisStart, rsChild.height);
  });
  
  // Second pass: position children
  control.children.forEach((child, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    
    let xp = padding;
    for (let c = 0; c < col; c++) {
      xp += maxColWidth[c] + spacing;
    }
    
    let yp = padding;
    for (let r = 0; r < row; r++) {
      yp += maxRowHeight[r] + spacing;
    }
    
    const transformed = transformGUIControl(child, context);
    const positionedBlock = repositionBlock(transformed, xp, yp);
    
    children.push(positionedBlock);
  });
  
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
