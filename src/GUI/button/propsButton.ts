// Copyright (c) 2026 François Rouaix

import type { VitrinePointerEvent } from '../../core/types.ts';
import type { GUIBaseProps } from '../types.ts';

export interface ButtonProps extends GUIBaseProps {
  stLabel?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  onHover?: (event: VitrinePointerEvent) => void;
}
