// Copyright (c) 2026 François Rouaix

// Snake Game Demo
import { group, rectangle, text, circle } from 'vitrine';

export const demo = {
  id: 'snake',
  name: 'Snake Game',
  description: 'Classic snake game with keyboard controls',
  
  init: () => {
    const gridSize = 20;
    const cellSize = 25;

    const state = {
      gridSize,
      cellSize,
      snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
      direction: { x: 1, y: 0 },
      nextDirection: { x: 1, y: 0 },
      food: { x: 15, y: 10 },
      score: 0,
      gameOver: false,
      moveTimer: 0,
      moveInterval: 0.15
    };

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (state.gameOver) return;
      
      switch(e.key) {
        case 'ArrowUp':
          if (state.direction.y === 0) state.nextDirection = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
          if (state.direction.y === 0) state.nextDirection = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
          if (state.direction.x === 0) state.nextDirection = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
          if (state.direction.x === 0) state.nextDirection = { x: 1, y: 0 };
          break;
        case ' ':
          if (state.gameOver) resetGame(state);
          break;
      }
    });

    return state;
  },

  update: (state, dt) => {
    if (state.gameOver) return;

    state.moveTimer += dt;

    if (state.moveTimer >= state.moveInterval) {
      state.moveTimer = 0;
      state.direction = state.nextDirection;

      // Move snake
      const head = state.snake[0];
      const newHead = {
        x: head.x + state.direction.x,
        y: head.y + state.direction.y
      };

      // Check wall collision
      if (newHead.x < 0 || newHead.x >= state.gridSize ||
          newHead.y < 0 || newHead.y >= state.gridSize) {
        state.gameOver = true;
        return;
      }

      // Check self collision
      if (state.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
        state.gameOver = true;
        return;
      }

      state.snake.unshift(newHead);

      // Check food collision
      if (newHead.x === state.food.x && newHead.y === state.food.y) {
        state.score++;
        placeFood(state);
      } else {
        state.snake.pop();
      }
    }
  },

  render: (state) => {
    const offsetX = 175;
    const offsetY = 50;

    // Grid
    const grid = [];
    for (let i = 0; i < state.gridSize; i++) {
      for (let j = 0; j < state.gridSize; j++) {
        grid.push(
          rectangle({
            x: offsetX + i * state.cellSize,
            y: offsetY + j * state.cellSize,
            dx: state.cellSize - 1,
            dy: state.cellSize - 1,
            fill: '#1a1a1a',
            stroke: '#2a2a2a',
            strokeWidth: 1
          })
        );
      }
    }

    // Snake
    const snakeBlocks = state.snake.map((segment, i) => 
      rectangle({
        x: offsetX + segment.x * state.cellSize,
        y: offsetY + segment.y * state.cellSize,
        dx: state.cellSize - 1,
        dy: state.cellSize - 1,
        fill: i === 0 ? '#51cf66' : '#4dabf7',
        cornerRadius: 3
      })
    );

    // Food
    const foodBlock = circle({
      x: offsetX + state.food.x * state.cellSize + state.cellSize / 2,
      y: offsetY + state.food.y * state.cellSize + state.cellSize / 2,
      radius: state.cellSize / 3,
      fill: '#ff6b6b'
    });

    return group({ x: 0, y: 0 }, [
      rectangle({ dx: 800, dy: 600, fill: '#0a0a0a' }),

      text({
        x: 400,
        y: 25,
        text: 'Snake Game',
        fontSize: 20,
        fill: '#e0e0e0',
        align: 'center'
      }),

      text({
        x: 60,
        y: 250,
        text: 'Score',
        fontSize: 16,
        fill: '#888'
      }),

      text({
        x: 60,
        y: 280,
        text: state.score.toString(),
        fontSize: 32,
        fill: '#51cf66'
      }),

      text({
        x: 60,
        y: 350,
        text: 'Arrow\nKeys',
        fontSize: 14,
        fill: '#666'
      }),

      ...grid,
      ...snakeBlocks,
      foodBlock,

      // Game over overlay
      ...(state.gameOver ? [
        rectangle({
          x: 250,
          y: 250,
          dx: 300,
          dy: 150,
          fill: 'rgba(0, 0, 0, 0.9)',
          stroke: '#ff6b6b',
          strokeWidth: 3,
          cornerRadius: 12
        }),

        text({
          x: 400,
          y: 300,
          text: 'GAME OVER',
          fontSize: 28,
          fill: '#ff6b6b',
          align: 'center',
          baseline: 'middle'
        }),

        text({
          x: 400,
          y: 340,
          text: `Score: ${state.score}`,
          fontSize: 20,
          fill: '#e0e0e0',
          align: 'center',
          baseline: 'middle'
        }),

        text({
          x: 400,
          y: 370,
          text: 'Press SPACE to restart',
          fontSize: 14,
          fill: '#888',
          align: 'center',
          baseline: 'middle'
        })
      ] : [])
    ]);
  },

  cleanup: () => {
    // Remove keyboard listeners if needed
  },

  code: `// Snake game with keyboard controls
window.addEventListener('keydown', (e) => {
  switch(e.key) {
    case 'ArrowUp':
      direction = { x: 0, y: -1 };
      break;
    // ... other directions
  }
});

// Move snake
const head = snake[0];
const newHead = {
  x: head.x + direction.x,
  y: head.y + direction.y
};

snake.unshift(newHead);
if (!ateFood) snake.pop();`
};

function placeFood(state) {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * state.gridSize),
      y: Math.floor(Math.random() * state.gridSize)
    };
  } while (state.snake.some(s => s.x === newFood.x && s.y === newFood.y));
  
  state.food = newFood;
}

function resetGame(state) {
  state.snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  state.direction = { x: 1, y: 0 };
  state.nextDirection = { x: 1, y: 0 };
  state.score = 0;
  state.gameOver = false;
  placeFood(state);
}
