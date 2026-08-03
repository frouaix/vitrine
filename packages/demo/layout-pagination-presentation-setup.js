import { VitrineComponent } from 'vitrine-gui';
import { registerTextaBlockType } from 'texta/browser';
import {
  buildPresentationPageFlipWrapper,
  createPresentationPageFlipState
} from 'vitrine-layout-pagination-adapter';
import { documentPresentation, presentationResult } from './layout-pagination-scenarios.ts';

registerTextaBlockType();

const slideFlipState = createPresentationPageFlipState();

const component = VitrineComponent.block(() => (
  buildPresentationPageFlipWrapper(documentPresentation, presentationResult, slideFlipState, {
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
