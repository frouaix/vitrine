// Copyright (c) 2026 François Rouaix

import type { GUIBaseProps } from '../types.ts';

export interface SliderProps extends GUIBaseProps {
  orientation?: 'horizontal' | 'vertical';
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  onHover?: (event: PointerEvent) => void;
}
