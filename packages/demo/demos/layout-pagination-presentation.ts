import { group } from 'vitrine';
import { buildPresentationPreview } from '../layout-pagination-preview.ts';
import { documentPresentation, presentationResult } from '../layout-pagination-scenarios.ts';

interface PresentationDemoState {
  currentSlideIndex: number;
  time: number;
}

export const demo = {
  id: 'layout-pagination-presentation',
  name: 'Layout Pagination — Presentation',
  description: 'Fixed-size slide pages for browser presentations',
  category: 'documents',
  size: { width: 1280, height: 860 },
  enableCulling: false,

  init: (): PresentationDemoState => ({
    currentSlideIndex: 0,
    time: 0
  }),

  update: (state: PresentationDemoState, dt: number): void => {
    state.time += dt;
    if (state.time >= 3.5) {
      state.time = 0;
      state.currentSlideIndex = (state.currentSlideIndex + 1) % presentationResult.pages.length;
    }
  },

  render: (state: PresentationDemoState) => group({}, [
    buildPresentationPreview(documentPresentation, presentationResult, {
      currentPageIndex: state.currentSlideIndex
    })
  ]),

  code: `const deck: LayoutDocument = {
  kind: 'presentation',
  page: { width: 1280, height: 720, unit: 'px' },
  slides: [titleSlide, agendaSlide, closingSlide]
};

const result = createPaginatedLayoutEngine().layout(deck);
const preview = buildPresentationPreview(deck, result, {
  currentPageIndex
});`
};
