import { group, rectangle, text } from 'vitrine';

export const SCENE_WIDTH = 800;
export const SCENE_HEIGHT = 600;

export const SELECTION_CONFIG = {
  enabled: true,
  caretColor: '#dc2626',
  selectionColor: 'rgba(59, 130, 246, 0.05)',
  caretWidth: 2,
};

export const COMPONENT_OPTIONS = {
  width: SCENE_WIDTH,
  height: SCENE_HEIGHT,
  renderMode: 'auto',
  selectionConfig: SELECTION_CONFIG,
};

export function buildScene() {
  return group({}, [
    rectangle({ dx: SCENE_WIDTH, dy: SCENE_HEIGHT, fill: '#ffffff' }),

    text({
      id: 'text1',
      x: 40,
      y: 60,
      text: 'Click and drag to select this text block',
      fontSize: 18,
      fill: '#0f172a',
      baseline: 'top',
    }),

    text({
      id: 'text2',
      x: 40,
      y: 140,
      text: 'Multiple selections with different colors are supported for collaborative editing',
      fontSize: 16,
      fill: '#475569',
      baseline: 'top',
    }),

    text({
      x: 40,
      y: 240,
      text: 'Instructions:',
      fontSize: 14,
      fill: '#334155',
      baseline: 'top',
      fontWeight: 'bold',
    }),

    text({
      x: 40,
      y: 275,
      text: '1. Click above to place a caret',
      fontSize: 13,
      fill: '#64748b',
      baseline: 'top',
    }),

    text({
      x: 40,
      y: 305,
      text: '2. Drag to create a selection range',
      fontSize: 13,
      fill: '#64748b',
      baseline: 'top',
    }),

    text({
      x: 40,
      y: 335,
      text: '3. Use controls below to add selections for other users',
      fontSize: 13,
      fill: '#64748b',
      baseline: 'top',
    }),

    text({
      x: 40,
      y: 400,
      text: 'Caret: █  | Selection: ▮▮▮',
      fontSize: 14,
      fill: '#2563eb',
      baseline: 'top',
    }),
  ]);
}
