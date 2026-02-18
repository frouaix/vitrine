// Copyright (c) 2026 François Rouaix

import type { GUIBaseProps } from '../types.ts';

export interface GUIImageProps extends GUIBaseProps {
  src: string | HTMLImageElement;
  fit?: 'cover' | 'contain' | 'fill';
}
