import { group, rectangle, text } from 'vitrine';

export const MINIMAL_TEST_TEXT = 'Click and drag to select';
export const MINIMAL_TEXT_BLOCK_ID = 'testText';

export function buildMinimalScene() {
  return group({}, [
    rectangle({ dx: 800, dy: 400, fill: '#ffffff' }),
    text({
      id: MINIMAL_TEXT_BLOCK_ID,
      x: 50,
      y: 50,
      text: MINIMAL_TEST_TEXT,
      fontSize: 24,
      fill: '#000000',
      baseline: 'top'
    }),
    text({
      x: 50,
      y: 150,
      text: 'Expected character indices:',
      fontSize: 14,
      fill: '#333333',
      baseline: 'top'
    }),
    text({
      x: 50,
      y: 180,
      text: '"Click" = 0-5',
      fontSize: 12,
      fill: '#666666',
      baseline: 'top'
    }),
    text({
      x: 50,
      y: 210,
      text: '"and" = 6-8',
      fontSize: 12,
      fill: '#666666',
      baseline: 'top'
    }),
    text({
      x: 50,
      y: 240,
      text: '"drag" = 10-14',
      fontSize: 12,
      fill: '#666666',
      baseline: 'top'
    }),
  ]);
}
