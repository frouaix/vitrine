// Mind Map Demo
import { group, rectangle, text, circle, line, ellipse } from 'vitrine';

export const demo = {
  id: 'mind-map',
  name: 'Mind Map',
  description: 'Node-based diagram with connections',
  
  init: () => {
    return {
      nodes: [
        { id: 1, x: 400, y: 300, label: 'Main Idea', color: '#4dabf7', level: 0 },
        { id: 2, x: 250, y: 200, label: 'Concept A', color: '#51cf66', level: 1, parent: 1 },
        { id: 3, x: 250, y: 400, label: 'Concept B', color: '#ffd43b', level: 1, parent: 1 },
        { id: 4, x: 550, y: 200, label: 'Concept C', color: '#ff6b6b', level: 1, parent: 1 },
        { id: 5, x: 550, y: 400, label: 'Concept D', color: '#ff8787', level: 1, parent: 1 },
        { id: 6, x: 150, y: 150, label: 'Detail A1', color: '#51cf66', level: 2, parent: 2 },
        { id: 7, x: 150, y: 250, label: 'Detail A2', color: '#51cf66', level: 2, parent: 2 },
        { id: 8, x: 650, y: 150, label: 'Detail C1', color: '#ff6b6b', level: 2, parent: 4 }
      ],
      hoveredNode: null,
      selectedNode: null,
      time: 0
    };
  },

  update: (state, dt) => {
    state.time += dt;
  },

  render: (state) => {
    // Draw connections first (behind nodes)
    const connections = [];
    state.nodes.forEach(node => {
      if (node.parent) {
        const parent = state.nodes.find(n => n.id === node.parent);
        if (parent) {
          connections.push(
            line({
              x1: parent.x,
              y1: parent.y,
              x2: node.x,
              y2: node.y,
              stroke: node.color,
              strokeWidth: 2,
              opacity: 0.5
            })
          );
        }
      }
    });

    // Draw nodes
    const nodeElements = state.nodes.map(node => {
      const isHovered = state.hoveredNode === node.id;
      const isSelected = state.selectedNode === node.id;
      const scale = (isHovered || isSelected) ? 1.1 : 1;
      const radiusX = node.level === 0 ? 80 : 60;
      const radiusY = node.level === 0 ? 50 : 35;

      return group({ 
        x: node.x, 
        y: node.y,
        scaleX: scale,
        scaleY: scale
      }, [
        ellipse({
          radiusX,
          radiusY,
          fill: node.color,
          stroke: isSelected ? '#fff' : node.color,
          strokeWidth: isSelected ? 3 : 0,
          opacity: 0.9,
          onHover: () => { state.hoveredNode = node.id; },
          onClick: () => { 
            state.selectedNode = state.selectedNode === node.id ? null : node.id;
          }
        }),

        text({
          text: node.label,
          fontSize: node.level === 0 ? 16 : 13,
          fill: '#000',
          align: 'center',
          baseline: 'middle'
        })
      ]);
    });

    return group({ x: 0, y: 0 }, [
      rectangle({ dx: 800, dy: 600, fill: '#0a0a0a' }),

      text({
        x: 400,
        y: 30,
        text: 'Interactive Mind Map',
        fontSize: 24,
        fill: '#e0e0e0',
        align: 'center'
      }),

      ...connections,
      ...nodeElements,

      text({
        x: 400,
        y: 570,
        text: 'Click nodes to select • Hover to highlight',
        fontSize: 12,
        fill: '#666',
        align: 'center'
      })
    ]);
  },

  code: `// Mind map with node connections
nodes.map(node => {
  const parent = findParent(node);
  
  return group({}, [
    // Connection line
    line({
      x1: parent.x, y1: parent.y,
      x2: node.x, y2: node.y,
      stroke: node.color
    }),
    
    // Node
    ellipse({
      x: node.x, y: node.y,
      radiusX: 60, radiusY: 35,
      fill: node.color,
      onClick: () => select(node)
    })
  ]);
});`
};
