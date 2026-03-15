import { ReferenceTableLayoutEngine } from "../engine.ts";
import type {
  TableCellMeasurer,
  TableLayoutResult,
  TableModel
} from "../index.ts";

export interface FixtureCellContent {
  key: string;
}

interface FixtureCellMetrics {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
}

const FIXTURE_METRICS_BY_KEY: Record<string, FixtureCellMetrics> = {
  h_name: { minWidth: 56, maxWidth: 72, minHeight: 22 },
  h_role: { minWidth: 44, maxWidth: 68, minHeight: 22 },
  h_status: { minWidth: 58, maxWidth: 84, minHeight: 22 },
  r1_name: { minWidth: 64, maxWidth: 92, minHeight: 20 },
  r1_role: { minWidth: 86, maxWidth: 130, minHeight: 20 },
  r1_status: { minWidth: 52, maxWidth: 70, minHeight: 20 },
  r2_name: { minWidth: 60, maxWidth: 90, minHeight: 20 },
  r2_summary: { minWidth: 180, maxWidth: 260, minHeight: 24 }
};

export function createReferenceLayoutFixtureModel(): TableModel<FixtureCellContent> {
  return {
    id: "fixture-reference-layout",
    cellSpacing: 8,
    columns: [
      { id: "col-name", sizingMode: "fixed", width: { unit: "px", value: 140 } },
      { id: "col-role", width: { unit: "fr", value: 1 }, minWidth: 90 },
      { id: "col-status", width: { unit: "fr", value: 2 }, minWidth: 120 }
    ],
    header: {
      rows: [{ id: "header-0", minHeight: 30 }],
      cells: [
        { id: "h-name", row: 0, col: 0, content: { key: "h_name" } },
        { id: "h-role", row: 0, col: 1, content: { key: "h_role" } },
        { id: "h-status", row: 0, col: 2, content: { key: "h_status" } }
      ]
    },
    body: {
      rows: [{ id: "body-0", minHeight: 28 }, { id: "body-1", minHeight: 28 }],
      cells: [
        { id: "r1-name", row: 0, col: 0, content: { key: "r1_name" } },
        { id: "r1-role", row: 0, col: 1, content: { key: "r1_role" } },
        { id: "r1-status", row: 0, col: 2, content: { key: "r1_status" } },
        { id: "r2-name", row: 1, col: 0, content: { key: "r2_name" } },
        {
          id: "r2-summary",
          row: 1,
          col: 1,
          span: { colSpan: 2 },
          content: { key: "r2_summary" }
        }
      ]
    }
  };
}

export function createReferenceLayoutFixtureMeasurer(): TableCellMeasurer<FixtureCellContent> {
  return {
    measureIntrinsicSize(content: FixtureCellContent): FixtureCellMetrics {
      const metrics = FIXTURE_METRICS_BY_KEY[content.key];
      if (metrics === undefined) {
        return { minWidth: 40, maxWidth: 60, minHeight: 20 };
      }
      return metrics;
    }
  };
}

export function runReferenceLayoutFixture(availableWidth: number = 640): TableLayoutResult {
  const engine = new ReferenceTableLayoutEngine<FixtureCellContent>();
  return engine.layout(
    createReferenceLayoutFixtureModel(),
    { availableWidth },
    createReferenceLayoutFixtureMeasurer()
  );
}

export function assertReferenceLayoutFixture(result: TableLayoutResult): void {
  if (result.columns.length !== 3) {
    throw new Error(`Expected 3 columns, got ${result.columns.length}`);
  }
  if (result.rows.length !== 3) {
    throw new Error(`Expected 3 rows (1 header + 2 body), got ${result.rows.length}`);
  }

  const firstCol = result.columns[0];
  if (Math.abs(firstCol.width - 140) > 1e-6) {
    throw new Error(`Expected fixed first column width 140, got ${firstCol.width}`);
  }

  const summaryCell = result.cells.find((cell) => cell.cellId === "r2-summary");
  if (summaryCell === undefined) {
    throw new Error("Expected r2-summary cell in layout result");
  }

  const secondCol = result.columns[1];
  const thirdCol = result.columns[2];
  const expectedSpanWidth = secondCol.width + thirdCol.width + 8;
  if (Math.abs(summaryCell.width - expectedSpanWidth) > 1e-6) {
    throw new Error(
      `Expected spanned cell width ${expectedSpanWidth}, got ${summaryCell.width}`
    );
  }
}
