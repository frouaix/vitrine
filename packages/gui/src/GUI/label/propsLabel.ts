// Copyright (c) 2026 François Rouaix

import type { GUIBaseProps } from '../types.ts';

export interface LabelProps extends GUIBaseProps {
  stText?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  align?: 'left' | 'center' | 'right';
}
