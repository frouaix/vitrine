import { group, rectangle, text } from 'vitrine';

export const DEBUG_TEXT_BLOCK_IDS = [
  'text1',
  'text2',
  'text3',
  'text4',
  'text5',
  'text6',
  'text7',
  'text8',
  'text9',
  'text10',
  'text11',
  'text12',
  'text13',
];

export function buildDebugScene() {
  return group({}, [
    rectangle({ dx: 1000, dy: 900, fill: '#ffffff' }),
    text({
      id: 'text1',
      x: 40,
      y: 30,
      text: 'Single-line text (18px)',
      font: 'bold 18px sans-serif',
      fontSize: 18,
      fill: '#0f172a',
      baseline: 'top'
    }),
    text({
      id: 'text2',
      x: 40,
      y: 70,
      text: 'Smaller single-line text (12px)',
      fontSize: 12,
      fill: '#475569',
      baseline: 'top'
    }),
    text({
      id: 'text3',
      x: 40,
      y: 110,
      text: 'This is a longer text block that would normally wrap in a real editor. It has multiple words and should help test multi-line selection.',
      fontSize: 14,
      fill: '#334155',
      baseline: 'top'
    }),
    text({
      id: 'text4',
      x: 40,
      y: 180,
      text: 'Text with monospace font rendering',
      font: '14px monospace',
      fontSize: 14,
      fill: '#1e293b',
      baseline: 'top'
    }),
    text({
      id: 'text5',
      x: 40,
      y: 220,
      text: 'W i d e l y   s p a c e d   t e x t',
      fontSize: 14,
      fill: '#475569',
      baseline: 'top'
    }),
    text({
      id: 'text6',
      x: 40,
      y: 270,
      text: 'LARGE TEXT (24px)',
      font: 'bold 24px sans-serif',
      fontSize: 24,
      fill: '#0f172a',
      baseline: 'top'
    }),
    text({
      id: 'text7',
      x: 40,
      y: 320,
      text: 'Text with baseline: alphabetic',
      fontSize: 14,
      fill: '#64748b',
      baseline: 'alphabetic'
    }),
    text({
      id: 'text8',
      x: 40,
      y: 360,
      text: 'Numbers: 0123456789 Symbols: !@#$%^&*()',
      fontSize: 14,
      fill: '#334155',
      baseline: 'top'
    }),
    text({
      id: 'text9',
      x: 40,
      y: 400,
      text: 'IPv4: 192.168.1.1 File: document.pdf Hash: #abc123def',
      font: '13px monospace',
      fontSize: 13,
      fill: '#0f172a',
      baseline: 'top'
    }),
    text({
      id: 'text10',
      x: 40,
      y: 450,
      text: 'Hi',
      fontSize: 16,
      fill: '#475569',
      baseline: 'top'
    }),
    text({
      id: 'text11',
      x: 520,
      y: 30,
      text: 'Wrapped (dx=280): this paragraph intentionally wraps across multiple lines to stress caret placement and range rendering.',
      dx: 280,
      fontSize: 14,
      lineHeight: 20,
      fill: '#0f172a',
      baseline: 'top'
    }),
    text({
      id: 'text12',
      x: 520,
      y: 210,
      text: 'Wrapped (dx=360, lineHeight=28): larger leading should keep selection rectangles aligned to each visual row.',
      dx: 360,
      fontSize: 16,
      lineHeight: 28,
      fill: '#334155',
      baseline: 'top'
    }),
    text({
      id: 'text13',
      x: 520,
      y: 360,
      text: 'Wrapped + clipped (dx=300, dy=56): this line should clip after a couple of rows so we can test edge behavior near the clipping boundary.',
      dx: 300,
      dy: 56,
      fontSize: 14,
      lineHeight: 18,
      fill: '#475569',
      baseline: 'top'
    }),
    text({
      x: 40,
      y: 510,
      text: 'Instructions:',
      fontSize: 14,
      fill: '#334155',
      baseline: 'top',
      fontWeight: 'bold'
    }),
    text({
      x: 40,
      y: 545,
      text: '1. Click on any text block to place a caret and see debug info',
      fontSize: 12,
      fill: '#64748b',
      baseline: 'top'
    }),
    text({
      x: 40,
      y: 570,
      text: '2. Drag to create a range selection',
      fontSize: 12,
      fill: '#64748b',
      baseline: 'top'
    }),
    text({
      x: 40,
      y: 595,
      text: '3. Use arrow keys to navigate (after clicking)',
      fontSize: 12,
      fill: '#64748b',
      baseline: 'top'
    }),
    text({
      x: 40,
      y: 620,
      text: 'Debug info appears below when you interact with the text blocks',
      fontSize: 12,
      fill: '#7c3aed',
      baseline: 'top',
      fontWeight: 'bold'
    }),
  ]);
}
