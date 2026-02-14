// Demo Gallery Framework
import { ImmediateRenderer } from '../dist/index.js';

// Demo registry
const demos = [];
let currentDemo = null;
let renderer = null;
let animationId = null;
let canvas = null;

// UI Elements
let demoListEl, demoNameEl, demoDescEl, codePanelEl, codeContentEl, statsOverlayEl;

// Initialize gallery
async function init() {
  canvas = document.getElementById('canvas');
  demoListEl = document.getElementById('demo-list');
  demoNameEl = document.getElementById('demo-name');
  demoDescEl = document.getElementById('demo-description');
  codePanelEl = document.getElementById('codePanel');
  codeContentEl = document.getElementById('codeContent');
  statsOverlayEl = document.getElementById('statsOverlay');

  // Setup controls
  document.getElementById('toggleCode').addEventListener('click', toggleCodePanel);
  document.getElementById('toggleStats').addEventListener('click', toggleStats);
  document.getElementById('resetDemo').addEventListener('click', resetDemo);

  // Load all demos
  await loadDemos();
  
  // Render demo list
  renderDemoList();
  
  // Load first demo
  if (demos.length > 0) {
    loadDemo(demos[0]);
  }
}

// Load all demo modules
async function loadDemos() {
  const demoModules = [
    { path: './demos/bar-chart.js', category: 'data-viz' },
    { path: './demos/line-chart.js', category: 'data-viz' },
    { path: './demos/pie-chart.js', category: 'data-viz' },
    { path: './demos/scatter-plot.js', category: 'data-viz' },
    { path: './demos/gauge.js', category: 'data-viz' },
    { path: './demos/kanban.js', category: 'productivity' },
    { path: './demos/mind-map.js', category: 'productivity' },
    { path: './demos/particles.js', category: 'creative' },
    { path: './demos/patterns.js', category: 'creative' },
    { path: './demos/clock.js', category: 'creative' },
    { path: './demos/color-picker.js', category: 'ui' },
    { path: './demos/snake.js', category: 'games' },
  ];

  for (const { path, category } of demoModules) {
    try {
      const module = await import(path);
      if (module.demo) {
        demos.push({ ...module.demo, category });
      }
    } catch (err) {
      console.warn(`Failed to load demo: ${path}`, err);
    }
  }
}

// Render demo list in sidebar
function renderDemoList() {
  const categories = {
    'data-viz': { name: 'Data Visualization', icon: '📊' },
    'productivity': { name: 'Productivity', icon: '📋' },
    'creative': { name: 'Creative', icon: '🎨' },
    'ui': { name: 'UI Components', icon: '🎛️' },
    'games': { name: 'Interactive', icon: '🎮' }
  };

  let html = '';
  for (const [catKey, catInfo] of Object.entries(categories)) {
    const categoryDemos = demos.filter(d => d.category === catKey);
    if (categoryDemos.length === 0) continue;

    html += `<div class="category">${catInfo.name}</div>`;
    
    for (const demo of categoryDemos) {
      html += `
        <div class="demo-item" data-demo-id="${demo.id}">
          <span class="icon">${catInfo.icon}</span>
          <div class="info">
            <div class="name">${demo.name}</div>
            <div class="desc">${demo.description}</div>
          </div>
        </div>
      `;
    }
  }

  demoListEl.innerHTML = html;

  // Add click handlers
  document.querySelectorAll('.demo-item').forEach(item => {
    item.addEventListener('click', () => {
      const demoId = item.dataset.demoId;
      const demo = demos.find(d => d.id === demoId);
      if (demo) loadDemo(demo);
    });
  });
}

// Load and run a demo
function loadDemo(demo) {
  // Cleanup previous demo
  if (currentDemo && currentDemo.cleanup) {
    currentDemo.cleanup();
  }
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  if (renderer) {
    renderer.destroy();
  }

  // Update UI
  demoNameEl.textContent = demo.name;
  demoDescEl.textContent = demo.description;
  codeContentEl.textContent = demo.code || '// Code not available';

  // Highlight active demo
  document.querySelectorAll('.demo-item').forEach(item => {
    item.classList.toggle('active', item.dataset.demoId === demo.id);
  });

  // Initialize renderer
  const size = demo.size || { width: 800, height: 600 };
  renderer = new ImmediateRenderer({
    canvas,
    width: size.width,
    height: size.height,
    enableCulling: demo.enableCulling !== false
  });

  // Initialize demo
  currentDemo = demo;
  const state = demo.init(renderer);

  // Animation loop
  let lastTime = performance.now();
  function animate() {
    const currentTime = performance.now();
    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Update demo state
    if (demo.update) {
      demo.update(state, dt);
    }

    // Render
    const scene = demo.render(state);
    renderer.render(scene);

    // Update stats
    updateStats();

    animationId = requestAnimationFrame(animate);
  }

  animate();
}

// Update performance stats
function updateStats() {
  if (!renderer) return;
  const stats = renderer.getPerformanceStats();
  document.getElementById('statFPS').textContent = stats.fps || 0;
  document.getElementById('statBlocks').textContent = stats.blocksRendered.toLocaleString();
  document.getElementById('statCulled').textContent = stats.blocksCulled.toLocaleString();
  document.getElementById('statRenderTime').textContent = stats.renderTime.toFixed(2);
}

// UI Controls
function toggleCodePanel() {
  codePanelEl.classList.toggle('hidden');
}

function toggleStats() {
  statsOverlayEl.style.display = 
    statsOverlayEl.style.display === 'none' ? 'block' : 'none';
}

function resetDemo() {
  if (currentDemo) {
    loadDemo(currentDemo);
  }
}

// Start gallery
init();
