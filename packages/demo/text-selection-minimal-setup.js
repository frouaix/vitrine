import { VitrineComponent } from 'vitrine-gui';
import {
  buildMinimalScene,
  MINIMAL_TEST_TEXT,
  MINIMAL_TEXT_BLOCK_ID,
} from './text-selection-minimal-scene.js';

const logEl = document.getElementById('log');
let selectionManager = null;

function log(msg) {
  logEl.textContent += `${msg}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

function clearLog() {
  logEl.textContent = '';
}

const component = VitrineComponent.block(buildMinimalScene, {
  width: 800,
  height: 400,
  renderMode: 'auto',
  selectionConfig: {
    enabled: true,
    caretColor: '#ff0000',
    selectionColor: 'rgba(0, 0, 255, 0.3)',
    caretWidth: 3,
  }
});

const canvas = document.getElementById('canvas');
component.mount(canvas);
selectionManager = component.getSelectionManager();

setTimeout(() => {
  const actualCanvas = canvas.querySelector('canvas');
  if (actualCanvas) {
    actualCanvas.addEventListener('click', (e) => {
      clearLog();

      const rect = actualCanvas.getBoundingClientRect();
      const dxcCanvas = actualCanvas.width;
      const dycCanvas = actualCanvas.height;
      const dxwCanvas = rect.width;
      const dywCanvas = rect.height;

      log('=== CANVAS INFORMATION ===');
      log(`Buffer size: ${dxcCanvas} x ${dycCanvas}`);
      log(`Display size: ${Math.round(dxwCanvas)} x ${Math.round(dywCanvas)}`);
      log(`Scale factor: ${(dxcCanvas / dxwCanvas).toFixed(3)} x ${(dycCanvas / dywCanvas).toFixed(3)}`);

      log('\n=== CLICK EVENT ===');
      log(`clientX: ${e.clientX.toFixed(0)}`);
      log(`clientY: ${e.clientY.toFixed(0)}`);
      log(`rect.left: ${rect.left.toFixed(0)}`);
      log(`rect.top: ${rect.top.toFixed(0)}`);

      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      log('\n=== SCREEN COORDINATES (CSS px) ===');
      log(`screenX: ${screenX.toFixed(1)}`);
      log(`screenY: ${screenY.toFixed(1)}`);

      const scaleX = dxcCanvas / dxwCanvas;
      const scaleY = dycCanvas / dywCanvas;
      const bufferX = screenX * scaleX;
      const bufferY = screenY * scaleY;

      log('\n=== CANVAS BUFFER COORDINATES ===');
      log(`bufferX: ${bufferX.toFixed(1)}`);
      log(`bufferY: ${bufferY.toFixed(1)}`);

      if (selectionManager) {
        log('\n=== HIT-TESTING ===');
        const charIndex = selectionManager.hitTestBlockCharacter(MINIMAL_TEXT_BLOCK_ID, screenX, screenY);
        if (charIndex !== null) {
          log(`✓ Hit! Character index: ${charIndex}`);
          const sel = selectionManager.getSelection();
          if (sel) {
            log(`Selection: anchor=${sel.anchor}, focus=${sel.focus}`);
            log(`Block: ${sel.blockId}`);
            log(`\nCharacter: "${MINIMAL_TEST_TEXT.charAt(charIndex)}"`);
            log(`Substring [0..${charIndex}]: "${MINIMAL_TEST_TEXT.substring(0, charIndex)}"`);
            log(`Substring [0..${charIndex + 1}]: "${MINIMAL_TEST_TEXT.substring(0, charIndex + 1)}"`);
          }
        } else {
          log('✗ No hit on testText block');
        }
      }
    });
  }
}, 100);
