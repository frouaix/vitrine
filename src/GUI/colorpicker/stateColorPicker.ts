// Copyright (c) 2026 François Rouaix

export interface ColorPickerDragState {
  stChannel: 'hue' | 'saturation' | 'value' | null;
  xsStart: number;
  hueStart: number;
  saturationStart: number;
  valueStart: number;
}
