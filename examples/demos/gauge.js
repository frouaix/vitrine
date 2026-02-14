// Gauge/Speedometer Demo
import { group, rectangle, text, arc, circle, line } from '../../dist/index.js';

export const demo = {
  id: 'gauge',
  name: 'Gauge',
  description: 'Animated speedometer with smooth needle',
  
  init: () => {
    return {
      value: 0,
      targetValue: 65,
      time: 0
    };
  },

  update: (state, dt) => {
    state.time += dt;
    
    // Smooth animation to target
    state.value += (state.targetValue - state.value) * 2 * dt;
    
    // Change target randomly
    if (Math.floor(state.time) % 3 === 0 && state.time % 1 < dt) {
      state.targetValue = Math.random() * 100;
    }
  },

  render: (state) => {
    const centerX = 400;
    const centerY = 350;
    const radius = 180;
    const startAngle = -Math.PI * 0.75;
    const endAngle = Math.PI * 0.75;
    const valueAngle = startAngle + (endAngle - startAngle) * (state.value / 100);

    // Color based on value
    const getColor = (val) => {
      if (val < 33) return '#51cf66';
      if (val < 66) return '#ffd43b';
      return '#ff6b6b';
    };

    return group({ x: 0, y: 0 }, [
      rectangle({ width: 800, height: 600, fill: '#0a0a0a' }),

      text({
        x: 400,
        y: 40,
        text: 'Performance Gauge',
        fontSize: 24,
        fill: '#e0e0e0',
        align: 'center'
      }),

      // Background arc
      arc({
        x: centerX,
        y: centerY,
        radius,
        startAngle,
        endAngle,
        stroke: '#2a2a2a',
        strokeWidth: 30
      }),

      // Value arc
      arc({
        x: centerX,
        y: centerY,
        radius,
        startAngle,
        endAngle: valueAngle,
        stroke: getColor(state.value),
        strokeWidth: 30
      }),

      // Tick marks
      ...Array.from({ length: 11 }, (_, i) => {
        const tickAngle = startAngle + (endAngle - startAngle) * (i / 10);
        const innerR = radius - 50;
        const outerR = radius - 35;
        const x1 = centerX + Math.cos(tickAngle) * innerR;
        const y1 = centerY + Math.sin(tickAngle) * innerR;
        const x2 = centerX + Math.cos(tickAngle) * outerR;
        const y2 = centerY + Math.sin(tickAngle) * outerR;

        return group({ x: 0, y: 0 }, [
          line({
            x1, y1, x2, y2,
            stroke: '#666',
            strokeWidth: 2
          }),
          text({
            x: centerX + Math.cos(tickAngle) * (radius + 30),
            y: centerY + Math.sin(tickAngle) * (radius + 30),
            text: (i * 10).toString(),
            fontSize: 12,
            fill: '#888',
            align: 'center',
            baseline: 'middle'
          })
        ]);
      }),

      // Needle
      group({ x: centerX, y: centerY, rotation: valueAngle }, [
        line({
          x1: 0,
          y1: 0,
          x2: radius - 60,
          y2: 0,
          stroke: '#fff',
          strokeWidth: 4
        }),
        circle({
          radius: 12,
          fill: '#fff'
        })
      ]),

      // Center display
      circle({
        x: centerX,
        y: centerY,
        radius: 80,
        fill: '#1a1a1a',
        stroke: '#333',
        strokeWidth: 2
      }),

      text({
        x: centerX,
        y: centerY - 10,
        text: Math.round(state.value).toString(),
        fontSize: 36,
        fill: getColor(state.value),
        align: 'center',
        baseline: 'middle'
      }),

      text({
        x: centerX,
        y: centerY + 25,
        text: 'km/h',
        fontSize: 14,
        fill: '#666',
        align: 'center',
        baseline: 'middle'
      })
    ]);
  },

  code: `// Animated gauge with needle
const angle = startAngle + 
  (endAngle - startAngle) * (value / 100);

group({ rotation: angle }, [
  line({ x1: 0, y1: 0, x2: radius, y2: 0 })
]);`
};
