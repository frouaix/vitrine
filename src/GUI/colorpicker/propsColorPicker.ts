// Copyright (c) 2026 François Rouaix

import type { GUIBaseProps } from '../types.ts';

export interface ColorPickerChange {
  hue: number;
  saturation: number;
  value: number;
  stHex: string;
  stRgb: string;
}

export interface ColorPickerProps extends GUIBaseProps {
  hue?: number;
  saturation?: number;
  value?: number;
  presets?: string[];
  fShowPreview?: boolean;
  fShowPresets?: boolean;
  onChange?: (value: ColorPickerChange) => void;
  onHover?: (event: PointerEvent) => void;
}
