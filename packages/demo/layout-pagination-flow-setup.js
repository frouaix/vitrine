import { VitrineComponent } from 'vitrine-gui';
import { registerTextaBlockType } from 'texta/browser';
import {
  buildFlowPageFlipWrapper,
  createFlowPageFlipState
} from 'vitrine-layout-pagination-adapter';
import { documentFlow, flowResult } from './layout-pagination-scenarios.ts';

registerTextaBlockType();

const flowFlipState = createFlowPageFlipState();

const component = VitrineComponent.block(() => (
  buildFlowPageFlipWrapper(documentFlow, flowResult, flowFlipState, {
    x: 270,
    y: 96,
    mainScale: 1.12,
    thumbnailScale: 0.18,
    thumbnailGap: 22
  })
), {
  width: 1600,
  height: 1120,
  renderMode: 'continuous'
});

component.mount(document.getElementById('canvas'));
