// Copyright (c) 2026 François Rouaix

import type { VitrinePointerEvent } from '../../core/types.ts';
import type { GUIBaseProps } from '../types.ts';

export interface SliderProps extends GUIBaseProps {
  orientation?: 'horizontal' | 'vertical';
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  onHover?: (event: VitrinePointerEvent) => void;
}
