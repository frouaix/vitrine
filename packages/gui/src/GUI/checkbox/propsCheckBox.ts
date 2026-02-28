// Copyright (c) 2026 François Rouaix

import type { VitrinePointerEvent } from 'vitrine';
import type { GUIBaseProps } from '../types.ts';

export interface CheckBoxProps extends GUIBaseProps {
  fChecked?: boolean;
  stLabel?: string;
  onChange?: (fChecked: boolean) => void;
  onHover?: (event: VitrinePointerEvent) => void;
}
