// Copyright (c) 2026 François Rouaix

// Pie Chart Demo
import { group, rectangle, text, arc, circle } from 'vitrine';

export const demo = {
  id: 'pie-chart',
  name: 'Pie Chart',
  description: 'Interactive pie segments with click actions',
  
  init: () => {
    return {
      data: [
        { label: 'Product A', value: 35, color: '#ff6b6b' },
        { label: 'Product B', value: 25, color: '#4dabf7' },
        { label: 'Product C', value: 20, color: '#51cf66' },
        { label: 'Product D', value: 15, color: '#ffd43b' },
        { label: 'Product E', value: 5, color: '#ff8787' }
      ],
      hoveredIndex: -1,
      selectedIndex: -1,
      rotation: 0
    };
  },

  update: (state, dt) => {
    state.rotation += dt * 0.2;
  },

  render: (state) => {
    const centerX = 300;
    const centerY = 300;
    const radius = 150;
    const total = state.data.reduce((sum, d) => sum + d.value, 0);

    let currentAngle = -Math.PI / 2 + state.rotation;
    const segments = [];
    const labels = [];

    state.data.forEach((item, i) => {
      const angle = (item.value / total) * Math.PI * 2;
      const endAngle = currentAngle + angle;
      const midAngle = currentAngle + angle / 2;
      
      const isHovered = state.hoveredIndex === i;
      const isSelected = state.selectedIndex === i;
      const offset = (isHovered || isSelected) ? 15 : 0;

      const offsetX = Math.cos(midAngle) * offset;
      const offsetY = Math.sin(midAngle) * offset;

      segments.push(
        group({ x: centerX + offsetX, y: centerY + offsetY }, [
          arc({
            radius,
            startAngle: currentAngle,
            endAngle: endAngle,
            fill: item.color,
            stroke: '#000',
            strokeWidth: 2,
            opacity: isHovered ? 1 : 0.9,
            onHover: () => { state.hoveredIndex = i; },
            onClick: () => { 
              state.selectedIndex = state.selectedIndex === i ? -1 : i;
              console.log(`Selected: ${item.label}`);
            }
          })
        ])
      );

      // Label
      const labelRadius = radius + 40;
      const labelX = centerX + Math.cos(midAngle) * labelRadius;
      const labelY = centerY + Math.sin(midAngle) * labelRadius;

      labels.push(
        group({ x: labelX, y: labelY }, [
          text({
            text: item.label,
            fontSize: 14,
            fill: item.color,
            align: 'center',
            baseline: 'middle'
          }),
          text({
            y: 18,
            text: `${item.value}%`,
            fontSize: 12,
            fill: '#aaa',
            align: 'center',
            baseline: 'middle'
          })
        ])
      );

      currentAngle = endAngle;
    });

    return group({ x: 0, y: 0 }, [
      rectangle({ dx: 800, dy: 600, fill: '#0a0a0a' }),

      text({
        x: 400,
        y: 30,
        text: 'Sales Distribution',
        fontSize: 24,
        fill: '#e0e0e0',
        align: 'center'
      }),

      // Center circle (donut effect)
      circle({
        x: centerX,
        y: centerY,
        radius: 60,
        fill: '#0a0a0a',
        stroke: '#333',
        strokeWidth: 2
      }),

      text({
        x: centerX,
        y: centerY,
        text: 'Total',
        fontSize: 14,
        fill: '#666',
        align: 'center',
        baseline: 'middle'
      }),

      text({
        x: centerX,
        y: centerY + 20,
        text: '100%',
        fontSize: 20,
        fill: '#e0e0e0',
        align: 'center',
        baseline: 'middle'
      }),

      ...segments,
      ...labels,

      // Legend
      ...state.data.map((item, i) => 
        group({ x: 550, y: 150 + i * 40 }, [
          rectangle({
            dx: 20,
            dy: 20,
            fill: item.color,
            cornerRadius: 4
          }),
          text({
            x: 30,
            y: 10,
            text: `${item.label} (${item.value}%)`,
            fontSize: 14,
            fill: '#e0e0e0',
            baseline: 'middle'
          })
        ])
      )
    ]);
  },

  code: `// Interactive pie chart
data.forEach((item, i) => {
  const angle = (item.value / total) * Math.PI * 2;
  
  return arc({
    radius: 150,
    startAngle: currentAngle,
    endAngle: currentAngle + angle,
    fill: item.color,
    onHover: () => highlight(i),
    onClick: () => select(i)
  });
});`
};
