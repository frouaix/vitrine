// Copyright (c) 2026 François Rouaix

// Demo Gallery Framework
import { ImmediateRenderer } from 'vitrine';

interface DemoDefinition<S = unknown> {
  id: string;
  name: string;
  description: string;
  category?: string;
  code?: string;
  size?: { width: number; height: number };
  enableCulling?: boolean;
  init: (renderer: ImmediateRenderer) => S;
  update?: (state: S, dt: number) => void;
  render: (state: S) => unknown;
  cleanup?: () => void;
}

type GalleryDemo = DemoDefinition<unknown> & { category: string };

function getRequiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }
  return element as T;
}

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
import { demo as lineStylesDemo } from './demos/line-styles.ts';
import { demo as gradientsDemo } from './demos/gradients.ts';

// Demo registry
const demos: GalleryDemo[] = [
  { ...barChartDemo, category: 'data-viz' },
  { ...lineChartDemo, category: 'data-viz' },
  { ...pieChartDemo, category: 'data-viz' },
  { ...scatterPlotDemo, category: 'data-viz' },
  { ...gaugeDemo, category: 'data-viz' },
  { ...kanbanDemo, category: 'productivity' },
  { ...mindMapDemo, category: 'productivity' },
  { ...particlesDemo, category: 'creative' },
  { ...patternsDemo, category: 'creative' },
  { ...lineStylesDemo, category: 'creative' },
  { ...gradientsDemo, category: 'creative' },
  { ...clockDemo, category: 'creative' },
  { ...colorPickerDemo, category: 'ui' },
  { ...guiFormDemo, category: 'ui' },
  { ...guiDashboardDemo, category: 'ui' },
  { ...guiGalleryDemo, category: 'ui' },
  { ...snakeDemo, category: 'games' }
] as GalleryDemo[];

let currentDemo: GalleryDemo | null = null;
let renderer: ImmediateRenderer | null = null;
let animationId: number | null = null;
let canvas: HTMLCanvasElement;
let debugHoverOutline = false;

// UI Elements
let demoListEl: HTMLElement;
let demoNameEl: HTMLElement;
let demoDescEl: HTMLElement;
let codePanelEl: HTMLElement;
let codeContentEl: HTMLElement;
let statsOverlayEl: HTMLElement;

// Initialize gallery
function init() {
  canvas = getRequiredElement<HTMLCanvasElement>('canvas');
  demoListEl = getRequiredElement<HTMLElement>('demo-list');
  demoNameEl = getRequiredElement<HTMLElement>('demo-name');
  demoDescEl = getRequiredElement<HTMLElement>('demo-description');
  codePanelEl = getRequiredElement<HTMLElement>('codePanel');
  codeContentEl = getRequiredElement<HTMLElement>('codeContent');
  statsOverlayEl = getRequiredElement<HTMLElement>('statsOverlay');

  // Setup controls
  getRequiredElement<HTMLElement>('toggleCode').addEventListener('click', toggleCodePanel);
  getRequiredElement<HTMLElement>('toggleStats').addEventListener('click', toggleStats);
  getRequiredElement<HTMLElement>('resetDemo').addEventListener('click', resetDemo);
  getRequiredElement<HTMLElement>('toggleDebugHover').addEventListener('click', toggleDebugHover);

  // Hamburger toggle for mobile sidebar
  const sidebarEl = getRequiredElement<HTMLElement>('sidebar');
  const backdropEl = getRequiredElement<HTMLElement>('sidebarBackdrop');
  const hamburgerEl = getRequiredElement<HTMLElement>('hamburger');

  const closeSidebar = () => {
    sidebarEl.classList.remove('open');
    backdropEl.classList.remove('visible');
  };

  hamburgerEl.addEventListener('click', () => {
    const isOpen = sidebarEl.classList.toggle('open');
    backdropEl.classList.toggle('visible', isOpen);
  });
  backdropEl.addEventListener('click', closeSidebar);

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
  document.querySelectorAll<HTMLElement>('.demo-item').forEach(item => {
    item.addEventListener('click', () => {
      const demoId = item.dataset.demoId;
      const demo = demos.find(d => d.id === demoId);
      if (demo) {
        loadDemo(demo);
        // Close sidebar on mobile
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebarBackdrop')?.classList.remove('visible');
      }
    });
  });
}

// Load and run a demo
function loadDemo(demo: GalleryDemo): void {
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
  document.querySelectorAll<HTMLElement>('.demo-item').forEach(item => {
    item.classList.toggle('active', item.dataset.demoId === demo.id);
  });

  // Initialize renderer
  const size = demo.size || { width: 800, height: 600 };
  renderer = new ImmediateRenderer({
    canvas,
    width: size.width,
    height: size.height,
    enableCulling: demo.enableCulling !== false,
    enableCameraControls: true,
    debugHoverOutline
  });

  syncDebugHoverButton();

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
    renderer!.render(renderer!.camera([scene]));

    // Update stats
    updateStats();

    animationId = requestAnimationFrame(animate);
  }

  animate();
}

// Update performance stats
function updateStats(): void {
  if (!renderer) return;
  const stats = renderer.getPerformanceStats();
  getRequiredElement<HTMLElement>('statFPS').textContent = String(stats.fps || 0);
  getRequiredElement<HTMLElement>('statBlocks').textContent = stats.blocksRendered.toLocaleString();
  getRequiredElement<HTMLElement>('statCulled').textContent = stats.blocksCulled.toLocaleString();
  getRequiredElement<HTMLElement>('statRenderTime').textContent = stats.renderTime.toFixed(2);
}

// UI Controls
function toggleCodePanel(): void {
  codePanelEl.classList.toggle('hidden');
}

function toggleStats(): void {
  statsOverlayEl.style.display = 
    statsOverlayEl.style.display === 'none' ? 'block' : 'none';
}

function resetDemo(): void {
  if (currentDemo) {
    loadDemo(currentDemo);
  }
}

function toggleDebugHover(): void {
  debugHoverOutline = !debugHoverOutline;

  if (renderer) {
    renderer.setDebugHoverOutline(debugHoverOutline);
  }

  syncDebugHoverButton();
}

function syncDebugHoverButton(): void {
  const button = getRequiredElement<HTMLElement>('toggleDebugHover');
  button.textContent = `Debug Hover: ${debugHoverOutline ? 'ON' : 'OFF'}`;
}

// Start gallery
init();
