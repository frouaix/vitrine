// Color Picker Demo
import { group, rectangle, text, circle } from 'vitrine';

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
    };
  },

  update: (state, dt) => {
    // Color picker is interactive
  },

  render: (state) => {
    const hsvToRgb = (h, s, v) => {
      s /= 100;
      v /= 100;
      const c = v * s;
      const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
      const m = v - c;
      let r, g, b;
      
      if (h < 60) { r = c; g = x; b = 0; }
      else if (h < 120) { r = x; g = c; b = 0; }
      else if (h < 180) { r = 0; g = c; b = x; }
      else if (h < 240) { r = 0; g = x; b = c; }
      else if (h < 300) { r = x; g = 0; b = c; }
      else { r = c; g = 0; b = x; }
      
      return `rgb(${Math.round((r + m) * 255)}, ${Math.round((g + m) * 255)}, ${Math.round((b + m) * 255)})`;
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
        onClick: (e) => {
          const canvas = e.target;
          const rect = canvas.getBoundingClientRect();
          const scaleX = canvas.width / rect.width;
          const canvasX = (e.clientX - rect.left) * scaleX;
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
        onClick: (e) => {
          const canvas = e.target;
          const rect = canvas.getBoundingClientRect();
          const scaleX = canvas.width / rect.width;
          const canvasX = (e.clientX - rect.left) * scaleX;
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
        onClick: (e) => {
          const canvas = e.target;
          const rect = canvas.getBoundingClientRect();
          const scaleX = canvas.width / rect.width;
          const canvasX = (e.clientX - rect.left) * scaleX;
          const val = Math.max(0, Math.min(100, Math.floor((canvasX - 100) / 4)));
          state.value = val;
        }
      })
    ];

    // Preset colors
    const presets = state.presets.map((color, i) => 
      circle({
        x: 150 + i * 60,
        y: 470,
        radius: 20,
        fill: color,
        stroke: '#fff',
        strokeWidth: 2,
        onClick: () => {
          console.log(`Selected preset: ${color}`);
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
