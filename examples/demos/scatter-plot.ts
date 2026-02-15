// Copyright (c) 2026 François Rouaix

// Scatter Plot Demo - 10k points performance test
import { group, rectangle, text, circle } from 'vitrine';

export const demo = {
  id: 'scatter-plot',
  name: 'Scatter Plot',
  description: 'Thousands of data points for performance',
  
  init: () => {
    // Generate 5000 random data points
    const points = Array.from({ length: 5000 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      color: ['#ff6b6b', '#4dabf7', '#51cf66', '#ffd43b'][Math.floor(Math.random() * 4)]
    }));

    return { points, time: 0 };
  },

  update: (state, dt) => {
    state.time += dt;
  },

  render: (state) => {
    const padding = 60;
    const dxChart = 800 - padding * 2;
    const dyChart = 500;

    const dataPoints = state.points.map(p => 
      circle({
        x: padding + (p.x / 100) * dxChart,
        y: 550 - (p.y / 100) * dyChart,
        radius: p.size,
        fill: p.color,
        opacity: 0.6
      })
    );

    return group({ x: 0, y: 0 }, [
      rectangle({ dx: 800, dy: 600, fill: '#0a0a0a' }),

      text({
        x: 400,
        y: 30,
        text: `Scatter Plot (${state.points.length.toLocaleString()} points)`,
        fontSize: 24,
        fill: '#e0e0e0',
        align: 'center'
      }),

      // Axes
      rectangle({ x: padding, y: 50, dx: 2, dy: dyChart, fill: '#333' }),
      rectangle({ x: padding, y: 550, dx: dxChart, dy: 2, fill: '#333' }),

      // Grid lines
      ...Array.from({ length: 5 }, (_, i) => 
        rectangle({
          x: padding,
          y: 550 - (dyChart / 4) * i,
          dx: dxChart,
          dy: 1,
          fill: '#1a1a1a'
        })
      ),

      ...dataPoints
    ]);
  },

  code: `// 5000+ points rendered efficiently
const points = generateRandomData(5000);

points.map(p => 
  circle({
    x: p.x * scale,
    y: p.y * scale,
    radius: p.size,
    fill: p.color,
    opacity: 0.6
  })
);`
};
