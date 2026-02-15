// Copyright (c) 2026 François Rouaix

// Kanban Board Demo
import { group, rectangle, text } from 'vitrine';

export const demo = {
  id: 'kanban',
  name: 'Kanban Board',
  description: 'Draggable task cards between columns',
  
  init: () => {
    return {
      columns: [
        { id: 'todo', title: 'To Do', color: '#ff6b6b' },
        { id: 'progress', title: 'In Progress', color: '#ffd43b' },
        { id: 'done', title: 'Done', color: '#51cf66' }
      ],
      cards: [
        { id: 1, column: 'todo', title: 'Design mockups', desc: 'Create UI designs' },
        { id: 2, column: 'todo', title: 'API integration', desc: 'Connect backend' },
        { id: 3, column: 'progress', title: 'User auth', desc: 'Login system' },
        { id: 4, column: 'progress', title: 'Database schema', desc: 'Define models' },
        { id: 5, column: 'done', title: 'Project setup', desc: 'Initialize repo' }
      ],
      draggedCard: null,
      hoveredColumn: null
    };
  },

  update: (state, dt) => {
    // Animation could go here
  },

  render: (state) => {
    const dxColumn = 240;
    const columnSpacing = 20;
    const startX = 40;

    const columns = state.columns.map((col, colIndex) => {
      const x = startX + colIndex * (dxColumn + columnSpacing);
      const cardsInColumn = state.cards.filter(c => c.column === col.id);

      return group({ x, y: 100 }, [
        // Column header
        rectangle({
          dx: dxColumn,
          dy: 60,
          fill: col.color,
          cornerRadius: 8
        }),

        text({
          x: dxColumn / 2,
          y: 20,
          text: col.title,
          fontSize: 16,
          fill: '#fff',
          align: 'center',
          baseline: 'middle'
        }),

        text({
          x: dxColumn / 2,
          y: 40,
          text: `${cardsInColumn.length} tasks`,
          fontSize: 12,
          fill: 'rgba(255,255,255,0.7)',
          align: 'center',
          baseline: 'middle'
        }),

        // Column body
        rectangle({
          y: 70,
          dx: dxColumn,
          dy: 400,
          fill: '#1a1a1a',
          stroke: '#333',
          strokeWidth: 2,
          cornerRadius: 8,
          onHover: () => { state.hoveredColumn = col.id; }
        }),

        // Cards
        ...cardsInColumn.map((card, cardIndex) => 
          group({ y: 80 + cardIndex * 110 }, [
            rectangle({
              dx: dxColumn - 20,
              x: 10,
              dy: 100,
              fill: '#2a2a2a',
              stroke: '#444',
              strokeWidth: 2,
              cornerRadius: 6,
              onPointerDown: () => { state.draggedCard = card.id; },
              onClick: () => console.log(`Card: ${card.title}`)
            }),

            text({
              x: 20,
              y: 20,
              text: card.title,
              fontSize: 14,
              fill: '#e0e0e0'
            }),

            text({
              x: 20,
              y: 45,
              text: card.desc,
              fontSize: 11,
              fill: '#888'
            }),

            // Card footer
            rectangle({
              x: 10,
              y: 70,
              dx: dxColumn - 20,
              dy: 1,
              fill: '#444'
            }),

            text({
              x: 20,
              y: 85,
              text: `#${card.id}`,
              fontSize: 10,
              fill: '#666'
            })
          ])
        )
      ]);
    });

    return group({ x: 0, y: 0 }, [
      rectangle({ dx: 800, dy: 600, fill: '#0a0a0a' }),

      text({
        x: 400,
        y: 40,
        text: 'Project Task Board',
        fontSize: 24,
        fill: '#e0e0e0',
        align: 'center'
      }),

      ...columns,

      // Instructions
      text({
        x: 400,
        y: 570,
        text: 'Click cards to view details • Drag to move between columns',
        fontSize: 12,
        fill: '#666',
        align: 'center'
      })
    ]);
  },

  code: `// Kanban board with draggable cards
columns.map(col => {
  const cards = getCardsInColumn(col.id);
  
  return group({ x: colX }, [
    columnHeader(col),
    ...cards.map(card => 
      cardComponent({
        onDrag: () => moveCard(card, col)
      })
    )
  ]);
});`
};
