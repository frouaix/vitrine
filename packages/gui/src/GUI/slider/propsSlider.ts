// Copyright (c) 2026 François Rouaix

import type { VitrinePointerEvent } from 'vitrine';
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
