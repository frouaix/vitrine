// Copyright (c) 2026 François Rouaix

// Color Picker Demo
import {
  panel,
  vstack,
  label,
  colorpicker,
  transformGUIControl,
  darkTheme
} from 'vitrine-gui';

interface ColorPickerState {
  hue: number;
  saturation: number;
  value: number;
  presets: string[];
}

export const demo = {
  id: 'color-picker',
  name: 'Color Picker',
  description: 'Custom HSV color selection UI',
  
  init: () => {
    return {
      hue: 200,
      saturation: 80,
      value: 90,
      presets: [
        '#ff6b6b', '#4dabf7', '#51cf66', '#ffd43b',
        '#ff8787', '#a9e34b', '#cc5de8', '#ff922b'
      ]
    } as ColorPickerState;
  },

  update: (state: ColorPickerState, _dt: number) => {
    // Color picker is interactive
  },

  render: (state: ColorPickerState) => {
    const context = { theme: darkTheme };

    const gui = panel(
      {
        x: 120,
        y: 40,
        dx: 560,
        dy: 430,
        stTitle: 'Color Picker',
        duPadding: 20
      },
      [
        vstack(
          { x: 0, y: 34, duSpacing: 16 },
          [
            colorpicker({
              dx: 520,
              dy: 330,
              hue: state.hue,
              saturation: state.saturation,
              value: state.value,
              presets: state.presets,
              onChange: (next) => {
                state.hue = next.hue;
                state.saturation = next.saturation;
                state.value = next.value;
              }
            }),
            label({
              stText: `H: ${Math.round(state.hue)}° S: ${Math.round(state.saturation)}% V: ${Math.round(state.value)}%`,
              fontSize: 14
            })
          ]
        )
      ]
    );

    return transformGUIControl(gui, context);
  },

  code: `// GUI ColorPicker control
const gui = panel({ stTitle: 'Color Picker' }, [
  colorpicker({
    hue,
    saturation,
    value,
    presets,
    onChange: (next) => {
      hue = next.hue;
      saturation = next.saturation;
      value = next.value;
    }
  })
]);`
};
