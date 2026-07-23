import { VitrineComponent } from 'vitrine-gui';
import { registerTextaBlockType } from 'texta/browser';
import { buildFlowDocumentPreview } from 'vitrine-layout-pagination-adapter';
import { documentFlow, flowResult } from './layout-pagination-scenarios.ts';

registerTextaBlockType();

const component = VitrineComponent.block(() => (
  buildFlowDocumentPreview(documentFlow, flowResult, {
    x: 70,
    y: 86,
    scale: 1.1,
    pageGap: 42,
    columns: 2
  })
), {
  width: 1600,
  height: 1120,
  renderMode: 'continuous'
});

component.mount(document.getElementById('canvas'));
