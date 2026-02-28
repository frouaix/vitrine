// Copyright (c) 2026 François Rouaix

import type { VitrinePointerEvent } from 'vitrine';
import type { GUIBaseProps } from '../types.ts';

export interface RadioButtonProps extends GUIBaseProps {
  fChecked?: boolean;
  stLabel?: string;
  stValue?: string;
  group?: string;
  onChange?: (stValue: string) => void;
  onHover?: (event: VitrinePointerEvent) => void;
}
