// Copyright (c) 2026 François Rouaix

// Color Picker Demo
import { group, rectangle, text, circle } from 'vitrine';

interface ColorPickerState {
  hue: number;
  saturation: number;
  value: number;
  presets: string[];
}

function hexToHsv(colorHex: string): { hue: number; saturation: number; value: number } {
  const normalizedHex = colorHex.replace('#', '');
  const fullHex = normalizedHex.length === 3
    ? normalizedHex.split('').map((char) => char + char).join('')
    : normalizedHex;

  if (!/^[0-9a-fA-F]{6}$/.test(fullHex)) {
    return { hue: 0, saturation: 0, value: 0 };
  }

  const red = parseInt(fullHex.slice(0, 2), 16) / 255;
  const green = parseInt(fullHex.slice(2, 4), 16) / 255;
  const blue = parseInt(fullHex.slice(4, 6), 16) / 255;

  const maxChannel = Math.max(red, green, blue);
  const minChannel = Math.min(red, green, blue);
  const delta = maxChannel - minChannel;

  let hue = 0;
  if (delta !== 0) {
    if (maxChannel === red) {
      hue = 60 * (((green - blue) / delta) % 6);
    } else if (maxChannel === green) {
      hue = 60 * (((blue - red) / delta) + 2);
    } else {
      hue = 60 * (((red - green) / delta) + 4);
    }
  }

  if (hue < 0) {
    hue += 360;
  }

  const saturation = maxChannel === 0 ? 0 : (delta / maxChannel) * 100;
  const value = maxChannel * 100;

  return {
    hue: Math.min(359, Math.max(0, Math.round(hue))),
    saturation: Math.min(100, Math.max(0, Math.round(saturation))),
    value: Math.min(100, Math.max(0, Math.round(value)))
  };
}

