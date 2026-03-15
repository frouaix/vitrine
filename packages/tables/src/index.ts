export type TableUnits = "px" | "fr" | "auto";

export interface TableLength {
  value: number;
  unit: TableUnits;
}

export interface TableSpacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface TableBorder {
  width: number;
  color: string;
}

export type TableColumnSizingMode = "auto" | "fixed" | "minmax";

export interface TableColumnSpec {
  id: string;
  sizingMode?: TableColumnSizingMode;
  width?: TableLength;
  minWidth?: number;
  maxWidth?: number;
}

export interface TableRowSpec {
  id: string;
  minHeight?: number;
  maxHeight?: number;
}

export interface TableCellSpan {
  rowSpan?: number;
  colSpan?: number;
}

export interface TableCellBoxModel {
  padding?: TableSpacing;
  border?: TableBorder;
}

export interface TableCell<TCellContent = unknown> {
  id: string;
  row: number;
  col: number;
  span?: TableCellSpan;
  box?: TableCellBoxModel;
  content: TCellContent;
}

export interface TableSection<TCellContent = unknown> {
  rows: TableRowSpec[];
  cells: TableCell<TCellContent>[];
}

export interface TableModel<TCellContent = unknown> {
  id: string;
  columns: TableColumnSpec[];
  header?: TableSection<TCellContent>;
  body: TableSection<TCellContent>;
  footer?: TableSection<TCellContent>;
  borderCollapse?: "collapse" | "separate";
  cellSpacing?: number;
}

export interface TableLayoutConstraint {
  availableWidth: number;
  availableHeight?: number;
  pixelRatio?: number;
}

export interface TableColumnLayout {
  col: number;
  x: number;
  width: number;
}

export interface TableRowLayout {
  row: number;
  y: number;
  height: number;
}

export interface TableCellLayout {
  cellId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TableLayoutResult {
  width: number;
  height: number;
  columns: TableColumnLayout[];
  rows: TableRowLayout[];
  cells: TableCellLayout[];
}

export interface TableCellMeasurer<TCellContent = unknown> {
  measureIntrinsicSize(content: TCellContent): { minWidth: number; maxWidth: number; minHeight: number };
}

export interface TableLayoutEngine<TCellContent = unknown> {
  layout(
    table: TableModel<TCellContent>,
    constraint: TableLayoutConstraint,
    measurer: TableCellMeasurer<TCellContent>
  ): TableLayoutResult;
}

export interface TableRenderDelegate<TCellContent = unknown, TRenderNode = unknown> {
  renderCell(content: TCellContent, frame: TableCellLayout): TRenderNode;
}

export { ReferenceTableLayoutEngine } from "./engine.ts";
export {
  assertReferenceLayoutFixture,
  createReferenceLayoutFixtureMeasurer,
  createReferenceLayoutFixtureModel,
  runReferenceLayoutFixture
} from "./__fixtures__/reference-layout-fixture.ts";
