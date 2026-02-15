// Default constants for GUI DSL to Core block transformation

export const GUI_TO_BLOCK_DEFAULTS = {
  common: {
    x: 0,
    y: 0,
    spacing: 10,
    padding: 0,
    axisStart: 0,
    emptyText: '',
    multiplier2: 2,
    one: 1
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
      width: 300,
      height: 50,
      textPadding: 12
    },
    button: {
      width: 160,
      height: 50
    },
    checkBox: {
      width: 200,
      height: 28,
      boxSize: 28,
      labelSpacing: 12,
      checkmark: {
        text: '✓',
        fill: '#ffffff',
        fontSize: 18
      }
    },
    radioButton: {
      width: 200,
      height: 28,
      radius: 14,
      innerDotRadius: 8,
      labelSpacing: 12
    },
    slider: {
      width: 300,
      height: 24,
      min: 0,
      max: 100,
      trackHeight: 6,
      thumbRadius: 12,
      trackFill: '#4b5563',
      trackStroke: '#888888',
      trackStrokeWidth: 1,
      thumbFill: '#3b82f6',
      thumbStroke: '#ffffff',
      thumbStrokeWidth: 3
    },
    dropdown: {
      width: 300,
      height: 50,
      textPadding: 12,
      arrowText: '▼',
      arrowFontSize: 14,
      arrowOffsetX: 8,
      placeholder: 'Select...'
    },
    label: {
      width: 200,
      height: 20
    },
    panel: {
      width: 400,
      height: 300,
      padding: 16,
      titleFontSize: 16,
      titleGap: 10
    },
    image: {
      width: 100,
      height: 100
    },
    stack: {
      direction: 'vertical'
    },
    carousel: {
      width: 300,
      height: 200,
      currentIndex: 0,
      dotYOffset: 20,
      dotSpacing: 15,
      dotRadius: 4,
      activeDotFill: '#3b82f6',
      inactiveDotFill: '#d1d5db'
    },
    grid: {
      columns: 3
    },
    fallback: {
      width: 100,
      height: 40
    }
  }
} as const;
