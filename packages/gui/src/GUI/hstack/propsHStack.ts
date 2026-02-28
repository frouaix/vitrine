// Copyright (c) 2026 François Rouaix

import type { GUIBaseProps, Alignment } from '../types.ts';

export interface StackLayoutProps extends GUIBaseProps {
  duPadding?: number;
  duSpacing?: number;
  alignment?: Alignment;
}
