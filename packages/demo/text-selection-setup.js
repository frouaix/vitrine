import { VitrineComponent } from 'vitrine-gui';

import { buildScene, COMPONENT_OPTIONS } from './text-selection-scene.js';

const component = VitrineComponent.block(buildScene, COMPONENT_OPTIONS);
const canvas = document.getElementById('canvas');

component.mount(canvas);

const selectionManager = component.getSelectionManager();

function updateStats() {
  const selections = selectionManager.getAllSelections();
  document.getElementById('selectionCount').textContent = selections.length;

  const list = selections
    .map(
      (sel) =>
        `${sel.userId || 'default'}: [${sel.anchor}, ${sel.focus}) in "${sel.blockId}" ${sel.color ? `color: ${sel.color}` : ''}`,
    )
    .join('\n');

  document.getElementById('selectionList').textContent = list || '(no selections)';
}

window.addSelection = function addSelection() {
  const userId = document.getElementById('userId').value || 'default';
  const startChar = parseInt(document.getElementById('startChar').value) || 0;
  const endChar = parseInt(document.getElementById('endChar').value) || 0;
  const hexColor = document.getElementById('selColor').value;

  selectionManager.setSelection('text1', startChar, endChar, userId);

  const selection = selectionManager.getSelection(userId);
  if (selection) {
    const hex = hexColor.replace('#', '');
    const red = parseInt(hex.substring(0, 2), 16);
    const green = parseInt(hex.substring(2, 4), 16);
    const blue = parseInt(hex.substring(4, 6), 16);

    if (startChar === endChar) {
      selection.color = hexColor;
    } else {
      selection.color = `rgba(${red}, ${green}, ${blue}, 0.2)`;
    }
  }

  updateStats();
};

window.clearAllSelections = function clearAllSelections() {
  selectionManager.clearAllSelections();
  updateStats();
};

updateStats();
