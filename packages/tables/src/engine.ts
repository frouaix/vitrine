import type {
  TableCell,
  TableCellMeasurer,
  TableColumnSpec,
  TableLayoutConstraint,
  TableLayoutEngine,
  TableLayoutResult,
  TableModel,
  TableRowSpec,
  TableSection
} from "./index.ts";

interface IntrinsicSize {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
}

interface CellWithAbsoluteRow<TCellContent> extends TableCell<TCellContent> {
  rowAbsolute: number;
}

function clamp(nValue: number, nMin: number, nMax: number): number {
  return Math.max(nMin, Math.min(nMax, nValue));
}

function getRowCount<TCellContent>(section: TableSection<TCellContent> | undefined): number {
  return section?.rows.length ?? 0;
}

function getCellHorizontalExtras<TCellContent>(cell: TableCell<TCellContent>): number {
  const pad = cell.box?.padding;
  const borderWidth = cell.box?.border?.width ?? 0;
  const padLeft = pad?.left ?? 0;
  const padRight = pad?.right ?? 0;
  return padLeft + padRight + borderWidth * 2;
}

function getCellVerticalExtras<TCellContent>(cell: TableCell<TCellContent>): number {
  const pad = cell.box?.padding;
  const borderWidth = cell.box?.border?.width ?? 0;
  const padTop = pad?.top ?? 0;
  const padBottom = pad?.bottom ?? 0;
  return padTop + padBottom + borderWidth * 2;
}

function applyColumnHardConstraints(
  rgWidthCol: number[],
  rgMinCol: number[],
  rgMaxCol: number[],
  rgColSpec: TableColumnSpec[]
): void {
  for (let iCol = 0; iCol < rgColSpec.length; iCol += 1) {
    const spec = rgColSpec[iCol];
    const nMinBySpec = spec.minWidth ?? 0;
    const nMaxBySpec = spec.maxWidth ?? Number.POSITIVE_INFINITY;

    rgMinCol[iCol] = Math.max(rgMinCol[iCol], nMinBySpec);
    rgMaxCol[iCol] = Math.max(rgMinCol[iCol], Math.min(rgMaxCol[iCol], nMaxBySpec));

    const bFixedPx = (spec.sizingMode === "fixed") && spec.width?.unit === "px";
    if (bFixedPx) {
      const nFixed = Math.max(0, spec.width?.value ?? 0);
      rgMinCol[iCol] = nFixed;
      rgMaxCol[iCol] = nFixed;
      rgWidthCol[iCol] = nFixed;
      continue;
    }

    rgWidthCol[iCol] = clamp(rgWidthCol[iCol], rgMinCol[iCol], rgMaxCol[iCol]);
  }
}

function distributeExtraWidth(
  rgWidthCol: number[],
  rgMaxCol: number[],
  rgWeight: number[],
  nExtra: number
): number {
  if (nExtra <= 0) {
    return 0;
  }

  const rgActive: boolean[] = rgWidthCol.map((nWidth, iCol) => nWidth < rgMaxCol[iCol] && rgWeight[iCol] > 0);
  let nRemaining = nExtra;

  while (nRemaining > 1e-6) {
    let nWeightTotal = 0;
    for (let iCol = 0; iCol < rgWeight.length; iCol += 1) {
      if (rgActive[iCol]) {
        nWeightTotal += rgWeight[iCol];
      }
    }

    if (nWeightTotal <= 0) {
      break;
    }

    let nConsumedThisRound = 0;

    for (let iCol = 0; iCol < rgWeight.length; iCol += 1) {
      if (!rgActive[iCol]) {
        continue;
      }

      const nShare = nRemaining * (rgWeight[iCol] / nWeightTotal);
      const nCapacity = rgMaxCol[iCol] - rgWidthCol[iCol];
      const nDelta = Math.min(nShare, nCapacity);

      rgWidthCol[iCol] += nDelta;
      nConsumedThisRound += nDelta;

      if (rgWidthCol[iCol] >= rgMaxCol[iCol] - 1e-6) {
        rgActive[iCol] = false;
      }
    }

    if (nConsumedThisRound <= 1e-6) {
      break;
    }

    nRemaining -= nConsumedThisRound;
  }

  return Math.max(0, nRemaining);
}

