// Copyright (c) 2026 François Rouaix

export const COLORPICKER_DEFAULTS = {
  x: 0,
  y: 0,
  dx: 520,
  dy: 330,
  hue: 200,
  saturation: 80,
  value: 90,
  duPadding: 14,
  dxLabel: 36,
  dxLabelGap: 10,
  dyPreview: 56,
  duPreviewRadius: 8,
  dySectionGap: 14,
  dyBar: 30,
  dyBarGap: 14,
  duTrackHeight: 10,
  duThumbRadius: 9,
  cHueSegments: 120,
  cSvSegments: 80,
  colTrackStroke: '#888888',
  colThumbFill: '#3b82f6',
  dyPresetGap: 20,
  dyPresetLabelGap: 24,
  duPresetRadius: 14,
  duPresetSpacing: 12,
  presets: [
    '#ff6b6b', '#4dabf7', '#51cf66', '#ffd43b',
    '#ff8787', '#a9e34b', '#cc5de8', '#ff922b'
  ]
} as const;
