// Geometric Patterns Demo
import { group, rectangle, text, circle, path } from '../../dist/index.js';

export const demo = {
  id: 'patterns',
  name: 'Geometric Patterns',
  description: 'Tessellations and symmetry',
  
  init: () => {
    return { time: 0, pattern: 0 };
  },

  update: (state, dt) => {
    state.time += dt;
    state.pattern = Math.floor(state.time / 5) % 3;
  },

  render: (state) => {
    const patterns = [
      renderCirclePattern(state),
      renderHexagonPattern(state),
      renderTrianglePattern(state)
    ];

    return group({ x: 0, y: 0 }, [
      rectangle({ width: 800, height: 600, fill: '#0a0a0a' }),

      text({
        x: 400,
        y: 30,
        text: 'Geometric Patterns',
        fontSize: 24,
        fill: '#e0e0e0',
        align: 'center'
      }),

      patterns[state.pattern]
    ]);
  },

  code: `// Procedural geometric patterns
for (let i = 0; i < rows; i++) {
  for (let j = 0; j < cols; j++) {
    const x = j * spacing;
    const y = i * spacing;
    const hue = (i + j + time) % 360;
    
    circle({
      x, y, radius: size,
      fill: \`hsl(\${hue}, 70%, 60%)\`
    });
  }
}`
};

function renderCirclePattern(state) {
  const circles = [];
  const size = 30;
  const spacing = 60;

  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 14; j++) {
      const x = 40 + j * spacing;
      const y = 80 + i * spacing;
      const hue = ((i + j) * 30 + state.time * 50) % 360;
      const scale = 0.8 + Math.sin(state.time * 2 + i + j) * 0.2;

      circles.push(
        circle({
          x, y,
          radius: size * scale,
          fill: `hsl(${hue}, 70%, 60%)`,
          opacity: 0.7
        })
      );
    }
  }

  return group({ x: 0, y: 0 }, circles);
}

function renderHexagonPattern(state) {
  const hexagons = [];
  const size = 25;
  const spacing = 55;

  for (let i = 0; i < 11; i++) {
    for (let j = 0; j < 15; j++) {
      const x = 40 + j * spacing + (i % 2) * (spacing / 2);
      const y = 80 + i * (spacing * 0.866);
      const hue = ((i * 2 + j) * 25 + state.time * 30) % 360;
      const rotation = state.time * 0.5;

      // Hexagon as path
      const hex = [];
      for (let k = 0; k < 6; k++) {
        const angle = (Math.PI / 3) * k;
        hex.push(
          `${k === 0 ? 'M' : 'L'} ${Math.cos(angle) * size} ${Math.sin(angle) * size}`
        );
      }
      hex.push('Z');

      hexagons.push(
        group({ x, y, rotation }, [
          path({
            pathData: hex.join(' '),
            fill: `hsl(${hue}, 70%, 60%)`,
            stroke: '#000',
            strokeWidth: 2,
            opacity: 0.8
          })
        ])
      );
    }
  }

  return group({ x: 0, y: 0 }, hexagons);
}

function renderTrianglePattern(state) {
  const triangles = [];
  const size = 40;

  for (let i = 0; i < 15; i++) {
    for (let j = 0; j < 20; j++) {
      const x = 40 + j * size;
      const y = 80 + i * (size * 0.866);
      const hue = ((i + j) * 20 + state.time * 40) % 360;
      const flip = (i + j) % 2 === 0;

      triangles.push(
        path({
          x, y,
          pathData: flip 
            ? `M 0 0 L ${size} 0 L ${size / 2} ${size * 0.866} Z`
            : `M 0 ${size * 0.866} L ${size} ${size * 0.866} L ${size / 2} 0 Z`,
          fill: `hsl(${hue}, 70%, 60%)`,
          stroke: '#000',
          strokeWidth: 1,
          opacity: 0.8
        })
      );
    }
  }

  return group({ x: 0, y: 0 }, triangles);
}