export class ReferenceTableLayoutEngine<TCellContent = unknown>
  implements TableLayoutEngine<TCellContent> {
  layout(
    table: TableModel<TCellContent>,
    constraint: TableLayoutConstraint,
    measurer: TableCellMeasurer<TCellContent>
  ): TableLayoutResult {
    const nCol = table.columns.length;
    if (nCol <= 0) {
      return {
        width: 0,
        height: 0,
        columns: [],
        rows: [],
        cells: []
      };
    }

    const nSpacing = Math.max(0, table.cellSpacing ?? 0);

    const nRowHeader = getRowCount(table.header);
    const nRowBody = getRowCount(table.body);
    const nRowFooter = getRowCount(table.footer);
    const nRowTotal = nRowHeader + nRowBody + nRowFooter;

    const rgRowSpec: TableRowSpec[] = [
      ...(table.header?.rows ?? []),
      ...table.body.rows,
      ...(table.footer?.rows ?? [])
    ];

    const toAbsoluteRows = (
      section: TableSection<TCellContent> | undefined,
      iRowBase: number
    ): CellWithAbsoluteRow<TCellContent>[] => {
      if (section === undefined) {
        return [];
      }

      return section.cells.map((cell): CellWithAbsoluteRow<TCellContent> => {
        return {
          ...cell,
          rowAbsolute: iRowBase + cell.row
        };
      });
    };

    const rgCell: CellWithAbsoluteRow<TCellContent>[] = [
      ...toAbsoluteRows(table.header, 0),
      ...toAbsoluteRows(table.body, nRowHeader),
      ...toAbsoluteRows(table.footer, nRowHeader + nRowBody)
    ];

    // Pass 1: intrinsic requirements per column and row.
    const rgMinCol: number[] = new Array<number>(nCol).fill(0);
    const rgMaxCol: number[] = new Array<number>(nCol).fill(Number.POSITIVE_INFINITY);
    const rgWidthCol: number[] = new Array<number>(nCol).fill(0);

    const rgHeightRow: number[] = new Array<number>(nRowTotal).fill(0);

    for (let iRow = 0; iRow < nRowTotal; iRow += 1) {
      const spec = rgRowSpec[iRow];
      if (spec !== undefined) {
        rgHeightRow[iRow] = Math.max(rgHeightRow[iRow], spec.minHeight ?? 0);
      }
    }

    for (const cell of rgCell) {
      const sizeIntrinsic: IntrinsicSize = measurer.measureIntrinsicSize(cell.content);
      const nExtraX = getCellHorizontalExtras(cell);
      const nExtraY = getCellVerticalExtras(cell);
      const nCellMinW = Math.max(0, sizeIntrinsic.minWidth + nExtraX);
      const nCellMaxW = Math.max(nCellMinW, sizeIntrinsic.maxWidth + nExtraX);
      const nCellMinH = Math.max(0, sizeIntrinsic.minHeight + nExtraY);

      const nColStart = clamp(cell.col, 0, Math.max(0, nCol - 1));
      const nColSpan = Math.max(1, cell.span?.colSpan ?? 1);
      const nColEndExclusive = clamp(nColStart + nColSpan, 0, nCol);
      const nSpanColActual = Math.max(1, nColEndExclusive - nColStart);

      const nRowStart = clamp(cell.rowAbsolute, 0, Math.max(0, nRowTotal - 1));
      const nRowSpan = Math.max(1, cell.span?.rowSpan ?? 1);
      const nRowEndExclusive = clamp(nRowStart + nRowSpan, 0, nRowTotal);
      const nSpanRowActual = Math.max(1, nRowEndExclusive - nRowStart);

      const nPerColMin = nCellMinW / nSpanColActual;
      const nPerColMax = nCellMaxW / nSpanColActual;
      for (let iCol = nColStart; iCol < nColEndExclusive; iCol += 1) {
        rgMinCol[iCol] = Math.max(rgMinCol[iCol], nPerColMin);
        rgWidthCol[iCol] = Math.max(rgWidthCol[iCol], nPerColMin);
        rgMaxCol[iCol] = Math.max(rgMinCol[iCol], Math.min(rgMaxCol[iCol], nPerColMax));
      }

      const nPerRowMin = nCellMinH / nSpanRowActual;
      for (let iRow = nRowStart; iRow < nRowEndExclusive; iRow += 1) {
        rgHeightRow[iRow] = Math.max(rgHeightRow[iRow], nPerRowMin);
      }
    }

    applyColumnHardConstraints(rgWidthCol, rgMinCol, rgMaxCol, table.columns);

    // Pass 2: distribute available width using fr and flexible tracks.
    const nGapTotalCol = nCol > 1 ? nSpacing * (nCol - 1) : 0;
    const nAvailForCols = Math.max(0, constraint.availableWidth - nGapTotalCol);

    const nUsedMin = rgWidthCol.reduce((nAcc, nCur) => nAcc + nCur, 0);
    let nExtra = Math.max(0, nAvailForCols - nUsedMin);

    const rgWeightFr: number[] = table.columns.map((spec): number => {
      if (spec.width?.unit === "fr") {
        return Math.max(0, spec.width.value);
      }
      return 0;
    });

    nExtra = distributeExtraWidth(rgWidthCol, rgMaxCol, rgWeightFr, nExtra);

    const rgWeightFlex: number[] = table.columns.map((spec): number => {
      if (spec.width?.unit === "fr") {
        return 0;
      }
      if (spec.sizingMode === "fixed") {
        return 0;
      }
      return 1;
    });

    distributeExtraWidth(rgWidthCol, rgMaxCol, rgWeightFlex, nExtra);

    // Row caps are applied after intrinsic growth.
    for (let iRow = 0; iRow < nRowTotal; iRow += 1) {
      const spec = rgRowSpec[iRow];
      const nMin = spec?.minHeight ?? 0;
      const nMax = spec?.maxHeight ?? Number.POSITIVE_INFINITY;
      rgHeightRow[iRow] = clamp(rgHeightRow[iRow], nMin, nMax);
    }

    const rgColX: number[] = [];
    let xCur = 0;
    for (let iCol = 0; iCol < nCol; iCol += 1) {
      rgColX.push(xCur);
      xCur += rgWidthCol[iCol];
      if (iCol < nCol - 1) {
        xCur += nSpacing;
      }
    }

    const rgRowY: number[] = [];
    let yCur = 0;
    for (let iRow = 0; iRow < nRowTotal; iRow += 1) {
      rgRowY.push(yCur);
      yCur += rgHeightRow[iRow];
      if (iRow < nRowTotal - 1) {
        yCur += nSpacing;
      }
    }

    const columns = rgWidthCol.map((width, iCol) => {
      return {
        col: iCol,
        x: rgColX[iCol],
        width
      };
    });

    const rows = rgHeightRow.map((height, iRow) => {
      return {
        row: iRow,
        y: rgRowY[iRow],
        height
      };
    });

    const cells = rgCell.map((cell) => {
      const iColStart = clamp(cell.col, 0, Math.max(0, nCol - 1));
      const iRowStart = clamp(cell.rowAbsolute, 0, Math.max(0, nRowTotal - 1));

      const nColSpan = Math.max(1, cell.span?.colSpan ?? 1);
      const nRowSpan = Math.max(1, cell.span?.rowSpan ?? 1);
      const iColEndExclusive = clamp(iColStart + nColSpan, 0, nCol);
      const iRowEndExclusive = clamp(iRowStart + nRowSpan, 0, nRowTotal);

      let width = 0;
      for (let iCol = iColStart; iCol < iColEndExclusive; iCol += 1) {
        width += rgWidthCol[iCol];
      }
      if (iColEndExclusive - iColStart > 1) {
        width += nSpacing * (iColEndExclusive - iColStart - 1);
      }

      let height = 0;
      for (let iRow = iRowStart; iRow < iRowEndExclusive; iRow += 1) {
        height += rgHeightRow[iRow];
      }
      if (iRowEndExclusive - iRowStart > 1) {
        height += nSpacing * (iRowEndExclusive - iRowStart - 1);
      }

      return {
        cellId: cell.id,
        x: rgColX[iColStart] ?? 0,
        y: rgRowY[iRowStart] ?? 0,
        width,
        height
      };
    });

    const widthTable = rgWidthCol.reduce((nAcc, nCur) => nAcc + nCur, 0) + nGapTotalCol;
    const nGapTotalRow = nRowTotal > 1 ? nSpacing * (nRowTotal - 1) : 0;
    const heightTable = rgHeightRow.reduce((nAcc, nCur) => nAcc + nCur, 0) + nGapTotalRow;

    return {
      width: widthTable,
      height: heightTable,
      columns,
      rows,
      cells
    };
  }
}
