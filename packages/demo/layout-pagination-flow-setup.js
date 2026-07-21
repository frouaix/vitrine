import { VitrineComponent } from 'vitrine-gui';
import { buildFlowDocumentPreview } from './layout-pagination-preview.ts';
import { documentFlow, flowResult } from './layout-pagination-scenarios.ts';

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
