// Particle System Demo
import { group, rectangle, text, circle } from 'vitrine';

export const demo = {
  id: 'particles',
  name: 'Particle System',
  description: 'Thousands of animated particles',
  
  init: () => {
    const particles = Array.from({ length: 2000 }, () => ({
      x: 400 + (Math.random() - 0.5) * 100,
      y: 300 + (Math.random() - 0.5) * 100,
      vx: (Math.random() - 0.5) * 100,
      vy: (Math.random() - 0.5) * 100,
      life: 1,
      size: 2 + Math.random() * 3,
      color: ['#ff6b6b', '#4dabf7', '#51cf66', '#ffd43b'][Math.floor(Math.random() * 4)]
    }));

    return { particles, time: 0, emitterX: 400, emitterY: 300 };
  },

  update: (state, dt) => {
    state.time += dt;

    // Move emitter in a circle
    state.emitterX = 400 + Math.cos(state.time) * 150;
    state.emitterY = 300 + Math.sin(state.time) * 150;

    // Update particles
    state.particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 100 * dt; // Gravity
      p.life -= dt * 0.5;

      // Reset dead particles
      if (p.life <= 0) {
        p.x = state.emitterX;
        p.y = state.emitterY;
        p.vx = (Math.random() - 0.5) * 100;
        p.vy = (Math.random() - 0.5) * 100 - 50;
        p.life = 1;
      }
    });
  },

  render: (state) => {
    const particleElements = state.particles.map(p => 
      circle({
        x: p.x,
        y: p.y,
        radius: p.size,
        fill: p.color,
        opacity: p.life * 0.8
      })
    );

    return group({ x: 0, y: 0 }, [
      rectangle({ dx: 800, dy: 600, fill: '#0a0a0a' }),

      text({
        x: 400,
        y: 30,
        text: `Particle System (${state.particles.length} particles)`,
        fontSize: 24,
        fill: '#e0e0e0',
        align: 'center'
      }),

      ...particleElements,

      // Emitter
      circle({
        x: state.emitterX,
        y: state.emitterY,
        radius: 10,
        fill: '#fff',
        opacity: 0.5
      })
    ]);
  },

  code: `// 2000 particle system with physics
particles.map(p => {
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.vy += gravity * dt;
  
  return circle({
    x: p.x, y: p.y,
    radius: p.size,
    fill: p.color,
    opacity: p.life
  });
});`
};
