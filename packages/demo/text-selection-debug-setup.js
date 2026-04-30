import { getTextLayoutCacheStats } from 'vitrine';
import { VitrineComponent } from 'vitrine-gui';
import { buildDebugScene, DEBUG_TEXT_BLOCK_IDS } from './text-selection-debug-scene.js';

let selectionManager = null;
const debugInfo = document.getElementById('debugInfo');
const cacheFontsEl = document.getElementById('cacheFonts');
const cacheEntriesEl = document.getElementById('cacheEntries');

function updateCacheStats() {
  const stats = getTextLayoutCacheStats();
  cacheFontsEl.textContent = `${stats.fontsInGlyphCache.toLocaleString()} / ${stats.fontsInPrefixCache.toLocaleString()} / ${stats.fontsInMeasureCache.toLocaleString()}`;
  cacheEntriesEl.textContent = `${stats.glyphEntries.toLocaleString()} / ${stats.prefixEntries.toLocaleString()} / ${stats.measureEntries.toLocaleString()}`;
}

function log(msg) {
  debugInfo.textContent += `${msg}\n`;
  debugInfo.scrollTop = debugInfo.scrollHeight;
}

function clearDebug() {
  debugInfo.textContent = '';
}

const component = VitrineComponent.block(buildDebugScene, {
  width: 1000,
  height: 900,
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
      log(`\nHit-testing against blocks: ${DEBUG_TEXT_BLOCK_IDS.join(', ')}`);

      for (const blockId of DEBUG_TEXT_BLOCK_IDS) {
        const charIndex = selectionManager.hitTestBlockCharacter(blockId, screenX, screenY);
        if (charIndex !== null) {
          log(`✓ Hit in ${blockId}: character index ${charIndex}`);
          const sel = selectionManager.getSelection();
          log(`Selection updated: anchor=${sel.anchor}, focus=${sel.focus}`);
        }
      }
    }

    updateCacheStats();
  });
}
