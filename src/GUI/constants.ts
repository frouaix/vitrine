// Copyright (c) 2026 François Rouaix

// Default constants for GUI DSL to Core block transformation

export const GUI_DEFAULTS = {
  common: {
    x: 0,
    y: 0,
    duAxisStart: 0,
    duPadding: 0,
    duSpacing: 10,
    stEmpty: ''
  },
  text: {
    alignCenter: 'center',
    baselineMiddle: 'middle'
  },
  textBox: {
    dx: 300,
    dy: 50,
    duTextPadding: 12
  },
  button: {
    dx: 160,
    dy: 50
  },
  checkBox: {
    dx: 200,
    dy: 28,
    duBox: 28,
    duLabelSpacing: 12,
    checkmark: {
      stText: '✓',
      colFill: '#ffffff',
      duFont: 18
    }
  },
  radioButton: {
    dx: 200,
    dy: 28,
    duInnerDotRadius: 8,
    duLabelSpacing: 12,
    duRadius: 14
  },
  slider: {
    dx: 300,
    dy: 24,
    min: 0,
    max: 100,
    duThumbRadius: 12,
    duThumbStroke: 3,
    duTrack: 6,
    duTrackStroke: 1,
    colThumbFill: '#3b82f6',
    colThumbStroke: '#ffffff',
    colTrackFill: '#4b5563',
    colTrackStroke: '#888888',
  },
  dropdown: {
    dx: 300,
    dy: 50,
    duArrowFont: 14,
    duArrowOffsetX: 8,
    duTextPadding: 12,
    stArrow: '▼',
    stPlaceholder: 'Select...'
  },
  colorPicker: {
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
    dyPresetGap: 20,
    dyPresetLabelGap: 24,
    duPresetRadius: 14,
    duPresetSpacing: 12,
    presets: [
      '#ff6b6b', '#4dabf7', '#51cf66', '#ffd43b',
      '#ff8787', '#a9e34b', '#cc5de8', '#ff922b'
    ]
  },
  label: {
    dx: 200,
    dy: 20
  },
  panel: {
    dx: 400,
    dy: 300,
    duPadding: 16,
    duTitleFont: 16,
    duTitleGap: 10
  },
  image: {
    dx: 100,
    dy: 100
  },
  carousel: {
    dx: 300,
    dy: 200,
    currentIndex: 0,
    duDotOffsetY: 20,
    duDotRadius: 4,
    duDotSpacing: 15,
    colActiveDotFill: '#3b82f6',
    colInactiveDotFill: '#d1d5db'
  },
  grid: {
    cColumns: 3
  },
  fallback: {
    dx: 100,
    dy: 40
  }
} as const;
