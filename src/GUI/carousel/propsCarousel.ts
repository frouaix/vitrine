// Copyright (c) 2026 François Rouaix

import type { GUIBaseProps } from '../types.ts';

export interface CarouselProps extends GUIBaseProps {
  currentIndex?: number;
  fAutoPlay?: boolean;
  interval?: number;
  onIndexChange?: (index: number) => void;
}
