// Copyright (c) 2026 François Rouaix

// Analog Clock Demo
import { group, rectangle, text, circle, line } from 'vitrine';

export const demo = {
  id: 'clock',
  name: 'Analog Clock',
  description: 'Smooth animated clock face',
  
  init: () => {
    return { time: new Date() };
  },

  update: (state, dt) => {
    state.time = new Date();
  },

  render: (state) => {
    const centerX = 400;
    const centerY = 300;
    const radius = 180;

    const hours = state.time.getHours() % 12;
    const minutes = state.time.getMinutes();
    const seconds = state.time.getSeconds();
    const milliseconds = state.time.getMilliseconds();

    // Smooth second hand
    const smoothSeconds = seconds + milliseconds / 1000;

    const secondAngle = (smoothSeconds / 60) * Math.PI * 2 - Math.PI / 2;
    const minuteAngle = ((minutes + smoothSeconds / 60) / 60) * Math.PI * 2 - Math.PI / 2;
    const hourAngle = ((hours + minutes / 60) / 12) * Math.PI * 2 - Math.PI / 2;

    // Hour markers
    const markers = Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const innerR = radius - 20;
      const outerR = radius - 5;
      const x1 = centerX + Math.cos(angle) * innerR;
      const y1 = centerY + Math.sin(angle) * innerR;
      const x2 = centerX + Math.cos(angle) * outerR;
      const y2 = centerY + Math.sin(angle) * outerR;

      return group({ x: 0, y: 0 }, [
        line({
          x1, y1, x2, y2,
          stroke: '#666',
          strokeWidth: 3
        }),
        text({
          x: centerX + Math.cos(angle) * (radius + 30),
          y: centerY + Math.sin(angle) * (radius + 30),
          text: (i === 0 ? 12 : i).toString(),
          fontSize: 20,
          fill: '#888',
          align: 'center',
          baseline: 'middle'
        })
      ]);
    });

    return group({ x: 0, y: 0 }, [
      rectangle({ dx: 800, dy: 600, fill: '#0a0a0a' }),

      text({
        x: 400,
        y: 40,
        text: 'Analog Clock',
        fontSize: 24,
        fill: '#e0e0e0',
        align: 'center'
      }),

      // Clock face
      circle({
        x: centerX,
        y: centerY,
        radius: radius + 10,
        stroke: '#333',
        strokeWidth: 8
      }),

      circle({
        x: centerX,
        y: centerY,
        radius,
        fill: '#1a1a1a'
      }),

      ...markers,

      // Hour hand
      group({ x: centerX, y: centerY, rotation: hourAngle }, [
        line({
          x1: 0, y1: 0,
          x2: radius * 0.5, y2: 0,
          stroke: '#fff',
          strokeWidth: 6
        })
      ]),

      // Minute hand
      group({ x: centerX, y: centerY, rotation: minuteAngle }, [
        line({
          x1: 0, y1: 0,
          x2: radius * 0.7, y2: 0,
          stroke: '#4dabf7',
          strokeWidth: 4
        })
      ]),

      // Second hand
      group({ x: centerX, y: centerY, rotation: secondAngle }, [
        line({
          x1: -20, y1: 0,
          x2: radius * 0.85, y2: 0,
          stroke: '#ff6b6b',
          strokeWidth: 2
        })
      ]),

      // Center dot
      circle({
        x: centerX,
        y: centerY,
        radius: 8,
        fill: '#fff'
      }),

      // Digital time
      text({
        x: 400,
        y: 550,
        text: state.time.toLocaleTimeString(),
        fontSize: 18,
        fill: '#666',
        align: 'center'
      })
    ]);
  },

  code: `// Smooth animated clock
const hours = time.getHours() % 12;
const minutes = time.getMinutes();
const seconds = time.getSeconds() + 
                 time.getMilliseconds() / 1000;

const angle = (hours / 12) * Math.PI * 2;

group({ rotation: angle }, [
  line({ x1: 0, y1: 0, x2: radius, y2: 0 })
]);`
};
