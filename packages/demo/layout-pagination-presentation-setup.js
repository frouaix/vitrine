import { VitrineComponent } from 'vitrine-gui';
import { buildPresentationPreview } from './layout-pagination-preview.ts';
import { documentPresentation, presentationResult } from './layout-pagination-scenarios.ts';

let currentSlideIndex = 0;
let time = 0;

const component = VitrineComponent.block(() => (
  buildPresentationPreview(documentPresentation, presentationResult, {
    currentPageIndex: currentSlideIndex,
    x: 72,
    y: 92,
    mainScale: 0.86,
    thumbnailScale: 0.17,
    thumbnailGap: 20
  })
), {
  width: 1600,
  height: 980,
  renderMode: 'continuous'
});

component.mount(document.getElementById('canvas'));

let lastTime = performance.now();
function animate(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  time += dt;
  if (time >= 4) {
    time = 0;
    currentSlideIndex = (currentSlideIndex + 1) % presentationResult.pages.length;
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