function getCanvasX(event: PointerEvent): number | null {
  const eventTarget = event.target;
  if (!(eventTarget instanceof HTMLCanvasElement)) {
    return null;
  }

  const canvasRect = eventTarget.getBoundingClientRect();
  const scaleX = eventTarget.width / canvasRect.width;
  return (event.clientX - canvasRect.left) * scaleX;
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
    const hsvToRgb = (hue: number, saturation: number, value: number): string => {
      const normalizedSaturation = saturation / 100;
      const normalizedValue = value / 100;
      const chroma = normalizedValue * normalizedSaturation;
      const secondary = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
      const offset = normalizedValue - chroma;
      let red: number;
      let green: number;
      let blue: number;
      
      if (hue < 60) { red = chroma; green = secondary; blue = 0; }
      else if (hue < 120) { red = secondary; green = chroma; blue = 0; }
      else if (hue < 180) { red = 0; green = chroma; blue = secondary; }
      else if (hue < 240) { red = 0; green = secondary; blue = chroma; }
      else if (hue < 300) { red = secondary; green = 0; blue = chroma; }
      else { red = chroma; green = 0; blue = secondary; }
      
      return `rgb(${Math.round((red + offset) * 255)}, ${Math.round((green + offset) * 255)}, ${Math.round((blue + offset) * 255)})`;
    };

    const currentColor = hsvToRgb(state.hue, state.saturation, state.value);

    // Hue spectrum bar (clickable)
    const hueBar = [
      // Visual spectrum (drawn first, on bottom)
      ...Array.from({ length: 360 }, (_, i) => 
        rectangle({
          x: 100 + i,
          y: 200,
          dx: 2,
          dy: 40,
          fill: hsvToRgb(i, 100, 100)
        })
      ),
      // Clickable area (drawn last, on top for hit testing)
      rectangle({
        x: 100,
        y: 200,
        dx: 360,
        dy: 40,
        fill: 'transparent',
        onClick: (event: PointerEvent) => {
          const canvasX = getCanvasX(event);
          if (canvasX === null) {
            return;
          }

          const hue = Math.max(0, Math.min(359, Math.floor(canvasX - 100)));
          state.hue = hue;
        }
      })
    ];

    // Saturation bar (clickable)
    const satBar = [
      // Visual gradient (drawn first, on bottom)
      ...Array.from({ length: 100 }, (_, i) => 
        rectangle({
          x: 100 + i * 4,
          y: 270,
          dx: 5,
          dy: 40,
          fill: hsvToRgb(state.hue, i, state.value)
        })
      ),
      // Clickable area (drawn last, on top for hit testing)
      rectangle({
        x: 100,
        y: 270,
        dx: 400,
        dy: 40,
        fill: 'transparent',
        onClick: (event: PointerEvent) => {
          const canvasX = getCanvasX(event);
          if (canvasX === null) {
            return;
          }

          const sat = Math.max(0, Math.min(100, Math.floor((canvasX - 100) / 4)));
          state.saturation = sat;
        }
      })
    ];

    // Value bar (clickable)
    const valBar = [
      // Visual gradient (drawn first, on bottom)
      ...Array.from({ length: 100 }, (_, i) => 
        rectangle({
          x: 100 + i * 4,
          y: 340,
          dx: 5,
          dy: 40,
          fill: hsvToRgb(state.hue, state.saturation, i)
        })
      ),
      // Clickable area (drawn last, on top for hit testing)
      rectangle({
        x: 100,
        y: 340,
        dx: 400,
        dy: 40,
        fill: 'transparent',
        onClick: (event: PointerEvent) => {
          const canvasX = getCanvasX(event);
          if (canvasX === null) {
            return;
          }

          const val = Math.max(0, Math.min(100, Math.floor((canvasX - 100) / 4)));
          state.value = val;
        }
      })
    ];

    // Preset colors
    const presets = state.presets.map((color: string, i: number) => 
      circle({
        x: 150 + i * 60,
        y: 470,
        radius: 20,
        fill: color,
        stroke: '#fff',
        strokeWidth: 2,
        onClick: () => {
          const { hue, saturation, value } = hexToHsv(color);
          state.hue = hue;
          state.saturation = saturation;
          state.value = value;
        }
      })
    );

    return group({ x: 0, y: 0 }, [
      rectangle({ dx: 800, dy: 600, fill: '#0a0a0a' }),

      text({
        x: 400,
        y: 40,
        text: 'Color Picker',
        fontSize: 24,
        fill: '#e0e0e0',
        align: 'center'
      }),

      // Color preview
      group({ x: 250, y: 90 }, [
        rectangle({
          dx: 300,
          dy: 80,
          fill: currentColor,
          cornerRadius: 12,
          stroke: '#444',
          strokeWidth: 2
        }),

        text({
          x: 150,
          y: 100,
          text: currentColor,
          fontSize: 16,
          fill: state.value > 50 ? '#000' : '#fff',
          align: 'center'
        })
      ]),

      // Labels
      text({ x: 50, y: 220, text: 'Hue', fontSize: 14, fill: '#888' }),
      text({ x: 50, y: 290, text: 'Sat', fontSize: 14, fill: '#888' }),
      text({ x: 50, y: 360, text: 'Val', fontSize: 14, fill: '#888' }),

      ...hueBar,
      ...satBar,
      ...valBar,

      // Sliders indicators
      circle({
        x: 100 + state.hue,
        y: 220,
        radius: 8,
        fill: '#fff',
        stroke: '#000',
        strokeWidth: 2
      }),

      circle({
        x: 100 + state.saturation * 4,
        y: 290,
        radius: 8,
        fill: '#fff',
        stroke: '#000',
        strokeWidth: 2
      }),

      circle({
        x: 100 + state.value * 4,
        y: 360,
        radius: 8,
        fill: '#fff',
        stroke: '#000',
        strokeWidth: 2
      }),

      // Presets
      text({
        x: 400,
        y: 430,
        text: 'Presets',
        fontSize: 14,
        fill: '#888',
        align: 'center'
      }),

      ...presets,

      // Values
      text({
        x: 400,
        y: 530,
        text: `H: ${state.hue}° S: ${state.saturation}% V: ${state.value}%`,
        fontSize: 14,
        fill: '#666',
        align: 'center'
      })
    ]);
  },

  code: `// HSV Color picker with sliders
const hueBar = Array.from({ length: 360 }, i => 
  rectangle({
    x: i, y: 0,
    dx: 1, dy: 40,
    fill: hsvToRgb(i, 100, 100)
  })
);

const currentColor = hsvToRgb(h, s, v);`
};
