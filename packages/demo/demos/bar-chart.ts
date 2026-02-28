// Copyright (c) 2026 François Rouaix

// Bar Chart Demo
import { group, rectangle, text, line } from 'vitrine';

export const demo = {
  id: 'bar-chart',
  name: 'Bar Chart',
  description: 'Animated bar chart with hover tooltips',
  
  init: () => {
    return {
      data: [
        { label: 'Jan', value: 45, color: '#ff6b6b' },
        { label: 'Feb', value: 62, color: '#4dabf7' },
        { label: 'Mar', value: 38, color: '#51cf66' },
        { label: 'Apr', value: 71, color: '#ffd43b' },
        { label: 'May', value: 55, color: '#ff8787' },
        { label: 'Jun', value: 82, color: '#a9e34b' },
        { label: 'Jul', value: 68, color: '#ff6b6b' },
        { label: 'Aug', value: 91, color: '#4dabf7' },
        { label: 'Sep', value: 77, color: '#51cf66' },
        { label: 'Oct', value: 64, color: '#ffd43b' },
        { label: 'Nov', value: 53, color: '#ff8787' },
        { label: 'Dec', value: 88, color: '#a9e34b' }
      ],
      animatedValues: Array(12).fill(0),
      hoveredIndex: -1,
      time: 0
    };
  },

  update: (state, dt) => {
    state.time += dt;
    
    // Animate bars growing
    for (let i = 0; i < state.data.length; i++) {
      const target = state.data[i].value;
      const current = state.animatedValues[i];
      const speed = 2;
      state.animatedValues[i] += (target - current) * speed * dt;
    }
  },

  render: (state) => {
    const padding = 60;
    const dxChart = 800 - padding * 2;
    const dyChart = 500;
    const maxValue = 100;
    const dxBar = dxChart / state.data.length;

    const bars = state.data.map((item, i) => {
      const dyBar = (state.animatedValues[i] / maxValue) * dyChart;
      const x = padding + i * dxBar;
      const y = 550 - dyBar;
      const isHovered = state.hoveredIndex === i;

      return group({ x, y }, [
        // Bar
        rectangle({
          dx: dxBar - 10,
          dy: dyBar,
          fill: item.color,
          opacity: isHovered ? 1 : 0.8,
          cornerRadius: 4,
          onHover: () => { state.hoveredIndex = i; },
          onClick: () => console.log(`Clicked: ${item.label}`),
          tooltip: () => `${item.label}: ${item.value} units\n${Math.round(item.value / 100 * 100)}% of target`
        }),

        // Value label on hover
        ...(isHovered ? [
          text({
            x: (dxBar - 10) / 2,
            y: -10,
            text: item.value.toString(),
            fontSize: 14,
            fill: '#fff',
            align: 'center'
          })
        ] : []),

        // X-axis label
        text({
          x: (dxBar - 10) / 2,
          y: dyBar + 20,
          text: item.label,
          fontSize: 12,
          fill: '#aaa',
          align: 'center'
        })
      ]);
    });

    return group({ x: 0, y: 0 }, [
      // Background
      rectangle({ dx: 800, dy: 600, fill: '#1a1a1a' }),

      // Title
      text({
        x: 400,
        y: 30,
        text: 'Monthly Sales Data',
        fontSize: 24,
        fill: '#e0e0e0',
        align: 'center'
      }),

      // Y-axis
      line({
        x1: padding,
        y1: 50,
        x2: padding,
        y2: 550,
        stroke: '#333',
        strokeWidth: 2
      }),

      // X-axis
      line({
        x1: padding,
        y1: 550,
        x2: 800 - padding,
        y2: 550,
        stroke: '#333',
        strokeWidth: 2
      }),

      // Grid lines
      ...Array.from({ length: 5 }, (_, i) => {
        const y = 550 - (dyChart / 4) * i;
        return group({ x: 0, y: 0 }, [
          line({
            x1: padding,
            y1: y,
            x2: 800 - padding,
            y2: y,
            stroke: '#222',
            strokeWidth: 1
          }),
          text({
            x: padding - 10,
            y: y,
            text: (i * 25).toString(),
            fontSize: 11,
            fill: '#666',
            align: 'right',
            baseline: 'middle'
          })
        ]);
      }),

      // Bars
      ...bars
    ]);
  },

  code: `// Bar Chart with animation and hover
const data = [...]; // Monthly sales data

state.data.map((item, i) => {
  const dyBar = (value / maxValue) * dyChart;
  
  return rectangle({
    dx: dxBar,
    dy: dyBar,
    fill: item.color,
    opacity: isHovered ? 1 : 0.8,
    onHover: () => highlightBar(i)
  });
});`
};
