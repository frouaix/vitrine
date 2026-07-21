import { group } from 'vitrine';
import { buildFlowDocumentPreview } from '../layout-pagination-preview.ts';
import { documentFlow, flowResult } from '../layout-pagination-scenarios.ts';

export const demo = {
  id: 'layout-pagination-flow',
  name: 'Layout Pagination — Flow Document',
  description: 'Markdown-style flow content with semantic page breaks',
  category: 'documents',
  size: { width: 1280, height: 900 },
  enableCulling: false,

  init: () => ({
    pageCount: flowResult.pages.length
  }),

  render: () => group({}, [
    buildFlowDocumentPreview(documentFlow, flowResult, {
      columns: 2
    })
  ]),

  code: `const doc: LayoutDocument = {
  kind: 'flow',
  page: { width: 612, height: 792, unit: 'pt' },
  header,
  footer,
  body: markdownAsLayoutNodes
};

const result = createPaginatedLayoutEngine().layout(doc);
const preview = buildFlowDocumentPreview(doc, result);`
};
