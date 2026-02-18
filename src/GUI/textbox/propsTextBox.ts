// Copyright (c) 2026 François Rouaix

import type { GUIBaseProps } from '../types.ts';

export interface TextBoxProps extends GUIBaseProps {
  stValue?: string;
  stPlaceholder?: string;
  fMultiline?: boolean;
  maxLength?: number;
  onChange?: (stValue: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClick?: (event: PointerEvent) => void;
  onHover?: (event: PointerEvent) => void;
}
