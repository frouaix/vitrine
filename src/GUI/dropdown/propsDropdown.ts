// Copyright (c) 2026 François Rouaix

import type { GUIBaseProps } from '../types.ts';

export interface DropdownProps extends GUIBaseProps {
  stValue?: string;
  options: Array<{ stLabel?: string; value: string }>;
  stPlaceholder?: string;
  fOpen?: boolean;
  onChange?: (stValue: string) => void;
  onToggle?: (fOpen: boolean) => void;
  onClick?: (event: PointerEvent) => void;
  onHover?: (event: PointerEvent) => void;
}
