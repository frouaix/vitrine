// Line Chart Demo
import { group, rectangle, text, line, circle } from 'vitrine';

export const demo = {
  id: 'line-chart',
  name: 'Line Chart',
  description: 'Real-time streaming data visualization',
  
  init: () => {
    return {
      dataPoints: Array.from({ length: 50 }, (_, i) => ({
        x: i,
        y: 50 + Math.sin(i * 0.2) * 20 + Math.random() * 10
      })),
      time: 0
    };
  },

  update: (state, dt) => {
    state.time += dt;
    
    // Add new data point every 0.1 seconds
    if (Math.floor(state.time * 10) > state.dataPoints.length - 50) {
      const lastX = state.dataPoints[state.dataPoints.length - 1].x;
      state.dataPoints.push({
        x: lastX + 1,
        y: 50 + Math.sin(lastX * 0.2) * 20 + Math.random() * 10
      });
      
      // Keep only last 50 points
      if (state.dataPoints.length > 50) {
        state.dataPoints.shift();
      }
    }
  },

  render: (state) => {
    const padding = 60;
    const dxChart = 800 - padding * 2;
    const dyChart = 400;
    const scaleX = dxChart / 49;
    const scaleY = dyChart / 100;

    // Create line segments
    const lineSegments = [];
    for (let i = 0; i < state.dataPoints.length - 1; i++) {
      const p1 = state.dataPoints[i];
      const p2 = state.dataPoints[i + 1];
      
      lineSegments.push(
        line({
          x1: padding + i * scaleX,
          y1: 500 - p1.y * scaleY,
          x2: padding + (i + 1) * scaleX,
          y2: 500 - p2.y * scaleY,
          stroke: '#4dabf7',
          strokeWidth: 2
        })
      );
    }

    // Data point circles
    const points = state.dataPoints.map((p, i) => 
      circle({
        x: padding + i * scaleX,
        y: 500 - p.y * scaleY,
        radius: 3,
        fill: '#4dabf7',
        opacity: i === state.dataPoints.length - 1 ? 1 : 0.6
      })
    );

    return group({ x: 0, y: 0 }, [
      rectangle({ dx: 800, dy: 600, fill: '#0a0a0a' }),

      text({
        x: 400,
        y: 30,
        text: 'Real-Time Data Stream',
        fontSize: 24,
        fill: '#e0e0e0',
        align: 'center'
      }),

      // Grid
      ...Array.from({ length: 5 }, (_, i) => {
        const y = 500 - (dyChart / 4) * i;
        return line({
          x1: padding,
          y1: y,
          x2: 800 - padding,
          y2: y,
          stroke: '#222',
          strokeWidth: 1
        });
      }),

      // Axes
      line({ x1: padding, y1: 100, x2: padding, y2: 500, stroke: '#333', strokeWidth: 2 }),
      line({ x1: padding, y1: 500, x2: 800 - padding, y2: 500, stroke: '#333', strokeWidth: 2 }),

      // Line chart
      ...lineSegments,
      ...points,

      // Current value indicator
      text({
        x: 400,
        y: 560,
        text: `Current: ${state.dataPoints[state.dataPoints.length - 1].y.toFixed(1)}`,
        fontSize: 16,
        fill: '#4dabf7',
        align: 'center'
      })
    ]);
  },

  code: `// Real-time line chart
state.dataPoints.map((p, i) => {
  if (i === 0) return null;
  const prev = state.dataPoints[i - 1];
  
  return line({
    x1: prev.x * scaleX,
    y1: prev.y * scaleY,
    x2: p.x * scaleX,
    y2: p.y * scaleY,
    stroke: '#4dabf7',
    strokeWidth: 2
  });
});`
};
