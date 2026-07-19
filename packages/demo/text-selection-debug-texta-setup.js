import { VitrineComponent } from 'vitrine-gui';
import { registerTextaBlockType } from 'texta/browser';
import { buildDebugTextaScene, DEBUG_TEXTA_BLOCK_IDS } from './text-selection-debug-texta-scene.js';

registerTextaBlockType();

let selectionManager = null;
const debugInfo = document.getElementById('debugInfo');
const fpsEl = document.getElementById('fps');
const avgFpsEl = document.getElementById('avgFps');
const renderTimeEl = document.getElementById('renderTime');
const blocksRenderedEl = document.getElementById('blocksRendered');
const textaCacheEntriesEl = document.getElementById('textaCacheEntries');
const textaCacheHitRateEl = document.getElementById('textaCacheHitRate');
const textaCacheHitsEl = document.getElementById('textaCacheHits');
const textaCacheMissesEl = document.getElementById('textaCacheMisses');
const textaLayoutBuildsEl = document.getElementById('textaLayoutBuilds');
const textaCharacterBoundsBuildsEl = document.getElementById('textaCharacterBoundsBuilds');
const textaSelectionResolvesEl = document.getElementById('textaSelectionResolves');
const cacheFontsEl = document.getElementById('cacheFonts');
const cacheEntriesEl = document.getElementById('cacheEntries');

function formatInteger(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString()
    : '0';
}

function formatDecimal(value, digits = 1) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(digits)
    : '0.0';
}

function getHookMetric(hooks, hookName, metricName) {
  const hook = hooks?.[hookName];
  const value = hook?.[metricName];
  return typeof value === 'number' ? value : 0;
}

function updateCacheStats() {
  const stats = component.getPerformanceStats();
  if (!stats) {
    return;
  }

  fpsEl.textContent = formatInteger(stats.fps);
  avgFpsEl.textContent = formatInteger(stats.averageFPS);
  renderTimeEl.textContent = formatDecimal(stats.renderTime, 2);
  blocksRenderedEl.textContent = formatInteger(stats.blocksRendered);

  const textaEntries = getHookMetric(stats.hooks, 'textaLayoutCache', 'cacheEntries');
  const textaHitRate = getHookMetric(stats.hooks, 'textaLayoutCache', 'hitRatePercent');
  const textaHits = getHookMetric(stats.hooks, 'textaLayoutCache', 'cacheHits');
  const textaMisses = getHookMetric(stats.hooks, 'textaLayoutCache', 'cacheMisses');
  const textaLayoutBuilds = getHookMetric(stats.hooks, 'textaLayoutCache', 'layoutBuilds');
  const textaCharacterBoundsBuilds = getHookMetric(stats.hooks, 'textaLayoutCache', 'characterBoundsBuilds');
  const textaSelectionResolves = getHookMetric(stats.hooks, 'textaLayoutCache', 'selectionGeometryResolveCalls');

  textaCacheEntriesEl.textContent = formatInteger(textaEntries);
  textaCacheHitRateEl.textContent = `${formatDecimal(textaHitRate, 1)}%`;
  textaCacheHitsEl.textContent = formatInteger(textaHits);
  textaCacheMissesEl.textContent = formatInteger(textaMisses);
  textaLayoutBuildsEl.textContent = formatInteger(textaLayoutBuilds);
  textaCharacterBoundsBuildsEl.textContent = formatInteger(textaCharacterBoundsBuilds);
  textaSelectionResolvesEl.textContent = formatInteger(textaSelectionResolves);

  const glyphFonts = getHookMetric(stats.hooks, 'textLayoutCache', 'fontsInGlyphCache');
  const prefixFonts = getHookMetric(stats.hooks, 'textLayoutCache', 'fontsInPrefixCache');
  const measureFonts = getHookMetric(stats.hooks, 'textLayoutCache', 'fontsInMeasureCache');
  const glyphEntries = getHookMetric(stats.hooks, 'textLayoutCache', 'glyphEntries');
  const prefixEntries = getHookMetric(stats.hooks, 'textLayoutCache', 'prefixEntries');
  const measureEntries = getHookMetric(stats.hooks, 'textLayoutCache', 'measureEntries');

  cacheFontsEl.textContent = `${formatInteger(glyphFonts)} / ${formatInteger(prefixFonts)} / ${formatInteger(measureFonts)}`;
  cacheEntriesEl.textContent = `${formatInteger(glyphEntries)} / ${formatInteger(prefixEntries)} / ${formatInteger(measureEntries)}`;
}

function log(msg) {
  debugInfo.textContent += `${msg}\n`;
  debugInfo.scrollTop = debugInfo.scrollHeight;
}

function clearDebug() {
  debugInfo.textContent = '';
}

const component = VitrineComponent.block(buildDebugTextaScene, {
  width: 1000,
  height: 920,
  renderMode: 'auto',
  selectionConfig: {
    enabled: true,
    caretColor: '#dc2626',
    selectionColor: 'rgba(59, 130, 246, 0.2)',
    caretWidth: 2,
  }
});

const canvas = document.getElementById('canvas');
component.mount(canvas);
selectionManager = component.getSelectionManager();
updateCacheStats();

function refreshStatsLoop() {
  updateCacheStats();
  requestAnimationFrame(refreshStatsLoop);
}
requestAnimationFrame(refreshStatsLoop);

const canvasElem = document.getElementById('canvas').querySelector('canvas');
if (canvasElem) {
  canvasElem.addEventListener('click', (e) => {
    clearDebug();

    const rect = canvasElem.getBoundingClientRect();
    log(`Canvas size: ${canvasElem.width} x ${canvasElem.height}`);
    log(`Display size: ${rect.width} x ${rect.height}`);
    log(`Canvas scale: ${canvasElem.width / rect.width} x ${canvasElem.height / rect.height}`);

    const clientX = e.clientX;
    const clientY = e.clientY;
    log(`\nClient coords: (${clientX}, ${clientY})`);

    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    log(`Screen coords (relative to canvas element): (${screenX.toFixed(1)}, ${screenY.toFixed(1)})`);
    log(`Scene coords (for hit-testing): (${screenX.toFixed(1)}, ${screenY.toFixed(1)})`);

    if (selectionManager) {
      log(`\nHit-testing against blocks: ${DEBUG_TEXTA_BLOCK_IDS.join(', ')}`);

      for (const blockId of DEBUG_TEXTA_BLOCK_IDS) {
        const charIndex = selectionManager.hitTestBlockCharacter(blockId, screenX, screenY);
        if (charIndex !== null) {
          log(`Hit in ${blockId}: insertion index ${charIndex}`);
          const sel = selectionManager.getSelection();
          if (sel) {
            log(`Selection state: block=${sel.blockId}, anchor=${sel.anchor}, focus=${sel.focus}`);
          }
        }
      }
    }

    updateCacheStats();
  });
}
