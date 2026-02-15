// Default constants for GUI DSL to Core block transformation

export const GUI_TO_BLOCK_DEFAULTS = {
  common: {
    x: 0,
    y: 0,
    duSpacing: 10,
    duPadding: 0,
    duAxisStart: 0,
    stEmpty: '',
    duMultiplier2: 2,
    duOne: 1
  },
  layout: {
    directionHorizontal: 'horizontal',
    directionVertical: 'vertical'
  },
  text: {
    alignCenter: 'center',
    baselineMiddle: 'middle'
  },
  controls: {
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
      duRadius: 14,
      duInnerDotRadius: 8,
      duLabelSpacing: 12
    },
    slider: {
      dx: 300,
      dy: 24,
      min: 0,
      max: 100,
      duTrack: 6,
      duThumbRadius: 12,
      colTrackFill: '#4b5563',
      colTrackStroke: '#888888',
      duTrackStroke: 1,
      colThumbFill: '#3b82f6',
      colThumbStroke: '#ffffff',
      duThumbStroke: 3
    },
    dropdown: {
      dx: 300,
      dy: 50,
      duTextPadding: 12,
      stArrow: '▼',
      duArrowFont: 14,
      duArrowOffsetX: 8,
      stPlaceholder: 'Select...'
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
    stack: {
      direction: 'vertical'
    },
    carousel: {
      dx: 300,
      dy: 200,
      currentIndex: 0,
      duDotOffsetY: 20,
      duDotSpacing: 15,
      duDotRadius: 4,
      colActiveDotFill: '#3b82f6',
      colInactiveDotFill: '#d1d5db'
    },
    grid: {
      duColumns: 3
    },
    fallback: {
      dx: 100,
      dy: 40
    }
  }
} as const;
