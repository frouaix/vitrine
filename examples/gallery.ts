// Demo Gallery Framework
import { ImmediateRenderer, WebGLRenderer } from 'vitrine';

// Import all demos statically
import { demo as barChartDemo } from './demos/bar-chart.ts';
import { demo as lineChartDemo } from './demos/line-chart.ts';
import { demo as pieChartDemo } from './demos/pie-chart.ts';
import { demo as scatterPlotDemo } from './demos/scatter-plot.ts';
import { demo as gaugeDemo } from './demos/gauge.ts';
import { demo as kanbanDemo } from './demos/kanban.ts';
import { demo as mindMapDemo } from './demos/mind-map.ts';
import { demo as particlesDemo } from './demos/particles.ts';
import { demo as patternsDemo } from './demos/patterns.ts';
import { demo as clockDemo } from './demos/clock.ts';
import { demo as colorPickerDemo } from './demos/color-picker.ts';
import { demo as snakeDemo } from './demos/snake.ts';
import { demo as guiFormDemo } from './demos/gui-form.ts';
import { demo as guiDashboardDemo } from './demos/gui-dashboard.ts';
import { demo as guiGalleryDemo } from './demos/gui-gallery.ts';

// Demo registry
const demos = [
  { ...barChartDemo, category: 'data-viz' },
  { ...lineChartDemo, category: 'data-viz' },
  { ...pieChartDemo, category: 'data-viz' },
  { ...scatterPlotDemo, category: 'data-viz' },
  { ...gaugeDemo, category: 'data-viz' },
  { ...kanbanDemo, category: 'productivity' },
  { ...mindMapDemo, category: 'productivity' },
  { ...particlesDemo, category: 'creative' },
  { ...patternsDemo, category: 'creative' },
  { ...clockDemo, category: 'creative' },
  { ...colorPickerDemo, category: 'ui' },
  { ...guiFormDemo, category: 'ui' },
  { ...guiDashboardDemo, category: 'ui' },
  { ...guiGalleryDemo, category: 'ui' },
  { ...snakeDemo, category: 'games' }
];

let currentDemo = null;
let renderer = null;
let animationId = null;
let canvas = null;
let rendererMode = 'canvas2d';

// UI Elements
let demoListEl, demoNameEl, demoDescEl, codePanelEl, codeContentEl, statsOverlayEl;

// Initialize gallery
function init() {
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
  document.getElementById('rendererMode').addEventListener('change', (event) => {
    rendererMode = event.target.value;
    if (currentDemo) {
      loadDemo(currentDemo);
    }
  });

  // Render demo list
  renderDemoList();
  
  // Load first demo
  if (demos.length > 0) {
    loadDemo(demos[0]);
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
    if (renderer.destroy) {
      renderer.destroy();
    }
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
  if (rendererMode === 'webgl') {
    renderer = new WebGLRenderer({
      canvas,
      width: size.width,
      height: size.height
    });
  } else {
    renderer = new ImmediateRenderer({
      canvas,
      width: size.width,
      height: size.height,
      enableCulling: demo.enableCulling !== false
    });
  }

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
