// Copyright (c) 2026 François Rouaix

import type { Block } from '../../core/types.ts';
import { circle, group } from '../../core/blocks.ts';
import type { GUIControlOfType, TransformContext } from '../types.ts';
import { GUIControlType } from '../types.ts';
import { CAROUSEL_DEFAULTS } from './defaultsCarousel.ts';
import { COMMON_DEFAULTS } from '../constants.ts';
import { transformGUIControl } from '../transform.ts';

export function transformCarousel(
  control: GUIControlOfType<GUIControlType.Carousel>,
  context: TransformContext
): Block {
  const { props } = control;
  const { x: xp = COMMON_DEFAULTS.x, y: yp = COMMON_DEFAULTS.y, dx, dy, id, currentIndex: indexProp, fVisible } = props;
  const currentIndex = indexProp || CAROUSEL_DEFAULTS.currentIndex;
  
  if (!control.children || control.children.length === 0) {
    return group({ x: xp, y: yp }, []);
  }
  
  // Only show the current item
  const currentChild = control.children[currentIndex];
  const transformed = currentChild ? transformGUIControl(currentChild, context) : null;
  
  const children: Block[] = transformed ? [transformed] : [];
  
  // Add navigation dots
  const ypDot = (dy ?? CAROUSEL_DEFAULTS.dy) + CAROUSEL_DEFAULTS.duDotOffsetY;
  const dxpDotSpacing = CAROUSEL_DEFAULTS.duDotSpacing;
  const dxpTotal = control.children.length * dxpDotSpacing;
  const xpStart = ((dx ?? CAROUSEL_DEFAULTS.dx) - dxpTotal) / 2;
  
  for (let i = 0; i < control.children.length; i++) {
    children.push(
      circle({
        x: xpStart + i * dxpDotSpacing,
        y: ypDot,
        radius: CAROUSEL_DEFAULTS.duDotRadius,
        fill: i === currentIndex ? CAROUSEL_DEFAULTS.colActiveDotFill : CAROUSEL_DEFAULTS.colInactiveDotFill
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
