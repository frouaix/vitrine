// Copyright (c) 2026 François Rouaix

import type { GUIBaseProps } from '../types.ts';

export interface GridProps extends GUIBaseProps {
  cColumns?: number;
  rows?: number;
  duPadding?: number;
  duSpacing?: number;
}
